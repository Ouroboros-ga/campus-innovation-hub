<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { createOpsBanner, listOpsBanners, patchOpsBanner } from '@/features/ops/api/opsBannerApi'
import type { OpsBanner } from '@/features/ops/api/opsBannerApi'
import { fetchTitlesByIds, getHomepageCuration, patchHomepageCuration, searchAnnouncements, searchCompetitions, searchFaqs, searchGuides } from '@/features/ops/api/opsHomepageApi'
import type { HomepageCuration, PickerOption } from '@/features/ops/api/opsHomepageApi'
import HomePage from '@/pages/home/HomePage.vue'
import { uploadImage } from '@/shared/http/media'

// --- State ---
const router = useRouter()
const banners = ref<OpsBanner[]>([])
const bannersLoading = ref(false)
const bannersError = ref('')

const curation = ref<HomepageCuration>({ featuredCompetitions: [], featuredAnnouncements: [], featuredGuides: [], featuredFaqs: [] })
const curationLoading = ref(false)
const titles = reactive<Record<string, Map<string, string>>>({
  competition: new Map(),
  announcement: new Map(),
  guide: new Map(),
  faq: new Map()
})

const toast = ref<{ msg: string; color: 'success' | 'error' } | null>(null)
let toastTimer: number | null = null
function showToast(msg: string, color: 'success' | 'error' = 'success') {
  toast.value = { msg, color }
  if (toastTimer) window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toast.value = null), 2800) as unknown as number
}

// Banner edit/create
const editOpen = ref(false)
const editing = ref<OpsBanner | null>(null)
const saving = ref(false)
const uploading = ref(false)
const dragOverEdit = ref(false)
const dragOverCreate = ref(false)
const form = reactive({
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

// Curation pickers
const pickerOpen = ref(false)
const pickerType = ref<'competition' | 'announcement' | 'guide' | 'faq'>('competition')
const pickerItems = ref<string[]>([]) // ids in order
const pickerSearch = ref('')
const pickerOptions = ref<PickerOption[]>([])
const pickerSearching = ref(false)
const pickerSaving = ref(false)

const previewOpen = ref(false)
const previewMode = ref<'desktop' | 'mobile'>('desktop')

// Derived
const bannerCount = computed(() => banners.value.length)
const validBanners = computed(() => banners.value.filter(b => b.isActive).length)

// Helpers
function formatRange(b: OpsBanner) {
  if (!b.startAt && !b.endAt) return '长期有效'
  const s = b.startAt ? new Date(b.startAt).toLocaleDateString() : '—'
  const e = b.endAt ? new Date(b.endAt).toLocaleDateString() : '—'
  return `${s} ~ ${e}`
}
function tagColor(label: string | null) {
  if (!label) return 'neutral'
  if (label.includes('校园')) return 'success'
  if (label.includes('竞赛')) return 'primary'
  if (label.includes('招新')) return 'warning'
  if (label.includes('活动')) return 'warning'
  return 'neutral'
}
function linkIcon(type: string) {
  if (type === 'EXTERNAL') return 'i-lucide-external-link'
  if (type === 'INTERNAL') return 'i-lucide-link-2'
  return 'i-lucide-minus'
}
function linkText(b: OpsBanner) {
  if (b.linkType === 'EXTERNAL' && b.externalUrl) return b.externalUrl
  if (b.linkType === 'INTERNAL' && b.internalPath) return b.internalPath
  if (b.linkType === 'NONE') return '无跳转'
  return '—'
}

// Loads
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

async function loadCuration() {
  curationLoading.value = true
  try {
    const cur = await getHomepageCuration()
    curation.value = cur
    // fetch titles for display
    const [cM, aM, gM, fM] = await Promise.all([
      fetchTitlesByIds('competition', cur.featuredCompetitions),
      fetchTitlesByIds('announcement', cur.featuredAnnouncements),
      fetchTitlesByIds('guide', cur.featuredGuides),
      fetchTitlesByIds('faq', cur.featuredFaqs)
    ])
    titles.competition = cM
    titles.announcement = aM
    titles.guide = gM
    titles.faq = fM
  } catch (e: unknown) {
    showToast(e instanceof Error ? e.message : '加载精选失败', 'error')
  } finally {
    curationLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadBanners(), loadCuration()])
})

// Banner actions
function openEdit(b: OpsBanner) {
  editing.value = b
  form.title = b.title
  form.subtitle = b.subtitle ?? ''
  form.category_label = b.categoryLabel ?? ''
  form.image_asset_id = ''
  form.alt_text = b.altText ?? ''
  form.sort_order = b.sortOrder
  form.is_active = b.isActive
  form.link_type = b.linkType
  form.internal_path = b.internalPath ?? ''
  form.external_url = b.externalUrl ?? ''
  form.start_at = b.startAt ? b.startAt.slice(0, 16) : ''
  form.end_at = b.endAt ? b.endAt.slice(0, 16) : ''
  fieldErrors.value = {}
  editOpen.value = true
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

async function onEditFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const res = await uploadImage(file, 'IMAGE')
    form.image_asset_id = res.id
    showToast('图片已上传，保存后生效')
  } catch (err: unknown) {
    showToast(err instanceof Error ? err.message : '上传失败', 'error')
  } finally {
    uploading.value = false
  }
}

