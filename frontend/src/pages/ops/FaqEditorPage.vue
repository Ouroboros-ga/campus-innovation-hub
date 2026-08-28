<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { http } from '@/shared/http/client'
import { useToast } from '@nuxt/ui/composables'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const isEdit = computed(() => Boolean(route.params.id))
const id = computed(() => route.params.id as string | undefined)

const category = ref('COMPETITION')
const question = ref('')
const answerMd = ref('')
const sortOrder = ref(0)
const isFeatured = ref(false)

const loading = ref(false)
const saving = ref(false)
const preview = ref(false)
const lastSaved = ref<string | null>(null)
const errors = ref<Record<string, string>>({})

const categoryOptions = [
  { label: '竞赛', value: 'COMPETITION' }, { label: '科研', value: 'RESEARCH' }, { label: '升学', value: 'FURTHER_STUDY' },
  { label: '证书', value: 'CERTIFICATE' }, { label: '流程', value: 'PROCESS' }, { label: '经验', value: 'EXPERIENCE' }, { label: '其他', value: 'OTHER' }
]

async function load() {
  if (!isEdit.value || !id.value) return
  loading.value = true
  try {
    const dto = await http.get<Record<string, unknown>>(`/ops/faq/${id.value}`)
    category.value = (dto.category as string) ?? 'COMPETITION'
    question.value = (dto.question as string) ?? ''
    answerMd.value = (dto.answer_md as string) ?? ''
    sortOrder.value = (dto.sort_order as number) ?? 0
    isFeatured.value = Boolean(dto.is_featured)
  } catch { toast.add({ title: '加载失败', color: 'error' }) } finally { loading.value = false }
}
onMounted(load)
watch(() => route.params.id, load)

function validate(): boolean {
  const errs: Record<string, string> = {}
  if (!question.value.trim()) errs.question = '问题必填'
  if (!answerMd.value.trim()) errs.answerMd = '答案必填'
  errors.value = errs
  return !Object.keys(errs).length
}

async function save(publish = false) {
  if (!validate()) return
  const payload: Record<string, unknown> = { category: category.value, question: question.value.trim(), answer_md: answerMd.value.trim(), sort_order: sortOrder.value, is_featured: isFeatured.value }
  saving.value = true
  try {
    let targetId = id.value ?? null
    if (isEdit.value && targetId) await http.patch(`/ops/faq/${targetId}`, payload)
    else { const res = await http.post<{ id: string }>('/ops/faq', payload); targetId = res.id }
    if (publish && targetId) { await http.post(`/ops/faq/${targetId}/publish`); toast.add({ title: '已发布', color: 'success' }); router.push({ name: 'ops-faq' }) }
    else { lastSaved.value = new Date().toLocaleTimeString(); toast.add({ title: '已保存', color: 'success' }); if (!isEdit.value && targetId) router.replace({ name: 'ops-faq-edit', params: { id: targetId } }) }
  } catch (e: unknown) { toast.add({ title: '保存失败', description: e instanceof Error ? e.message : String(e), color: 'error' }) } finally { saving.value = false }
}
</script>

<template>
  <div class="min-h-dvh bg-canvas">
    <header class="sticky top-0 z-20 border-b border-default bg-default/80 backdrop-blur">
      <div class="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div class="flex items-center gap-3">
          <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" :to="{ name: 'ops-faq' }">FAQ 管理</UButton>
          <span class="hidden text-sm font-medium sm:block">{{ isEdit ? '编辑 FAQ' : '新建 FAQ' }}</span>
          <span v-if="lastSaved" class="hidden text-xs text-muted sm:block">已保存 {{ lastSaved }}</span>
        </div>
        <div class="flex items-center gap-2">
          <UButton color="neutral" variant="ghost" :icon="preview ? 'i-lucide-pencil' : 'i-lucide-eye'" @click="preview = !preview">{{ preview ? '编辑' : '预览' }}</UButton>
          <UButton color="neutral" variant="outline" :loading="saving" @click="save(false)">保存</UButton>
          <UButton color="primary" :loading="saving" @click="save(true)">保存并发布</UButton>
        </div>
      </div>
    </header>

    <div v-if="loading" class="mx-auto max-w-[900px] px-4 py-20 text-center text-sm text-muted sm:px-6">正在加载…</div>
    <div v-else-if="preview" class="mx-auto max-w-[900px] px-4 py-8 sm:px-6">
      <div class="mb-4 flex items-center justify-between"><UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" @click="preview=false">返回编辑</UButton><UBadge color="neutral" variant="soft" size="xs">预览</UBadge></div>
      <article class="rounded-xl border border-default bg-default p-6 shadow-sm">
        <p class="text-xs text-muted">{{ category }}</p>
        <h1 class="mt-1 text-lg font-semibold text-highlighted">{{ question || '问题' }}</h1>
        <div class="prose prose-sm mt-4 max-w-none dark:prose-invert whitespace-pre-wrap text-sm leading-relaxed">{{ answerMd || '答案预览…' }}</div>
      </article>
    </div>
    <div v-else class="mx-auto max-w-[900px] px-4 py-8 sm:px-6">
      <div class="rounded-xl border border-default bg-default shadow-sm">
        <section class="border-b border-default p-6">
          <h2 class="text-sm font-semibold text-highlighted">基本信息</h2>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <UFormField label="分类" required><USelect v-model="category" :items="categoryOptions" class="w-full" /></UFormField>
            <UFormField label="排序"><UInput v-model.number="sortOrder" type="number" :min="0" class="w-full" /></UFormField>
          </div>
          <UFormField label="问题" required :error="errors.question" class="mt-4"><UInput v-model="question" placeholder="如：如何找到适合自己的竞赛？" class="w-full" /></UFormField>
          <label class="mt-4 flex items-center gap-2 text-sm"><USwitch v-model="isFeatured" /> 首页推荐 / 置顶</label>
        </section>
        <section class="p-6">
          <h2 class="text-sm font-semibold text-highlighted">答案</h2>
          <p class="mt-1 text-xs text-muted">支持 Markdown 列表与加粗，700–900px 宽敞编辑</p>
          <div class="mt-4"><UTextarea v-model="answerMd" :rows="12" placeholder="按步骤说明…" class="w-full font-mono text-sm" /><p v-if="errors.answerMd" class="mt-2 text-xs text-error-600">{{ errors.answerMd }}</p></div>
        </section>
      </div>
    </div>
  </div>
</template>
