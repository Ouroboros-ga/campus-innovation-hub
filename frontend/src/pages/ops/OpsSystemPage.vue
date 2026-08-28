<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import { getCompetitionHealth } from '@/features/ops/api/opsOverviewApi'
import { createOpsBanner, listOpsBanners, patchOpsBanner } from '@/features/ops/api/opsBannerApi'
import type { OpsBanner } from '@/features/ops/api/opsBannerApi'
import { uploadImage } from '@/shared/http/media'

const health = ref<{ featured: number; featured_limit: number } | null>(null)
const loading = ref(false)
const banners = ref<OpsBanner[]>([])
const bannersLoading = ref(false)
const bannersError = ref('')
const toast = ref<{ show: boolean; msg: string; color: 'success'|'error' } | null>(null)

const editOpen = ref(false)
const saving = ref(false)
const editing = ref<OpsBanner | null>(null)
const form = reactive({
  title: '',
  sort_order: 0,
  is_active: true,
  link_type: 'NONE' as string,
  internal_path: '',
  external_url: '',
  start_at: '',
  end_at: '',
  image_asset_id: ''
})
const fieldErrors = ref<Record<string, string>>({})

const createOpen = ref(false)
const createSaving = ref(false)
const createForm = reactive({
  title: '',
  subtitle: '',
  category_label: '',
  image_asset_id: '',
  alt_text: '',
  sort_order: 0,
  is_active: true,
  link_type: 'NONE' as string,
  internal_path: '',
  external_url: '',
  start_at: '',
  end_at: ''
})
const createFieldErrors = ref<Record<string, string>>({})
const uploading = ref(false)

async function loadHealth() {
  loading.value = true
  try {
    const h = await getCompetitionHealth()
    health.value = { featured: h.featured, featured_limit: h.featured_limit }
  } finally {
    loading.value = false
  }
}

const systemHealth = ref<{ api: string; db: string } | null>(null)
const systemHealthLoading = ref(false)
async function loadSystemHealth() {
  systemHealthLoading.value = true
  try {
    const [a, b] = await Promise.allSettled([
      globalThis.fetch('/api/health').then(r => r.ok ? 'ok' : `http ${r.status}`),
      globalThis.fetch('/api/ready').then(r => r.ok ? 'ready' : `http ${r.status}`)
    ])
    systemHealth.value = {
      api: a.status==='fulfilled' ? String(a.value) : 'error',
      db: b.status==='fulfilled' ? String(b.value) : 'error'
    }
  } catch {
    systemHealth.value = { api: 'error', db: 'error' }
  } finally { systemHealthLoading.value = false }
}

async function loadBanners() {
  bannersLoading.value = true
  bannersError.value = ''
  try {
    const res = await listOpsBanners()
    banners.value = res.items.sort((a, b) => a.sortOrder - b.sortOrder)
  } catch (e: unknown) {
    bannersError.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    bannersLoading.value = false
  }
}

function openEdit(b: OpsBanner) {
  editing.value = b
  form.title = b.title
  form.sort_order = b.sortOrder
  form.is_active = b.isActive
  form.link_type = b.linkType
  form.internal_path = b.internalPath ?? ''
  form.external_url = b.externalUrl ?? ''
  form.start_at = b.startAt ? b.startAt.slice(0,16) : ''
  form.end_at = b.endAt ? b.endAt.slice(0,16) : ''
  form.image_asset_id = ''
  fieldErrors.value = {}
  editOpen.value = true
}

async function onEditFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const res = await uploadImage(file, 'IMAGE')
    form.image_asset_id = res.id
    toast.value = { show: true, msg: '图片已上传，保存后生效', color: 'success' }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '上传失败'
    toast.value = { show: true, msg, color: 'error' }
  } finally {
    uploading.value = false
  }
}