async function onCreateFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const res = await uploadImage(file, 'IMAGE')
    createForm.image_asset_id = res.id
    showToast('图片已上传')
  } catch (err: unknown) {
    showToast(err instanceof Error ? err.message : '上传失败', 'error')
  } finally {
    uploading.value = false
  }
}

async function handleDropEdit(e: DragEvent) {
  dragOverEdit.value = false
  const file = e.dataTransfer?.files?.[0]
  if (!file || !file.type.startsWith('image/')) {
    showToast('请拖入图片文件', 'error')
    return
  }
  uploading.value = true
  try {
    const res = await uploadImage(file, 'IMAGE')
    form.image_asset_id = res.id
    showToast('图片已上传，保存后生效')
  } catch (err: unknown) {
    showToast(err instanceof Error ? err.message : '上传失败', 'error')
  } finally {
    uploading.value = false
  }
}

async function handleDropCreate(e: DragEvent) {
  dragOverCreate.value = false
  const file = e.dataTransfer?.files?.[0]
  if (!file || !file.type.startsWith('image/')) {
    showToast('请拖入图片文件', 'error')
    return
  }
  uploading.value = true
  try {
    const res = await uploadImage(file, 'IMAGE')
    createForm.image_asset_id = res.id
    showToast('图片已上传')
  } catch (err: unknown) {
    showToast(err instanceof Error ? err.message : '上传失败', 'error')
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
      subtitle: form.subtitle.trim() || null,
      category_label: form.category_label.trim() || null,
      alt_text: form.alt_text.trim() || null,
      sort_order: Number(form.sort_order),
      is_active: form.is_active,
      link_type: form.link_type
    }
    if (form.link_type === 'INTERNAL') {
      payload.internal_path = form.internal_path.trim() || null
      payload.external_url = null
    } else if (form.link_type === 'EXTERNAL') {
      payload.external_url = form.external_url.trim() || null
      payload.internal_path = null
    } else {
      payload.internal_path = null
      payload.external_url = null
    }
    payload.start_at = form.start_at ? new Date(form.start_at).toISOString() : null
    payload.end_at = form.end_at ? new Date(form.end_at).toISOString() : null
    if (form.image_asset_id) payload.image_asset_id = form.image_asset_id
    await patchOpsBanner(editing.value.id, payload as never)
    showToast('已更新 Banner')
    editOpen.value = false
    await loadBanners()
  } catch (e: unknown) {
    const err = e as { fieldErrors?: Record<string, string>; message?: string }
    if (err.fieldErrors) fieldErrors.value = err.fieldErrors
    showToast(err.message ?? '保存失败', 'error')
  } finally {
    saving.value = false
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
    if (createForm.link_type === 'INTERNAL') payload.internal_path = createForm.internal_path.trim() || null
    else if (createForm.link_type === 'EXTERNAL') payload.external_url = createForm.external_url.trim() || null
    if (createForm.start_at) payload.start_at = new Date(createForm.start_at).toISOString()
    if (createForm.end_at) payload.end_at = new Date(createForm.end_at).toISOString()
    await createOpsBanner(payload as never)
    showToast('已创建 Banner')
    createOpen.value = false
    await loadBanners()
  } catch (e: unknown) {
    const err = e as { fieldErrors?: Record<string, string>; message?: string }
    if (err.fieldErrors) createFieldErrors.value = err.fieldErrors
    showToast(err.message ?? '创建失败', 'error')
  } finally {
    createSaving.value = false
  }
}

async function copyBanner(b: OpsBanner) {
  if (!b.imageAssetId) {
    showToast('原 Banner 无图片，无法复制', 'error')
    return
  }
  try {
    await createOpsBanner({
      title: `${b.title} 副本`,
      subtitle: b.subtitle,
      category_label: b.categoryLabel,
      image_asset_id: b.imageAssetId,
      alt_text: b.altText,
      link_type: b.linkType,
      internal_path: b.internalPath,
      external_url: b.externalUrl,
      start_at: b.startAt,
      end_at: b.endAt,
      is_active: false,
      sort_order: banners.value.length
    })
    showToast('已复制 Banner（默认停用）')
    await loadBanners()
  } catch (e: unknown) {
    showToast(e instanceof Error ? e.message : '复制失败', 'error')
  }
}

async function moveBanner(b: OpsBanner, dir: number) {
  const idx = banners.value.findIndex(x => x.id === b.id)
  const target = idx + dir
  if (target < 0 || target >= banners.value.length) return
  const next = [...banners.value]
  const tmp = next[idx]!
  next[idx] = next[target]!
  next[target] = tmp
  // 批量更新 sort_order
  try {
    for (let i = 0; i < next.length; i++) {
      if (next[i]!.sortOrder !== i) {
        await patchOpsBanner(next[i]!.id, { sort_order: i } as never)
      }
    }
    await loadBanners()
    showToast('排序已更新')
  } catch (e: unknown) {
    showToast(e instanceof Error ? e.message : '排序失败', 'error')
  }
}

