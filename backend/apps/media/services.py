"""图片上传的内容校验、对象存储和元数据事务。"""

from __future__ import annotations

import hashlib
import uuid
import warnings
from dataclasses import dataclass
from pathlib import PurePosixPath
from typing import BinaryIO

import pillow_avif  # noqa: F401  # 注册 AVIF 解码器。
from django.db import transaction
from django.utils import timezone
from PIL import Image, UnidentifiedImageError

from apps.accounts.models import User
from apps.domain_errors import DomainError
from apps.media.models import MediaAsset
from apps.media.storage import get_object_storage


class UnsupportedMedia(DomainError):
    code = "UNSUPPORTED_MEDIA"
    status = 400
    default_message = "仅支持符合要求的图片文件。"


MAX_IMAGE_BYTES = 5 * 1024 * 1024
_FORMAT_TO_MEDIA = {
    "JPEG": ("image/jpeg", "jpg"),
    "PNG": ("image/png", "png"),
    "WEBP": ("image/webp", "webp"),
    "AVIF": ("image/avif", "avif"),
}


@dataclass(frozen=True)
class ImageInspection:
    mime_type: str
    extension: str
    size_bytes: int
    sha256: str
    width: int
    height: int


def _reset(file: BinaryIO) -> None:
    try:
        file.seek(0)
    except (AttributeError, OSError) as error:
        raise UnsupportedMedia("上传文件不可读取。") from error


def inspect_image(file: BinaryIO, declared_content_type: str | None) -> ImageInspection:
    """同时验证客户端 MIME、真实解码格式、完整内容与大小。"""

    declared_mime = (declared_content_type or "").split(";", 1)[0].strip().lower()
    if declared_mime not in {value[0] for value in _FORMAT_TO_MEDIA.values()}:
        raise UnsupportedMedia

    _reset(file)
    digest = hashlib.sha256()
    size_bytes = 0
    while chunk := file.read(64 * 1024):
        size_bytes += len(chunk)
        if size_bytes > MAX_IMAGE_BYTES:
            raise UnsupportedMedia("图片不能超过 5 MB。")
        digest.update(chunk)
    if size_bytes == 0:
        raise UnsupportedMedia("图片不能为空。")

    try:
        _reset(file)
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(file) as verified:
                verified.verify()
        _reset(file)
        with Image.open(file) as decoded:
            decoded.load()
            actual = decoded.format
            width, height = decoded.size
    except (Image.DecompressionBombError, Image.DecompressionBombWarning, OSError, SyntaxError, UnidentifiedImageError) as error:
        raise UnsupportedMedia("图片内容无法验证。") from error
    finally:
        _reset(file)

    media_type = _FORMAT_TO_MEDIA.get(actual or "")
    if media_type is None or media_type[0] != declared_mime or width < 1 or height < 1:
        raise UnsupportedMedia("图片格式或尺寸不合法。")
    return ImageInspection(
        mime_type=media_type[0],
        extension=media_type[1],
        size_bytes=size_bytes,
        sha256=digest.hexdigest(),
        width=width,
        height=height,
    )


def _safe_original_name(value: object, extension: str) -> str:
    name = str(value or "").replace("\\", "/").rsplit("/", 1)[-1].strip()
    return (name or f"image.{extension}")[:255]


def create_image_asset(*, actor: User, file: BinaryIO, original_name: object, content_type: str | None) -> tuple[MediaAsset, str]:
    """先保存对象；元数据事务失败时尽力删除对象，避免留下孤儿文件。"""

    inspection = inspect_image(file, content_type)
    now = timezone.now()
    object_key = str(PurePosixPath("uploads") / "images" / f"{now:%Y}" / f"{now:%m}" / f"{uuid.uuid4()}.{inspection.extension}")
    storage = get_object_storage()
    stored = storage.save(file, object_key, inspection.mime_type)
    try:
        with transaction.atomic():
            asset = MediaAsset.objects.create(
                created_by=actor,
                kind=MediaAsset.Kind.IMAGE,
                object_key=stored.object_key,
                original_name=_safe_original_name(original_name, inspection.extension),
                mime_type=inspection.mime_type,
                size_bytes=inspection.size_bytes,
                sha256=inspection.sha256,
                width=inspection.width,
                height=inspection.height,
            )
    except Exception:
        try:
            storage.delete(stored.object_key)
        except Exception:
            pass
        raise
    return asset, stored.url
