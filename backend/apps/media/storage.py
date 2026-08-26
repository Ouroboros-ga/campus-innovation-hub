"""媒体文件的存储边界。

领域模型和公开 Serializer 仅依赖本模块的 ``ObjectStorage`` 语义，避免把
本机文件路径或某个云厂商 SDK 扩散到业务域。BE-010 只读取公开 URL；上传
端点以后实现时可复用相同抽象。
"""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path, PurePosixPath
from typing import BinaryIO, Protocol
from urllib.parse import quote, urljoin

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured


@dataclass(frozen=True)
class StoredObject:
    """存储成功后的稳定对象标识与公开读取地址。"""

    object_key: str
    url: str


class ObjectStorage(Protocol):
    """业务代码可依赖的最小对象存储能力。"""

    def save(self, file: BinaryIO, object_key: str, content_type: str) -> StoredObject: ...

    def public_url(self, object_key: str) -> str: ...

    def delete(self, object_key: str) -> None: ...


class S3Client(Protocol):
    """未来 OSS/COS/R2/AWS 适配器需要实现的最小客户端接口。"""

    def upload_fileobj(self, file: BinaryIO, object_key: str, content_type: str) -> None: ...

    def delete_object(self, object_key: str) -> None: ...


def _normalise_object_key(object_key: str) -> str:
    path = PurePosixPath(object_key)
    if not object_key or path.is_absolute() or ".." in path.parts or str(path) in {"", "."}:
        raise ValueError("object_key 必须是相对的对象路径")
    return str(path)


def _public_url(base_url: str, object_key: str) -> str:
    key = _normalise_object_key(object_key)
    base = base_url.rstrip("/") + "/"
    return urljoin(base, quote(key, safe="/"))


class LocalStorageBackend:
    """服务器本地文件系统实现，适用于当前部署与开发环境。"""

    def __init__(self, root: Path, public_base_url: str) -> None:
        self.root = Path(root)
        self.public_base_url = public_base_url

    def _path_for(self, object_key: str) -> Path:
        key = _normalise_object_key(object_key)
        target = (self.root / Path(*PurePosixPath(key).parts)).resolve()
        root = self.root.resolve()
        if root != target and root not in target.parents:
            raise ValueError("object_key 超出本地媒体目录")
        return target

    def save(self, file: BinaryIO, object_key: str, content_type: str) -> StoredObject:
        target = self._path_for(object_key)
        target.parent.mkdir(parents=True, exist_ok=True)
        with target.open("wb") as destination:
            while chunk := file.read(64 * 1024):
                destination.write(chunk)
        return StoredObject(object_key=_normalise_object_key(object_key), url=self.public_url(object_key))

    def public_url(self, object_key: str) -> str:
        return _public_url(self.public_base_url, object_key)

    def delete(self, object_key: str) -> None:
        self._path_for(object_key).unlink(missing_ok=True)


class S3CompatibleStorageBackend:
    """公开 URL 与客户端注入均兼容 S3 API 的 OSS 适配器。

    读取 URL 不依赖 SDK，因此现有只读 API 可以先通过环境变量切换。写入端点
    启动时再由部署层注入对应供应商客户端，避免在业务代码中绑定 boto3 或厂商库。
    """

    def __init__(self, public_base_url: str, client: S3Client | None = None) -> None:
        if not public_base_url.strip():
            raise ImproperlyConfigured("MEDIA_PUBLIC_BASE_URL 是 s3 存储的必填配置")
        self.public_base_url = public_base_url
        self.client = client

    def save(self, file: BinaryIO, object_key: str, content_type: str) -> StoredObject:
        if self.client is None:
            raise ImproperlyConfigured("S3 存储写入需要由部署层提供 S3 client")
        key = _normalise_object_key(object_key)
        self.client.upload_fileobj(file, key, content_type)
        return StoredObject(object_key=key, url=self.public_url(key))

    def public_url(self, object_key: str) -> str:
        return _public_url(self.public_base_url, object_key)

    def delete(self, object_key: str) -> None:
        if self.client is None:
            raise ImproperlyConfigured("S3 存储删除需要由部署层提供 S3 client")
        self.client.delete_object(_normalise_object_key(object_key))


@lru_cache(maxsize=1)
def get_object_storage() -> ObjectStorage:
    """按环境选择存储实现；调用方不感知本地或 OSS。"""

    backend = settings.MEDIA_STORAGE_BACKEND.lower()
    if backend == "local":
        return LocalStorageBackend(settings.MEDIA_ROOT, settings.MEDIA_PUBLIC_BASE_URL or settings.MEDIA_URL)
    if backend == "s3":
        return S3CompatibleStorageBackend(settings.MEDIA_PUBLIC_BASE_URL)
    raise ImproperlyConfigured("MEDIA_STORAGE_BACKEND 仅支持 local 或 s3")