// Curation
function openPicker(type: typeof pickerType.value) {
  pickerType.value = type
  const cur = curation.value
  if (type === 'competition') pickerItems.value = [...cur.featuredCompetitions]
  else if (type === 'announcement') pickerItems.value = [...cur.featuredAnnouncements]
  else if (type === 'guide') pickerItems.value = [...cur.featuredGuides]
  else pickerItems.value = [...cur.featuredFaqs]
  pickerSearch.value = ''
  pickerOptions.value = []
  pickerOpen.value = true
}

async function onPickerSearch() {
  const q = pickerSearch.value.trim()
  if (!q) {
    pickerOptions.value = []
    return
  }
  pickerSearching.value = true
  try {
    if (pickerType.value === 'competition') pickerOptions.value = await searchCompetitions(q)
    else if (pickerType.value === 'announcement') pickerOptions.value = await searchAnnouncements(q)
    else if (pickerType.value === 'guide') pickerOptions.value = await searchGuides(q)
    else pickerOptions.value = await searchFaqs(q)
  } catch {
    pickerOptions.value = []
  } finally {
    pickerSearching.value = false
  }
}

function addPickerOption(opt: PickerOption) {
  if (pickerItems.value.includes(opt.id)) {
    showToast('已在精选中', 'error')
    return
  }
  const limits: Record<string, number> = { competition: 8, announcement: 6, guide: 6, faq: 6 }
  const limit = limits[pickerType.value] ?? 6
  if (pickerItems.value.length >= limit) {
    showToast(`最多 ${limit} 条`, 'error')
    return
  }
  pickerItems.value.push(opt.id)
  // 缓存标题
  const mapKey = pickerType.value === 'competition' ? 'competition' : pickerType.value === 'announcement' ? 'announcement' : pickerType.value === 'guide' ? 'guide' : 'faq'
  ;(titles as Record<string, Map<string, string>>)[mapKey]!.set(opt.id, opt.title)
}

function removePickerItem(id: string) {
  pickerItems.value = pickerItems.value.filter(x => x !== id)
}

function movePicker(idx: number, dir: number) {
  const next = [...pickerItems.value]
  const target = idx + dir
  if (target < 0 || target >= next.length) return
  const tmp = next[idx]!
  next[idx] = next[target]!
  next[target] = tmp
  pickerItems.value = next
}

async function savePicker() {
  pickerSaving.value = true
  try {
    const next: HomepageCuration = {
      featuredCompetitions: pickerType.value === 'competition' ? pickerItems.value : curation.value.featuredCompetitions,
      featuredAnnouncements: pickerType.value === 'announcement' ? pickerItems.value : curation.value.featuredAnnouncements,
      featuredGuides: pickerType.value === 'guide' ? pickerItems.value : curation.value.featuredGuides,
      featuredFaqs: pickerType.value === 'faq' ? pickerItems.value : curation.value.featuredFaqs
    }
    await patchHomepageCuration(next)
    showToast('精选已保存')
    pickerOpen.value = false
    await loadCuration()
  } catch (e: unknown) {
    showToast(e instanceof Error ? e.message : '保存失败', 'error')
  } finally {
    pickerSaving.value = false
  }
}

function titleFor(type: string, id: string) {
  const map = titles[type as keyof typeof titles]
  return map?.get(id) ?? id.slice(0, 8)
}

