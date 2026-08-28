<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { http } from '@/shared/http/client'
import { useToast } from '@nuxt/ui/composables'
import MarkdownEditor from '@/shared/components/editor/MarkdownEditor.vue'
import RichContent from '@/shared/components/reader/RichContent.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const isEdit = computed(() => Boolean(route.params.id))
const id = computed(() => route.params.id as string | undefined)

const title = ref('')
const publisherScope = ref<'PLATFORM' | 'ACADEMY' | 'UNIVERSITY'>('PLATFORM')
const sourceName = ref('')
const externalUrl = ref('')
const bodyMd = ref('')
const isHomeFeatured = ref(false)
const isPinned = ref(false)

// 关联
type LinkedKind = 'COMPETITION' | 'ACTIVITY' | 'ORGANIZATION' | 'RECRUITMENT'
const linkedKind = ref<LinkedKind>('COMPETITION')
const linkedId = ref<string | null>(null)
const linkedLabel = ref('')
const searchQuery = ref('')
const searchResults = ref<Array<{ id: string; title: string }>>([])
const searching = ref(false)

const loading = ref(false)
const saving = ref(false)
const publishing = ref(false)
const preview = ref(false)
const lastSaved = ref<string | null>(null)

const errors = ref<Record<string, string>>({})

async function load() {
  if (!isEdit.value || !id.value) return
  loading.value = true
  try {
    const dto = await http.get<Record<string, unknown>>(`/ops/announcements/${id.value}`)
    title.value = (dto.title as string) ?? ''
    publisherScope.value = (dto.publisher_scope as typeof publisherScope.value) ?? 'PLATFORM'
    sourceName.value = (dto.source_name as string) ?? ''
    externalUrl.value = (dto.external_url as string) ?? ''
    bodyMd.value = (dto.body_md as string) ?? ''
    isHomeFeatured.value = Boolean(dto.is_home_featured)
    isPinned.value = Boolean(dto.is_pinned)
    // 关联
    const linked = dto.linked_object as Record<string, unknown> | null
    if (linked) {
      linkedKind.value = (linked.type as LinkedKind) ?? 'COMPETITION'
      linkedId.value = linked.id as string
      linkedLabel.value = linked.title as string
    }
  } catch (e) {
    toast.add({ title: '加载失败', description: e instanceof Error ? e.message : String(e), color: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => route.params.id, load)

async function onSearch() {
  const q = searchQuery.value.trim()
  if (!q) { searchResults.value = []; return }
  searching.value = true
  try {
    // 根据类型搜索不同接口
    let path = '/ops/competitions'
    if (linkedKind.value === 'ACTIVITY') path = '/ops/activities'
    else if (linkedKind.value === 'ORGANIZATION') path = '/ops/organizations'
    else if (linkedKind.value === 'RECRUITMENT') path = '/ops/organizations' // 招新需通过组织
    const res = await http.get<{ results: Array<Record<string, unknown>> }>(path, { query: { q, page: 1, page_size: 10 } })
    searchResults.value = res.results.map(r => ({ id: r.id as string, title: (r.name as string) ?? (r.title as string) ?? '' }))
  } catch {
    searchResults.value = []
  } finally { searching.value = false }
}

function selectLinked(opt: { id: string; title: string }) {
  linkedId.value = opt.id
  linkedLabel.value = opt.title
  searchResults.value = []
  searchQuery.value = ''
}

function clearLinked() {
  linkedId.value = null
  linkedLabel.value = ''
}

function validate(): boolean {
  const errs: Record<string, string> = {}
  if (!title.value.trim()) errs.title = '标题必填'
  else if (title.value.trim().length < 2) errs.title = '标题至少 2 字'
  if (!bodyMd.value.trim()) errs.bodyMd = '正文必填'
  // 标题与正文语义一致性轻量检查：标题关键词应在正文中出现
  if (title.value && bodyMd.value) {
    const titleWords = title.value.split(/[,，。\s]+/).filter(w => w.length >= 2).slice(0, 3)
    const body = bodyMd.value
    const missing = titleWords.filter(w => !body.includes(w))
    if (missing.length === titleWords.length && titleWords.length > 0) {
      errs.title = '标题与正文语义不一致，请检查标题是否准确概括正文'
    }
  }
  errors.value = errs
  return Object.keys(errs).length === 0
}

async function save(publish = false) {
  if (!validate()) return
  const payload: Record<string, unknown> = {
    title: title.value.trim(),
    publisher_scope: publisherScope.value,
    source_name: sourceName.value.trim() || null,
    external_url: externalUrl.value.trim() || null,
    body_md: bodyMd.value.trim(),
    is_pinned: isPinned.value,
    is_home_featured: isHomeFeatured.value,
    competition_id: linkedKind.value === 'COMPETITION' ? linkedId.value : null,
    activity_id: linkedKind.value === 'ACTIVITY' ? linkedId.value : null,
    organization_id: linkedKind.value === 'ORGANIZATION' ? linkedId.value : null,
    recruitment_id: linkedKind.value === 'RECRUITMENT' ? linkedId.value : null,
  }
  const wasEdit = isEdit.value
  saving.value = !publish
  publishing.value = publish
  try {
    let targetId = id.value ?? null
    if (wasEdit && targetId) {
      await http.patch(`/ops/announcements/${targetId}`, payload)
    } else {
      const res = await http.post<{ id: string }>('/ops/announcements', payload)
      targetId = res.id
    }
    if (publish && targetId) {
      await http.post(`/ops/announcements/${targetId}/publish`)
      toast.add({ title: '已发布', color: 'success' })
      router.push({ name: 'ops-activities', query: { tab: 'announcements' } })
    } else {
      lastSaved.value = new Date().toLocaleTimeString()
      toast.add({ title: wasEdit ? '已保存草稿' : '已创建草稿', color: 'success' })
      if (!wasEdit && targetId) router.replace({ name: 'ops-announcement-edit', params: { id: targetId } })
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '保存失败'
    toast.add({ title: publish ? '发布失败' : '保存失败', description: msg, color: 'error' })
    // 尝试解析 fieldErrors
    const err = e as { fieldErrors?: Record<string, string> }
    if (err.fieldErrors) errors.value = { ...errors.value, ...err.fieldErrors }
  } finally {
    saving.value = false
    publishing.value = false
  }
}
</script>

<template>
  <div class="min-h-dvh bg-canvas">
    <!-- 顶部操作条 -->
    <header class="sticky top-0 z-20 border-b border-default bg-default/80 backdrop-blur">
      <div class="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div class="flex items-center gap-3">
          <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" :to="{ name: 'ops-activities', query: { tab: 'announcements' } }">
            校园动态
          </UButton>
          <span class="hidden text-muted sm:block">/</span>
          <span class="hidden text-sm font-medium text-highlighted sm:block">{{ isEdit ? '编辑公告' : '新建公告' }}</span>
          <UBadge v-if="isEdit" color="neutral" variant="soft" size="xs">草稿</UBadge>
          <span v-if="lastSaved" class="hidden text-xs text-muted sm:block">已保存 {{ lastSaved }}</span>
        </div>
        <div class="flex items-center gap-2">
          <UButton color="neutral" variant="ghost" :icon="preview ? 'i-lucide-pencil' : 'i-lucide-eye'" @click="preview = !preview">
            {{ preview ? '编辑' : '预览' }}
          </UButton>
          <UButton color="neutral" variant="outline" :loading="saving" @click="save(false)">保存草稿</UButton>
          <UButton color="primary" icon="i-lucide-send" :loading="publishing" @click="save(true)">发布</UButton>
        </div>
      </div>
    </header>

    <div v-if="loading" class="mx-auto max-w-[900px] px-4 py-20 text-center text-sm text-muted sm:px-6">正在加载…</div>

    <!-- 预览态 -->
    <div v-else-if="preview" class="mx-auto max-w-[900px] px-4 py-8 sm:px-6">
      <div class="mb-6 flex items-center justify-between">
        <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" @click="preview = false">返回编辑</UButton>
        <div class="flex items-center gap-1 rounded-lg border border-default p-1">
          <span class="px-2 text-xs text-muted">预览</span>
          <UBadge color="neutral" variant="soft" size="xs">桌面 900px</UBadge>
        </div>
      </div>
      <article class="rounded-xl border border-default bg-default p-6 shadow-sm sm:p-8">
        <h1 class="text-xl font-bold leading-snug text-highlighted sm:text-2xl">{{ title || '公告标题' }}</h1>
        <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
          <span>{{ publisherScope === 'PLATFORM' ? '平台发布' : publisherScope === 'ACADEMY' ? '学院发布' : '学校发布' }}</span>
          <span>·</span>
          <span>{{ new Date().toLocaleDateString() }}</span>
          <span v-if="sourceName">·</span>
          <span v-if="sourceName">信息来源：{{ sourceName }}</span>
        </div>
        <div class="prose prose-sm mt-6 max-w-none dark:prose-invert">
          <RichContent :content="bodyMd || '正文预览…'" />
        </div>
        <div v-if="sourceName || externalUrl" class="mt-8 rounded-lg bg-muted p-4">
          <p class="text-xs font-medium text-highlighted">信息来源</p>
          <p v-if="sourceName" class="mt-1 text-sm text-toned">{{ sourceName }}</p>
          <a v-if="externalUrl" :href="externalUrl" target="_blank" rel="noopener noreferrer" class="mt-2 inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700">
            查看原文 <UIcon name="i-lucide-external-link" class="size-3.5" />
          </a>
        </div>
        <div v-if="linkedLabel" class="mt-6 border-t border-default pt-4">
          <p class="text-xs text-muted">关联内容</p>
          <p class="mt-1 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-sm text-primary-700 dark:bg-primary-950">
            <UIcon name="i-lucide-trophy" class="size-4" />{{ linkedLabel }}
          </p>
        </div>
      </article>
    </div>

    <!-- 编辑态：单栏 900px -->
    <div v-else class="mx-auto max-w-[900px] px-4 py-8 sm:px-6">
      <div class="rounded-xl border border-default bg-default shadow-sm">
        <!-- 发布信息 -->
        <section class="border-b border-default p-6">
          <h2 class="text-sm font-semibold text-highlighted">发布信息</h2>
          <div class="mt-4 space-y-4">
            <UFormField label="公告标题" required :error="errors.title">
              <UInput v-model="title" placeholder="如：关于第十七届服务外包创新创业大赛全国赛结果公示的说明" class="w-full" />
            </UFormField>
            <div class="grid gap-4 sm:grid-cols-3">
              <UFormField label="发布主体">
                <USelect v-model="publisherScope" :items="[{label:'平台',value:'PLATFORM'},{label:'人工智能学院',value:'ACADEMY'},{label:'学校',value:'UNIVERSITY'}]" class="w-full" />
              </UFormField>
              <UFormField label="信息来源" hint="如：大赛官网">
                <UInput v-model="sourceName" placeholder="中国大学生服务外包创新创业大赛官网" class="w-full" />
              </UFormField>
              <UFormField label="原文链接">
                <UInput v-model="externalUrl" placeholder="https://www.fwwb.org.cn/..." class="w-full" />
              </UFormField>
            </div>
          </div>
        </section>

        <!-- 公告正文 -->
        <section class="border-b border-default p-6">
          <h2 class="text-sm font-semibold text-highlighted">公告正文</h2>
          <p class="mt-1 text-xs text-muted">使用 Markdown，支持标题、列表、链接、图片，正文 700–900px 宽敞编辑</p>
          <div class="mt-4">
            <MarkdownEditor v-model="bodyMd" :height="420" />
            <p v-if="errors.bodyMd" class="mt-2 text-xs text-error-600">{{ errors.bodyMd }}</p>
            <p class="mt-2 text-xs text-muted">正文中无需重复“来源/链接”，底部将由页面统一渲染“信息来源 + 查看原文”</p>
          </div>
        </section>

        <!-- 关联内容 -->
        <section class="border-b border-default p-6">
          <h2 class="text-sm font-semibold text-highlighted">关联内容 <span class="font-normal text-muted">可选 · 最多 1 个</span></h2>
          <div v-if="linkedLabel" class="mt-3 flex items-center justify-between rounded-lg border border-default bg-muted p-3">
            <span class="inline-flex items-center gap-2 text-sm">
              <UIcon :name="linkedKind==='COMPETITION' ? 'i-lucide-trophy' : linkedKind==='ACTIVITY' ? 'i-lucide-calendar-days' : linkedKind==='ORGANIZATION' ? 'i-lucide-building-2' : 'i-lucide-users'" class="size-4 text-primary-600" />
              {{ linkedLabel }}
              <UBadge color="neutral" variant="soft" size="xs">{{ linkedKind }}</UBadge>
            </span>
            <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-x" @click="clearLinked">移除</UButton>
          </div>
          <div v-else class="mt-3">
            <div class="flex flex-wrap items-center gap-2">
              <USelect v-model="linkedKind" :items="[{label:'竞赛',value:'COMPETITION'},{label:'活动',value:'ACTIVITY'},{label:'组织',value:'ORGANIZATION'},{label:'招新',value:'RECRUITMENT'}]" class="w-32" />
              <div class="flex flex-1 items-center gap-2">
                <UInput v-model="searchQuery" placeholder="搜索标题…" class="flex-1" @keyup.enter="onSearch" />
                <UButton :loading="searching" @click="onSearch">搜索</UButton>
              </div>
            </div>
            <div v-if="searchResults.length" class="mt-3 max-h-48 space-y-1 overflow-auto rounded-lg border border-default p-2">
              <button v-for="opt in searchResults" :key="opt.id" class="flex w-full items-center justify-between rounded-md px-2 py-2 text-left hover:bg-muted" @click="selectLinked(opt)">
                <span class="truncate text-sm">{{ opt.title }}</span>
                <UIcon name="i-lucide-plus" class="size-4 text-muted" />
              </button>
            </div>
            <p class="mt-2 text-xs text-muted">后端仅允许关联 1 个核心对象（competition/activity/organization/recruitment 之一）</p>
          </div>
        </section>

        <!-- 发布设置 -->
        <section class="p-6">
          <h2 class="text-sm font-semibold text-highlighted">发布设置</h2>
          <div class="mt-3 flex flex-wrap gap-6">
            <label class="flex items-center gap-2 text-sm">
              <USwitch v-model="isHomeFeatured" />
              首页推荐
            </label>
            <label class="flex items-center gap-2 text-sm">
              <USwitch v-model="isPinned" />
              置顶公告
            </label>
          </div>
          <p class="mt-2 text-xs text-muted">首页推荐走 `is_home_featured`，与列表置顶 `is_pinned` 解耦</p>
        </section>
      </div>

      <p class="mx-auto mt-4 max-w-[900px] text-center text-xs text-muted">保存后可在“校园动态管理”中查看，发布后全校可见</p>
    </div>
  </div>
</template>