async function savePatch() {
  if (!editing.value) return
  saving.value = true
  fieldErrors.value = {}
  try {
    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      sort_order: Number(form.sort_order),
      is_active: form.is_active,
      link_type: form.link_type
    }
    if (form.link_type === 'INTERNAL') {
      payload.internal_path = form.internal_path?.trim() || null
      payload.external_url = null
    } else if (form.link_type === 'EXTERNAL') {
      payload.external_url = form.external_url?.trim() || null
      payload.internal_path = null
    } else {
      payload.internal_path = null
      payload.external_url = null
    }
    if (form.start_at) payload.start_at = new Date(form.start_at).toISOString()
    else payload.start_at = null
    if (form.end_at) payload.end_at = new Date(form.end_at).toISOString()
    else payload.end_at = null
    if (form.image_asset_id) payload.image_asset_id = form.image_asset_id

    await patchOpsBanner(editing.value.id, payload as never)
    toast.value = { show: true, msg: '已更新 Banner', color: 'success' }
    editOpen.value = false
    await loadBanners()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '保存失败'
    // 尝试解析 fieldErrors 若为 AppError
    const err = e as { fieldErrors?: Record<string, string> }
    if (err.fieldErrors) fieldErrors.value = err.fieldErrors
    toast.value = { show: true, msg, color: 'error' }
  } finally {
    saving.value = false
  }
}

function openCreate() {
  createForm.title = ''
  createForm.subtitle = ''
  createForm.category_label = ''
  createForm.image_asset_id = ''
  createForm.alt_text = ''
  createForm.sort_order = banners.value.length
  createForm.is_active = true
  createForm.link_type = 'NONE'
  createForm.internal_path = ''
  createForm.external_url = ''
  createForm.start_at = ''
  createForm.end_at = ''
  createFieldErrors.value = {}
  createOpen.value = true
}

async function onCreateFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const res = await uploadImage(file, 'IMAGE')
    createForm.image_asset_id = res.id
    toast.value = { show: true, msg: '图片已上传', color: 'success' }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '上传失败'
    toast.value = { show: true, msg, color: 'error' }
  } finally {
    uploading.value = false
  }
}