function openPreview(mode: 'desktop' | 'mobile' = 'desktop') {
  previewMode.value = mode
  previewOpen.value = true
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-highlighted">首页运营管理</h1>
        <p class="mt-1 text-sm text-muted">配置首页轮播和精选内容，所有修改将实时生效于正式首页</p>
      </div>
      <div class="flex items-center gap-2">
        <UButton color="neutral" variant="outline" icon="i-lucide-smartphone" @click="openPreview('mobile')">手机预览</UButton>
        <UButton color="primary" icon="i-lucide-eye" @click="openPreview('desktop')">预览首页</UButton>
      </div>
    </div>

    <!-- Banner -->
    <div class="rounded-xl border border-default bg-default shadow-sm">
      <div class="flex items-center justify-between px-4 py-3 sm:px-5">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-images" class="size-4 text-primary-600" />
          <h2 class="text-sm font-semibold text-highlighted">首页轮播 Banner</h2>
        </div>
        <UButton size="sm" icon="i-lucide-plus" @click="openCreate">新建 Banner</UButton>
      </div>

      <div v-if="bannersLoading" class="px-5 py-12 text-center text-sm text-muted">正在加载 Banner…</div>
      <p v-else-if="bannersError" class="px-5 py-6 text-sm text-danger-600">{{ bannersError }}</p>
      <div v-else-if="banners.length===0" class="px-5 py-12 text-center text-sm text-muted">暂无 Banner，点击新建创建首条轮播</div>
      <template v-else>
        <div class="hidden overflow-x-auto md:block">
          <table class="w-full text-left text-sm">
            <thead class="border-y border-default bg-muted/40 text-xs text-muted">
              <tr>
                <th class="w-16 px-3 py-2 font-medium">排序</th>
                <th class="px-3 py-2 font-medium">Banner 内容</th>
                <th class="px-3 py-2 font-medium">标签</th>
                <th class="px-3 py-2 font-medium">跳转目标</th>
                <th class="px-3 py-2 font-medium">生效时间</th>
                <th class="px-3 py-2 font-medium">状态</th>
                <th class="px-3 py-2 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(b, idx) in banners" :key="b.id" class="border-b border-default last:border-0 hover:bg-muted/30">
                <td class="px-3 py-3">
                  <div class="flex items-center gap-1">
                    <UIcon name="i-lucide-grip-vertical" class="size-3.5 text-muted" />
                    <span class="font-mono text-xs">{{ idx+1 }}</span>
                    <div class="ml-1 flex flex-col">
                      <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-chevron-up" :disabled="idx===0" @click="moveBanner(b, -1)" class="h-5 w-5 p-0" />
                      <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-chevron-down" :disabled="idx===banners.length-1" @click="moveBanner(b, 1)" class="h-5 w-5 p-0" />
                    </div>
                  </div>
                </td>
                <td class="px-3 py-3">
                  <div class="flex items-center gap-4">
                    <img v-if="b.imageUrl" :src="b.imageUrl" :alt="b.title" class="h-10 w-16 rounded-md object-cover border border-default bg-muted" />
                    <div v-else class="h-10 w-16 rounded-md border border-dashed border-default bg-muted" />
                    <div class="min-w-0">
                      <p class="truncate text-sm font-medium text-highlighted">{{ b.title }}</p>
                      <p v-if="b.subtitle" class="truncate text-xs text-muted">{{ b.subtitle }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-3 py-3">
                  <UBadge v-if="b.categoryLabel" :color="tagColor(b.categoryLabel) as never" variant="soft" size="xs">{{ b.categoryLabel }}</UBadge>
                  <span v-else class="text-xs text-muted">—</span>
                </td>
                <td class="px-3 py-3">
                  <span class="inline-flex items-center gap-1 text-xs text-toned">
                    <UIcon :name="linkIcon(b.linkType)" class="size-3.5" />
                    <span class="max-w-[180px] truncate font-mono">{{ linkText(b) }}</span>
                  </span>
                </td>
                <td class="px-3 py-3 text-xs text-muted">{{ formatRange(b) }}</td>
                <td class="px-3 py-3">
                  <UBadge :color="b.isActive ? 'success' : 'neutral'" variant="soft" size="xs">{{ b.isActive ? '生效中' : '停用' }}</UBadge>
                </td>
                <td class="px-3 py-3">
                  <div class="flex justify-end items-center gap-1">
                    <UButton size="xs" variant="ghost" color="neutral" @click="openEdit(b)">编辑</UButton>
                    <UButton size="xs" variant="ghost" color="neutral" @click="copyBanner(b)">复制</UButton>
                    <UDropdownMenu :items="[[{label:'停用/启用', icon:'i-lucide-power', onSelect: () => patchOpsBanner(b.id, {is_active: !b.isActive} as never).then(loadBanners)}]]">
                      <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-ellipsis" />
                    </UDropdownMenu>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Mobile cards -->
        <div class="space-y-3 p-3 md:hidden">
          <div v-for="(b, idx) in banners" :key="b.id" class="rounded-lg border border-default p-3">
            <div class="flex gap-4">
              <img v-if="b.imageUrl" :src="b.imageUrl" :alt="b.title" class="h-16 w-20 rounded-md object-cover border border-default" />
              <div v-else class="h-16 w-20 rounded-md border border-dashed bg-muted" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium">{{ b.title }}</p>
                <p class="truncate text-xs text-muted">{{ b.subtitle }}</p>
                <div class="mt-1 flex items-center gap-2">
                  <UBadge v-if="b.categoryLabel" :color="tagColor(b.categoryLabel) as never" variant="soft" size="xs">{{ b.categoryLabel }}</UBadge>
                  <UBadge :color="b.isActive ? 'success' : 'neutral'" variant="soft" size="xs">{{ b.isActive ? '生效中' : '停用' }}</UBadge>
                </div>
              </div>
            </div>
            <div class="mt-2 flex items-center justify-between">
              <span class="text-xs text-muted">#{{ idx+1 }} · {{ formatRange(b) }}</span>
              <UButton size="xs" variant="ghost" @click="openEdit(b)">编辑</UButton>
            </div>
          </div>
        </div>
        <p class="border-t border-default bg-muted/20 px-4 py-2 text-xs text-muted">提示：标题/副标题/标签为叠加层，无需嵌入图片；海报请保持纯净无文字，建议 1920x600px JPG/PNG，轮播按排序从左到右。</p>
      </template>
    </div>

    <!-- 精选 -->
    <div class="rounded-xl border border-default bg-default p-4 shadow-sm">
      <div class="mb-3 flex items-center gap-2">
        <UIcon name="i-lucide-sparkles" class="size-4 text-primary-600" />
        <h2 class="text-sm font-semibold text-highlighted">首页精选内容</h2>
        <span class="text-xs text-muted">选择展示在首页的精选内容，支持拖拽排序</span>
      </div>
      <div v-if="curationLoading" class="py-10 text-center text-sm text-muted">正在加载精选…</div>
      <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <!-- 热门竞赛 -->
        <div class="rounded-lg border border-default bg-default">
          <div class="flex items-center justify-between px-3 py-2">
            <span class="inline-flex items-center gap-1.5 text-sm font-medium"><UIcon name="i-lucide-trophy" class="size-4 text-warning-500" />热门竞赛</span>
            <UBadge variant="soft" color="neutral" size="xs">{{ curation.featuredCompetitions.length }}/8</UBadge>
          </div>
          <div class="space-y-1 px-2">
            <div v-if="curation.featuredCompetitions.length===0" class="py-6 text-center text-xs text-muted">暂未选择</div>
            <div v-for="id in curation.featuredCompetitions" :key="id" class="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted">
              <UIcon name="i-lucide-grip-vertical" class="size-3 text-muted" />
              <span class="flex-1 truncate text-sm">{{ titleFor('competition', id) }}</span>
              <UIcon name="i-lucide-chevron-right" class="size-3 text-muted" />
            </div>
          </div>
          <div class="p-2">
            <UButton block variant="soft" color="neutral" size="sm" @click="openPicker('competition')">管理推荐</UButton>
          </div>
        </div>
        <!-- 通知公告 -->
        <div class="rounded-lg border border-default bg-default">
          <div class="flex items-center justify-between px-3 py-2">
            <span class="inline-flex items-center gap-1.5 text-sm font-medium"><UIcon name="i-lucide-megaphone" class="size-4 text-primary-500" />通知公告</span>
            <UBadge variant="soft" color="neutral" size="xs">{{ curation.featuredAnnouncements.length }}/6</UBadge>
          </div>
          <div class="space-y-1 px-2">
            <div v-if="curation.featuredAnnouncements.length===0" class="py-6 text-center text-xs text-muted">暂未选择</div>
            <div v-for="(id, idx) in curation.featuredAnnouncements" :key="id" class="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted">
              <span class="grid size-5 place-items-center rounded bg-muted font-mono text-xs">{{ idx+1 }}</span>
              <span class="flex-1 truncate text-sm">{{ titleFor('announcement', id) }}</span>
              <UIcon name="i-lucide-chevron-right" class="size-3 text-muted" />
            </div>
          </div>
          <div class="p-2">
            <UButton block variant="soft" color="neutral" size="sm" @click="openPicker('announcement')">管理推荐</UButton>
          </div>
        </div>
        <!-- 热门指南 -->
        <div class="rounded-lg border border-default bg-default">
          <div class="flex items-center justify-between px-3 py-2">
            <span class="inline-flex items-center gap-1.5 text-sm font-medium"><UIcon name="i-lucide-book-open" class="size-4 text-primary-500" />热门指南</span>
            <UBadge variant="soft" color="neutral" size="xs">{{ curation.featuredGuides.length }}/6</UBadge>
          </div>
          <div class="space-y-1 px-2">
            <div v-if="curation.featuredGuides.length===0" class="py-6 text-center text-xs text-muted">暂未选择</div>
            <div v-for="(id, idx) in curation.featuredGuides" :key="id" class="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted">
              <span class="grid size-5 place-items-center rounded bg-muted font-mono text-xs">{{ idx+1 }}</span>
              <span class="flex-1 truncate text-sm">{{ titleFor('guide', id) }}</span>
              <UIcon name="i-lucide-chevron-right" class="size-3 text-muted" />
            </div>
          </div>
          <div class="p-2">
            <UButton block variant="soft" color="neutral" size="sm" @click="openPicker('guide')">管理推荐</UButton>
          </div>
        </div>
        <!-- 常见问题 -->
        <div class="rounded-lg border border-default bg-default">
          <div class="flex items-center justify-between px-3 py-2">
            <span class="inline-flex items-center gap-1.5 text-sm font-medium"><UIcon name="i-lucide-circle-help" class="size-4 text-success-500" />常见问题</span>
            <UBadge variant="soft" color="neutral" size="xs">{{ curation.featuredFaqs.length }}/6</UBadge>
          </div>
          <div class="space-y-1 px-2">
            <div v-if="curation.featuredFaqs.length===0" class="py-6 text-center text-xs text-muted">暂未选择</div>
            <div v-for="(id, idx) in curation.featuredFaqs" :key="id" class="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted">
              <span class="grid size-5 place-items-center rounded bg-muted font-mono text-xs">{{ idx+1 }}</span>
              <span class="flex-1 truncate text-sm">{{ titleFor('faq', id) }}</span>
              <UIcon name="i-lucide-chevron-right" class="size-3 text-muted" />
            </div>
          </div>
          <div class="p-2">
            <UButton block variant="soft" color="neutral" size="sm" @click="openPicker('faq')">管理推荐</UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- 自动聚合 -->
    <div class="rounded-xl border border-default bg-default p-4 shadow-sm">
      <div class="mb-3 flex items-center gap-2">
        <UIcon name="i-lucide-blocks" class="size-4 text-primary-600" />
        <h2 class="text-sm font-semibold">自动聚合内容模块</h2>
        <span class="text-xs text-muted">以下模块由系统自动生成，无需手动配置</span>
      </div>
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="flex items-start gap-4 rounded-lg border border-default bg-muted/30 p-3">
          <span class="grid size-8 place-items-center rounded-md bg-primary-50 text-primary-600"><UIcon name="i-lucide-clock-3" class="size-4" /></span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium">即将截止</p>
            <p class="text-xs text-muted">显示即将截止的竞赛、活动、招新</p>
          </div>
          <UBadge color="success" variant="soft" size="xs">自动生成</UBadge>
        </div>
        <div class="flex items-start gap-4 rounded-lg border border-default bg-muted/30 p-3">
          <span class="grid size-8 place-items-center rounded-md bg-primary-50 text-primary-600"><UIcon name="i-lucide-users" class="size-4" /></span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium">正在组队</p>
            <p class="text-xs text-muted">显示招募中的队伍信息</p>
          </div>
          <UBadge color="success" variant="soft" size="xs">自动生成</UBadge>
        </div>
        <div class="flex items-start gap-4 rounded-lg border border-default bg-muted/30 p-3">
          <span class="grid size-8 place-items-center rounded-md bg-primary-50 text-primary-600"><UIcon name="i-lucide-building-2" class="size-4" /></span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium">正在招新的组织</p>
            <p class="text-xs text-muted">显示发布招新信息的组织</p>
          </div>
          <UBadge color="success" variant="soft" size="xs">自动生成</UBadge>
        </div>
        <div class="flex items-start gap-4 rounded-lg border border-default bg-muted/30 p-3">
          <span class="grid size-8 place-items-center rounded-md bg-primary-50 text-primary-600"><UIcon name="i-lucide-calendar-days" class="size-4" /></span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium">近期活动</p>
            <p class="text-xs text-muted">显示即将开始的活动</p>
          </div>
          <UBadge color="success" variant="soft" size="xs">自动生成</UBadge>
        </div>
      </div>
    </div>

    <!-- 健康 -->
    <div class="rounded-lg border border-default bg-muted/20 p-3 text-xs text-muted">
      <div class="flex flex-wrap items-center gap-4">
        <span>Banner {{ validBanners }}/{{ bannerCount }} 生效</span>
        <span>精选竞赛 {{ curation.featuredCompetitions.length }}/8</span>
        <span>通知公告 {{ curation.featuredAnnouncements.length }}/6</span>
        <span>热门指南 {{ curation.featuredGuides.length }}/6</span>
        <span>常见问题 {{ curation.featuredFaqs.length }}/6</span>
        <span class="ml-auto">保存后立即生效，无需发布流程。</span>
      </div>
    </div>

    <!-- Banner 编辑（局部预览） -->
    <UModal v-model:open="editOpen" title="编辑 Banner" :ui="{ content: 'sm:max-w-[640px]' }">
      <template #body>
        <div class="space-y-4">
          <!-- 局部预览（支持拖入）— 标题/副标题/标签为叠加层，不嵌入图片 -->
          <div
            class="rounded-lg border-2 border-dashed overflow-hidden bg-neutral-900 aspect-video relative flex flex-col justify-end p-4 transition-colors"
            :class="dragOverEdit ? 'border-primary-500' : 'border-default'"
            @dragover.prevent="dragOverEdit = true"
            @dragleave.prevent="dragOverEdit = false"
            @drop.prevent="handleDropEdit"
          >
            <div v-if="dragOverEdit" class="absolute inset-0 z-10 grid place-items-center bg-primary-500/20 text-sm font-medium text-white">松开以上传图片</div>
            <div v-else-if="form.image_asset_id" class="absolute inset-0 bg-muted flex items-center justify-center text-xs text-muted">图片已就绪，保存后生效（标题/标签为叠加文字）</div>
            <!-- scrim 保证文字可读，与首页 HomeCarousel 一致 -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" aria-hidden="true" />
            <span v-if="form.category_label" class="relative w-fit rounded bg-white/90 px-2 py-0.5 text-xs font-semibold">{{ form.category_label }}</span>
            <h3 class="relative mt-2 text-lg font-bold text-white">{{ form.title || '标题' }}</h3>
            <p v-if="form.subtitle" class="relative text-sm text-white/80">{{ form.subtitle }}</p>
          </div>
          <p class="text-xs text-muted">标题/副标题/标签以叠加形式显示，请保持海报图片纯净无文字嵌入。</p>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="标题" :error="fieldErrors.title" required><UInput v-model="form.title" maxlength="80" /></UFormField>
            <UFormField label="排序"><UInput v-model.number="form.sort_order" type="number" :min="0" /></UFormField>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="副标题"><UInput v-model="form.subtitle" maxlength="160" /></UFormField>
            <UFormField label="分类标签"><UInput v-model="form.category_label" maxlength="30" placeholder="校园推荐/竞赛推荐" /></UFormField>
          </div>
          <UFormField label="更换图片" hint="留空不改；海报请保持纯净无文字嵌入，标题为叠加层"><div
            class="flex items-center gap-2 rounded-lg border-2 border-dashed p-2 transition-colors"
            :class="dragOverEdit ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30' : 'border-default bg-muted/20'"
            @dragover.prevent="dragOverEdit = true"
            @dragleave.prevent="dragOverEdit = false"
            @drop.prevent="handleDropEdit"
          >
            <UInput v-model="form.image_asset_id" placeholder="MediaAsset UUID 或拖动/上传" class="flex-1" />
            <label class="inline-flex cursor-pointer items-center gap-1 rounded-md border border-default bg-default px-2 py-1.5 text-xs hover:bg-muted">
              <UIcon name="i-lucide-upload" class="size-3.5" />{{ uploading ? '上传中…' : '选择' }}<input type="file" accept="image/*" class="hidden" @change="onEditFileChange" />
            </label>
          </div>
            <p class="mt-1 text-xs text-muted">
              <UIcon name="i-lucide-mouse-pointer-2" class="size-3 inline" /> 拖动本地图片至虚线框内自动上传
            </p></UFormField>
          <UFormField label="链接类型"><USelect v-model="form.link_type" :items="[{label:'无链接',value:'NONE'},{label:'站内',value:'INTERNAL'},{label:'站外',value:'EXTERNAL'}]" /></UFormField>
          <UFormField v-if="form.link_type==='INTERNAL'" label="站内路径"><UInput v-model="form.internal_path" placeholder="/competitions/..." /></UFormField>
          <UFormField v-if="form.link_type==='EXTERNAL'" label="站外链接"><UInput v-model="form.external_url" placeholder="https://..." /></UFormField>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="开始时间"><UInput v-model="form.start_at" type="datetime-local" /></UFormField>
            <UFormField label="结束时间"><UInput v-model="form.end_at" type="datetime-local" /></UFormField>
          </div>
          <UFormField label="启用"><USwitch v-model="form.is_active" /></UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="editOpen=false">取消</UButton>
          <UButton :loading="saving" @click="savePatch">保存</UButton>
        </div>
      </template>
    </UModal>

    <!-- 新建 -->
    <UModal v-model:open="createOpen" title="新建 Banner" :ui="{ content: 'sm:max-w-[640px]' }">
      <template #body>
        <div class="space-y-3">
          <UFormField label="标题" :error="createFieldErrors.title" required><UInput v-model="createForm.title" maxlength="80" /></UFormField>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="副标题"><UInput v-model="createForm.subtitle" maxlength="160" /></UFormField>
            <UFormField label="分类标签"><UInput v-model="createForm.category_label" maxlength="30" /></UFormField>
          </div>
          <UFormField label="图片" :error="createFieldErrors.image_asset_id" required hint="标题/标签为叠加层，海报请保持纯净无文字嵌入；支持点击选择或拖动">
            <div
              class="flex items-center gap-2 rounded-lg border-2 border-dashed p-2 transition-colors"
              :class="dragOverCreate ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30' : 'border-default bg-muted/20'"
              @dragover.prevent="dragOverCreate = true"
              @dragleave.prevent="dragOverCreate = false"
              @drop.prevent="handleDropCreate"
            >
              <UInput v-model="createForm.image_asset_id" placeholder="MediaAsset UUID 或拖动/上传" class="flex-1" />
              <label class="inline-flex cursor-pointer items-center gap-1 rounded-md border border-default bg-default px-2 py-1.5 text-xs hover:bg-muted">
                <UIcon name="i-lucide-upload" class="size-3.5" />{{ uploading ? '上传中…' : '选择' }}<input type="file" accept="image/*" class="hidden" @change="onCreateFileChange" />
              </label>
            </div>
            <p class="mt-1 text-xs text-muted">
              <UIcon name="i-lucide-mouse-pointer-2" class="size-3 inline" /> 拖动本地 JPG/PNG 图片至虚线框内自动上传（≤5MB）
            </p></UFormField>
          <UFormField label="Alt 文本"><UInput v-model="createForm.alt_text" maxlength="160" /></UFormField>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="排序"><UInput v-model.number="createForm.sort_order" type="number" :min="0" /></UFormField>
            <UFormField label="启用"><USwitch v-model="createForm.is_active" /></UFormField>
          </div>
          <UFormField label="链接类型"><USelect v-model="createForm.link_type" :items="[{label:'无链接',value:'NONE'},{label:'站内',value:'INTERNAL'},{label:'站外',value:'EXTERNAL'}]" /></UFormField>
          <UFormField v-if="createForm.link_type==='INTERNAL'" label="站内路径"><UInput v-model="createForm.internal_path" placeholder="/competitions/..." /></UFormField>
          <UFormField v-if="createForm.link_type==='EXTERNAL'" label="站外链接"><UInput v-model="createForm.external_url" placeholder="https://..." /></UFormField>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="开始时间"><UInput v-model="createForm.start_at" type="datetime-local" /></UFormField>
            <UFormField label="结束时间"><UInput v-model="createForm.end_at" type="datetime-local" /></UFormField>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="createOpen=false">取消</UButton>
          <UButton :loading="createSaving || uploading" @click="saveCreate">创建</UButton>
        </div>
      </template>
    </UModal>

    <!-- 精选管理 -->
    <UModal v-model:open="pickerOpen" :title="pickerType==='competition' ? '首页热门竞赛' : pickerType==='announcement' ? '通知公告' : pickerType==='guide' ? '热门指南' : '常见问题'" :ui="{ content: 'sm:max-w-[560px]' }">
      <template #body>
        <div class="space-y-4">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted">当前展示 {{ pickerItems.length }} 条</span>
            <span class="text-xs text-muted">{{ pickerType==='competition' ? '最多 8' : '最多 6' }}</span>
          </div>
          <div class="space-y-1">
            <div v-if="pickerItems.length===0" class="py-6 text-center text-sm text-muted">暂未选择，去下方搜索添加</div>
            <div v-for="(id, idx) in pickerItems" :key="id" class="flex items-center gap-2 rounded-md border border-default px-2 py-2">
              <UIcon name="i-lucide-grip-vertical" class="size-3.5 text-muted" />
              <span class="grid size-6 place-items-center rounded bg-muted font-mono text-xs">{{ idx+1 }}</span>
              <span class="flex-1 truncate text-sm">{{ titleFor(pickerType === 'competition' ? 'competition' : pickerType === 'announcement' ? 'announcement' : pickerType === 'guide' ? 'guide' : 'faq', id) }}</span>
              <UButton size="xs" variant="ghost" icon="i-lucide-chevron-up" :disabled="idx===0" @click="movePicker(idx, -1)" />
              <UButton size="xs" variant="ghost" icon="i-lucide-chevron-down" :disabled="idx===pickerItems.length-1" @click="movePicker(idx, 1)" />
              <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-x" @click="removePickerItem(id)" />
            </div>
          </div>
          <div class="rounded-lg border border-dashed border-default p-3">
            <p class="text-sm font-medium">添加{{ pickerType==='competition' ? '竞赛' : pickerType==='announcement' ? '公告' : pickerType==='guide' ? '指南' : 'FAQ' }}</p>
            <div class="mt-2 flex gap-2">
              <UInput v-model="pickerSearch" placeholder="搜索..." class="flex-1" @keydown.enter="onPickerSearch" />
              <UButton :loading="pickerSearching" @click="onPickerSearch">搜索</UButton>
            </div>
            <div v-if="pickerOptions.length>0" class="mt-2 max-h-48 space-y-1 overflow-auto">
              <button v-for="opt in pickerOptions" :key="opt.id" class="flex w-full items-center justify-between rounded-md px-2 py-2 text-left hover:bg-muted" :class="pickerItems.includes(opt.id) ? 'bg-muted opacity-60' : ''" @click="addPickerOption(opt)">
                <div class="min-w-0">
                  <p class="truncate text-sm">{{ opt.title }}</p>
                  <p v-if="opt.subtitle" class="text-xs text-muted">{{ opt.subtitle }}</p>
                </div>
                <UIcon :name="pickerItems.includes(opt.id) ? 'i-lucide-check' : 'i-lucide-plus'" class="size-4" />
              </button>
            </div>
            <p v-else-if="pickerSearch" class="mt-2 text-xs text-muted">输入关键词后回车搜索</p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="pickerOpen=false">取消</UButton>
          <UButton :loading="pickerSaving" @click="savePicker">保存</UButton>
        </div>
      </template>
    </UModal>

    <!-- 全屏预览（复用真实 HomeView） -->
    <UDrawer v-model:open="previewOpen" direction="right" :ui="{ content: 'w-full sm:max-w-[100vw] bg-canvas' }">
      <template #content>
        <div class="flex h-dvh flex-col">
          <div class="flex h-14 items-center justify-between border-b border-default bg-default px-4">
            <UButton variant="ghost" icon="i-lucide-arrow-left" @click="previewOpen=false">返回首页运营</UButton>
            <div class="flex items-center gap-1 rounded-lg border border-default p-1">
              <UButton :variant="previewMode==='desktop' ? 'solid' : 'ghost'" size="xs" icon="i-lucide-monitor" @click="previewMode='desktop'">桌面</UButton>
              <UButton :variant="previewMode==='mobile' ? 'solid' : 'ghost'" size="xs" icon="i-lucide-smartphone" @click="previewMode='mobile'">手机</UButton>
            </div>
            <UButton color="primary" icon="i-lucide-external-link" @click="router.push({ name: 'home' })">打开首页</UButton>
          </div>
          <div class="flex-1 overflow-auto bg-canvas">
            <div :class="previewMode==='mobile' ? 'mx-auto max-w-[390px] border-x border-default bg-default min-h-full' : 'mx-auto max-w-[1280px] bg-default min-h-full'">
              <HomePage />
            </div>
          </div>
        </div>
      </template>
    </UDrawer>

    <div v-if="toast" class="fixed bottom-4 right-4 rounded-md border border-default bg-default px-3 py-2 text-sm shadow" :class="toast.color==='success' ? 'text-success-700' : 'text-danger-600'">{{ toast.msg }}</div>
  </div>
</template>

