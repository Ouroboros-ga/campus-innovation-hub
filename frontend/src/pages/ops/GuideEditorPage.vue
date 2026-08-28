<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { http } from '@/shared/http/client'
import { useToast } from '@nuxt/ui/composables'
import MarkdownEditor from '@/shared/components/editor/MarkdownEditor.vue'
import RichContent from '@/shared/components/reader/RichContent.vue'
import { guideCategoryLabel } from '@/shared/lib/domain-labels'
import type { GuideCategory } from '@/shared/types/homepage'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const isEdit = computed(() => Boolean(route.params.id))
const id = computed(() => route.params.id as string | undefined)

const title = ref('')
const category = ref<GuideCategory>('COMPETITION')
const summary = ref('')
const bodyMd = ref('')
const isFeatured = ref(false)

const loading = ref(false)
const saving = ref(false)
const publishing = ref(false)
const preview = ref(false)
const lastSaved = ref<string | null>(null)
const errors = ref<Record<string, string>>({})

const categoryOptions = (Object.keys(guideCategoryLabel) as GuideCategory[]).map(v => ({ label: guideCategoryLabel[v], value: v }))

async function load() {
  if (!isEdit.value || !id.value) return
  loading.value = true
  try {
    const dto = await http.get<Record<string, unknown>>(`/ops/guides/${id.value}`)
    title.value = (dto.title as string) ?? ''
    category.value = (dto.category as GuideCategory) ?? 'COMPETITION'
    summary.value = (dto.summary as string) ?? ''
    bodyMd.value = (dto.body_md as string) ?? ''
    isFeatured.value = Boolean(dto.is_featured)
  } catch (e) { toast.add({ title: '加载失败', color: 'error' }) } finally { loading.value = false }
}
onMounted(load)
watch(() => route.params.id, load)

function validate(): boolean {
  const errs: Record<string, string> = {}
  if (!title.value.trim()) errs.title = '标题必填'
  if (!bodyMd.value.trim()) errs.bodyMd = '正文必填'
  errors.value = errs
  return !Object.keys(errs).length
}

async function save(publish = false) {
  if (!validate()) return
  const payload = { title: title.value.trim(), category: category.value, summary: summary.value.trim() || null, body_md: bodyMd.value.trim(), is_featured: isFeatured.value }
  saving.value = !publish; publishing.value = publish
  try {
    let targetId = id.value ?? null
    if (isEdit.value && targetId) await http.patch(`/ops/guides/${targetId}`, payload)
    else { const res = await http.post<{ id: string }>('/ops/guides', payload); targetId = res.id }
    if (publish && targetId) { await http.post(`/ops/guides/${targetId}/publish`); toast.add({ title: '已发布', color: 'success' }); router.push({ name: 'ops-guides' }) }
    else { lastSaved.value = new Date().toLocaleTimeString(); toast.add({ title: '已保存草稿', color: 'success' }); if (!isEdit.value && targetId) router.replace({ name: 'ops-guide-edit', params: { id: targetId } }) }
  } catch (e: unknown) { toast.add({ title: '保存失败', description: e instanceof Error ? e.message : String(e), color: 'error' }) } finally { saving.value = false; publishing.value = false }
}
</script>

<template>
  <div class="min-h-dvh bg-canvas">
    <header class="sticky top-0 z-20 border-b border-default bg-default/80 backdrop-blur">
      <div class="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div class="flex items-center gap-3">
          <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" :to="{ name: 'ops-guides' }">指南管理</UButton>
          <span class="hidden text-sm font-medium sm:block">{{ isEdit ? '编辑指南' : '新建指南' }}</span>
          <span v-if="lastSaved" class="hidden text-xs text-muted sm:block">已保存 {{ lastSaved }}</span>
        </div>
        <div class="flex items-center gap-2">
          <UButton color="neutral" variant="ghost" :icon="preview ? 'i-lucide-pencil' : 'i-lucide-eye'" @click="preview = !preview">{{ preview ? '编辑' : '预览' }}</UButton>
          <UButton color="neutral" variant="outline" :loading="saving" @click="save(false)">保存草稿</UButton>
          <UButton color="primary" icon="i-lucide-send" :loading="publishing" @click="save(true)">发布</UButton>
        </div>
      </div>
    </header>

    <div v-if="loading" class="mx-auto max-w-[900px] px-4 py-20 text-center text-sm text-muted sm:px-6">正在加载…</div>
    <div v-else-if="preview" class="mx-auto max-w-[900px] px-4 py-8 sm:px-6">
      <div class="mb-4 flex items-center justify-between"><UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" @click="preview=false">返回编辑</UButton><UBadge color="neutral" variant="soft" size="xs">预览 900px</UBadge></div>
      <article class="rounded-xl border border-default bg-default p-6 shadow-sm sm:p-8">
        <p class="text-xs text-muted">{{ guideCategoryLabel[category] }}</p>
        <h1 class="mt-1 text-xl font-bold text-highlighted sm:text-2xl">{{ title || '指南标题' }}</h1>
        <p v-if="summary" class="mt-3 rounded-lg bg-muted p-3 text-sm text-toned">{{ summary }}</p>
        <div class="prose prose-sm mt-6 max-w-none dark:prose-invert"><RichContent :content="bodyMd || '正文预览…'" /></div>
      </article>
    </div>
    <div v-else class="mx-auto max-w-[900px] px-4 py-8 sm:px-6">
      <div class="rounded-xl border border-default bg-default shadow-sm">
        <section class="border-b border-default p-6">
          <h2 class="text-sm font-semibold text-highlighted">基本信息</h2>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <UFormField label="指南标题" required :error="errors.title"><UInput v-model="title" placeholder="如：组队与协作：从找到队友到高效参赛" class="w-full" /></UFormField>
            <UFormField label="指南分类"><USelect v-model="category" :items="categoryOptions" class="w-full" /></UFormField>
          </div>
          <UFormField label="摘要（选填）" class="mt-4"><UInput v-model="summary" placeholder="一句话概述" class="w-full" /></UFormField>
          <label class="mt-4 flex items-center gap-2 text-sm"><USwitch v-model="isFeatured" /> 在指南区块置顶 / 精选</label>
        </section>
        <section class="p-6">
          <h2 class="text-sm font-semibold text-highlighted">正文</h2>
          <p class="mt-1 text-xs text-muted">Markdown · 700–900px 宽敞编辑，支持标题、列表、链接、图片</p>
          <div class="mt-4"><MarkdownEditor v-model="bodyMd" :height="420" /><p v-if="errors.bodyMd" class="mt-2 text-xs text-error-600">{{ errors.bodyMd }}</p></div>
        </section>
      </div>
    </div>
  </div>
</template>