async function saveCreate() {
  createSaving.value = true
  createFieldErrors.value = {}
  try {
    if (!createForm.image_asset_id) {
      createFieldErrors.value.image_asset_id = '请先上传图片'
      throw new Error('请先上传图片')
    }
    const payload: Record<string, unknown> = {
      title: createForm.title.trim(),
      subtitle: createForm.subtitle.trim() || null,
      category_label: createForm.category_label.trim() || null,
      image_asset_id: createForm.image_asset_id,
      alt_text: createForm.alt_text.trim() || null,
      sort_order: Number(createForm.sort_order),
      is_active: createForm.is_active,
      link_type: createForm.link_type,
      internal_path: null,
      external_url: null,
      start_at: null,
      end_at: null
    }
    if (createForm.link_type === 'INTERNAL') {
      payload.internal_path = createForm.internal_path.trim() || null
    } else if (createForm.link_type === 'EXTERNAL') {
      payload.external_url = createForm.external_url.trim() || null
    }
    if (createForm.start_at) payload.start_at = new Date(createForm.start_at).toISOString()
    if (createForm.end_at) payload.end_at = new Date(createForm.end_at).toISOString()
    await createOpsBanner(payload as never)
    toast.value = { show: true, msg: '已创建 Banner', color: 'success' }
    createOpen.value = false
    await loadBanners()
  } catch (e: unknown) {
    const err = e as { fieldErrors?: Record<string, string> }
    if (err.fieldErrors) createFieldErrors.value = err.fieldErrors
    const msg = e instanceof Error ? e.message : '创建失败'
    if (!createFieldErrors.value.image_asset_id) toast.value = { show: true, msg, color: 'error' }
  } finally {
    createSaving.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadHealth(), loadBanners(), loadSystemHealth()])
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-lg font-semibold text-highlighted">
        系统设置
      </h2>
      <p class="text-sm text-muted">
        只读系统配置与 Banner 运营编辑（PATCH /ops/banners/:id，非 Django Admin 直写）
      </p>
    </div>

    <div
      v-if="loading"
      class="py-10 text-center text-sm text-muted"
    >
      正在加载…
    </div>
    <div
      v-else
      class="grid gap-4 sm:grid-cols-2"
    >
      <div class="rounded-lg border border-default bg-default p-4">
        <h3 class="text-sm font-semibold text-highlighted">
          首页推荐
        </h3>
        <p class="mt-2 text-sm text-toned">
          上限 <span class="font-mono font-medium">{{ health?.featured_limit ?? 15 }}</span>，当前 <span class="font-mono">{{ health?.featured ?? '-' }}</span>
        </p>
        <p class="mt-1 text-xs text-muted">
          对应 `Competition.is_featured/featured_order` 与 `database-design §12.1` 约束。
        </p>
      </div>
      <div class="rounded-lg border border-default bg-default p-4">
        <h3 class="text-sm font-semibold text-highlighted">
          发布窗口
        </h3>
        <p class="mt-2 text-sm text-toned">
          Banner 最多 4 条有效，`is_active` + 时间窗过滤
        </p>
        <p class="mt-1 text-xs text-muted">
          管理路径 `ops/banners`，排序 `sort_order`。
        </p>
      </div>
    </div>

    <div class="rounded-lg border border-default bg-default p-4">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-highlighted">服务状态</h3>
        <UButton
          size="xs"
          variant="ghost"
          color="neutral"
          icon="i-lucide-refresh-cw"
          :loading="systemHealthLoading"
          @click="loadSystemHealth"
        >刷新</UButton>
      </div>
      <div class="mt-2 grid grid-cols-2 gap-3 text-sm">
        <div class="rounded-md bg-muted p-3">
          <p class="text-xs text-muted">API 健康</p>
          <p class="mt-1 font-mono text-sm">{{ systemHealth?.api ?? '—' }}</p>
          <p class="text-xs text-muted">GET /api/health</p>
        </div>
        <div class="rounded-md bg-muted p-3">
          <p class="text-xs text-muted">就绪检查</p>
          <p class="mt-1 font-mono text-sm">{{ systemHealth?.db ?? '—' }}</p>
          <p class="text-xs text-muted">GET /api/ready（DB/迁移）</p>
        </div>
      </div>
      <p class="mt-2 text-xs text-muted">详细负载（CPU/内存/响应率）走服务器 `htop / free -h / journalctl -u campus-innovation-hub-dev`，不进运营面板。</p>
    </div>

    <!-- Banner PATCH 管理 -->
    <div
      id="banner"
      class="rounded-lg border border-default bg-default"
    >
      <div class="flex items-center justify-between border-b border-default px-4 py-3">
        <h3 class="text-sm font-semibold text-highlighted">
          首页 Banner（可编辑）
        </h3>
        <div class="flex items-center gap-2">
          <UButton
            size="xs"
            icon="i-lucide-plus"
            @click="openCreate"
          >
            新建 Banner
          </UButton>
          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-lucide-refresh-cw"
            :loading="bannersLoading"
            @click="loadBanners"
          >
            刷新
          </UButton>
        </div>
      </div>
      <div
        v-if="bannersLoading"
        class="px-4 py-10 text-center text-sm text-muted"
      >
        正在加载 Banner…
      </div>
      <p
        v-else-if="bannersError"
        class="px-4 py-6 text-sm text-danger-600 dark:text-danger-400"
      >
        {{ bannersError }}
      </p>
      <div
        v-else-if="banners.length===0"
        class="px-4 py-10 text-center text-sm text-muted"
      >
        暂无 Banner
      </div>
      <div
        v-else
        class="overflow-x-auto"
      >
        <table class="w-full text-left text-sm">
          <thead class="border-b border-default bg-muted/40 text-xs text-muted">
            <tr>
              <th class="px-3 py-2 font-medium">排序</th>
              <th class="px-3 py-2 font-medium">标题</th>
              <th class="px-3 py-2 font-medium">状态</th>
              <th class="px-3 py-2 font-medium">链接</th>
              <th class="px-3 py-2 font-medium">时间窗</th>
              <th class="px-3 py-2 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="b in banners"
              :key="b.id"
              class="border-b border-default last:border-0 hover:bg-muted/30"
            >
              <td class="px-3 py-2 font-mono text-xs">{{ b.sortOrder }}</td>
              <td class="px-3 py-2 font-medium">{{ b.title }}</td>
              <td class="px-3 py-2">
                <UBadge :color="b.isActive ? 'success' : 'neutral'" variant="soft" size="xs">
                  {{ b.isActive ? '启用' : '停用' }}
                </UBadge>
              </td>
              <td class="px-3 py-2 text-xs">
                <span class="font-mono">{{ b.linkType }}</span>
                <span
                  v-if="b.internalPath"
                  class="ml-1 text-muted"
                >{{ b.internalPath }}</span>
                <span
                  v-else-if="b.externalUrl"
                  class="ml-1 text-muted"
                >{{ b.externalUrl }}</span>
              </td>
              <td class="px-3 py-2 text-xs text-muted">
                <span v-if="b.startAt || b.endAt">{{ b.startAt ? new Date(b.startAt).toLocaleString() : '—' }} ~ {{ b.endAt ? new Date(b.endAt).toLocaleString() : '—' }}</span>
                <span v-else>常显</span>
              </td>
              <td class="px-3 py-2">
                <UButton
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  icon="i-lucide-pencil"
                  @click="openEdit(b)"
                >
                  编辑
                </UButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="rounded-lg border border-default bg-default p-4 sm:col-span-2">
      <h3 class="text-sm font-semibold text-highlighted">
        权限边界
      </h3>
      <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-toned">
        <li>`OPERATOR` 仅运营内容，无用户/组织授权</li>
        <li>`LEADER/ADVISOR` 仅本组织 `manage/organizations/:id`，`ADVISOR` 需 `TEACHER + public_name`</li>
        <li>变更通过审计 `record_audit`，前端经 `PATCH /ops/banners/:id StrictSerializer` 校验</li>
      </ul>
    </div>

    <!-- 编辑弹窗 -->
    <UModal
      v-model:open="editOpen"
      title="编辑 Banner"
      :ui="{ content: 'sm:max-w-[520px]' }"
    >
      <template #body>
        <div class="space-y-3">
          <UFormField
            label="标题"
            :error="fieldErrors.title"
            required
          >
            <UInput
              v-model="form.title"
              maxlength="80"
              placeholder="轮播标题 1-80"
            />
          </UFormField>
          <UFormField
            label="更换图片"
            hint="留空不改，上传后保存生效"
            :error="fieldErrors.image_asset_id"
          >
            <div class="flex items-center gap-2">
              <UInput
                v-model="form.image_asset_id"
                placeholder="MediaAsset UUID 或上传"
                class="flex-1"
              />
              <label class="inline-flex cursor-pointer items-center gap-1 rounded-md border border-default px-2 py-1 text-xs">
                <UIcon name="i-lucide-upload" class="size-3.5" />
                {{ uploading ? '上传中…' : '上传' }}
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="onEditFileChange"
                >
              </label>
            </div>
          </UFormField>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="排序" :error="fieldErrors.sort_order">
              <UInput
                v-model.number="form.sort_order"
                type="number"
                :min="0"
              />
            </UFormField>
            <UFormField label="启用">
              <USwitch v-model="form.is_active" />
            </UFormField>
          </div>
          <UFormField label="链接类型" :error="fieldErrors.link_type">
            <USelect
              v-model="form.link_type"
              :items="[{label:'无链接',value:'NONE'},{label:'站内',value:'INTERNAL'},{label:'站外',value:'EXTERNAL'}]"
            />
          </UFormField>
          <UFormField
            v-if="form.link_type==='INTERNAL'"
            label="站内路径"
            hint="以 / 开头，如 /competitions/xxx"
            :error="fieldErrors.internal_path"
          >
            <UInput
              v-model="form.internal_path"
              placeholder="/competitions/..."
            />
          </UFormField>
          <UFormField
            v-if="form.link_type==='EXTERNAL'"
            label="站外链接"
            :error="fieldErrors.external_url"
          >
            <UInput
              v-model="form.external_url"
              placeholder="https://..."
            />
          </UFormField>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="开始时间">
              <UInput
                v-model="form.start_at"
                type="datetime-local"
              />
            </UFormField>
            <UFormField label="结束时间">
              <UInput
                v-model="form.end_at"
                type="datetime-local"
              />
            </UFormField>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            variant="ghost"
            color="neutral"
            @click="editOpen=false"
          >
            取消
          </UButton>
          <UButton
            :loading="saving"
            @click="savePatch"
          >
            保存
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- 新建弹窗（POST /ops/banners，复用 StrictSerializer + MediaAsset 上传） -->
    <UModal
      v-model:open="createOpen"
      title="新建 Banner"
      :ui="{ content: 'sm:max-w-[560px]' }"
    >
      <template #body>
        <div class="space-y-3">
          <UFormField
            label="标题"
            :error="createFieldErrors.title"
            required
          >
            <UInput
              v-model="createForm.title"
              maxlength="80"
              placeholder="轮播标题 1-80"
            />
          </UFormField>
          <div class="grid grid-cols-2 gap-3">
            <UFormField
              label="副标题"
            >
              <UInput
                v-model="createForm.subtitle"
                maxlength="160"
                placeholder="可选 160"
              />
            </UFormField>
            <UFormField label="分类标签">
              <UInput
                v-model="createForm.category_label"
                maxlength="30"
                placeholder="可选 30"
              />
            </UFormField>
          </div>
          <UFormField
            label="图片"
            :error="createFieldErrors.image_asset_id"
            required
            hint="先上传图片获取 MediaAsset，或直接粘贴已上传的 UUID"
          >
            <div class="flex items-center gap-2">
              <UInput
                v-model="createForm.image_asset_id"
                placeholder="MediaAsset UUID（IMAGE/ACTIVE）"
                class="flex-1"
              />
              <label class="inline-flex cursor-pointer items-center gap-1 rounded-md border border-default px-2 py-1 text-xs">
                <UIcon name="i-lucide-upload" class="size-3.5" />
                {{ uploading ? '上传中…' : '上传' }}
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="onCreateFileChange"
                >
              </label>
            </div>
          </UFormField>
          <UFormField label="Alt 文本">
            <UInput
              v-model="createForm.alt_text"
              maxlength="160"
              placeholder="可选"
            />
          </UFormField>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="排序" :error="createFieldErrors.sort_order">
              <UInput
                v-model.number="createForm.sort_order"
                type="number"
                :min="0"
              />
            </UFormField>
            <UFormField label="启用">
              <USwitch v-model="createForm.is_active" />
            </UFormField>
          </div>
          <UFormField label="链接类型" :error="createFieldErrors.link_type">
            <USelect
              v-model="createForm.link_type"
              :items="[{label:'无链接',value:'NONE'},{label:'站内',value:'INTERNAL'},{label:'站外',value:'EXTERNAL'}]"
            />
          </UFormField>
          <UFormField
            v-if="createForm.link_type==='INTERNAL'"
            label="站内路径"
            hint="以 / 开头"
            :error="createFieldErrors.internal_path"
          >
            <UInput
              v-model="createForm.internal_path"
              placeholder="/competitions/..."
            />
          </UFormField>
          <UFormField
            v-if="createForm.link_type==='EXTERNAL'"
            label="站外链接"
            :error="createFieldErrors.external_url"
          >
            <UInput
              v-model="createForm.external_url"
              placeholder="https://..."
            />
          </UFormField>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="开始时间">
              <UInput
                v-model="createForm.start_at"
                type="datetime-local"
              />
            </UFormField>
            <UFormField label="结束时间">
              <UInput
                v-model="createForm.end_at"
                type="datetime-local"
              />
            </UFormField>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            variant="ghost"
            color="neutral"
            @click="createOpen=false"
          >
            取消
          </UButton>
          <UButton
            :loading="createSaving || uploading"
            @click="saveCreate"
          >
            创建
          </UButton>
        </div>
      </template>
    </UModal>

    <div
      v-if="toast?.show"
      class="fixed bottom-4 right-4 rounded-md border border-default bg-default px-3 py-2 text-sm shadow"
      :class="toast.color==='success' ? 'text-success-700' : 'text-danger-600'"
      role="status"
    >
      {{ toast.msg }}
    </div>
  </div>
</template>
