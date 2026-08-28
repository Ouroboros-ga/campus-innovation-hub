<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useToast } from '@nuxt/ui/composables'

import { createFaq, listFaqs, publishFaq, updateFaq, validateFaq, type FaqEditorDraft, type OpsFaq } from '@/features/ops/api/opsFaqApi'
import { faqCategoryLabel } from '@/shared/lib/domain-labels'
import type { FaqCategory } from '@/shared/types/homepage'

const toast = useToast()
const faqs = ref<OpsFaq[]>([])
const loading = ref(false)
const error = ref('')
const q = ref('')
const page = ref(1)
const pageSize = 30
const total = ref(0)

const modalOpen = ref(false)
const isEdit = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const fieldErrors = ref<Record<string, string>>({})
const form = reactive<FaqEditorDraft>({
  category: 'OTHER' as FaqCategory,
  question: '',
  answerMd: '',
  sortOrder: 0,
  isFeatured: false
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await listFaqs({ q: q.value || undefined, page: page.value, pageSize })
    faqs.value = res.items
    total.value = res.total
  } catch {
    error.value = 'FAQ 列表加载失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function openCreate() {
  isEdit.value = false
  editingId.value = null
  form.category = 'OTHER' as FaqCategory
  form.question = ''
  form.answerMd = ''
  form.sortOrder = faqs.value.length
  form.isFeatured = false
  fieldErrors.value = {}
  modalOpen.value = true
}
function openEdit(f: OpsFaq) {
  isEdit.value = true
  editingId.value = f.id
  form.category = f.category
  form.question = f.question
  form.answerMd = f.answerMd
  form.sortOrder = f.sortOrder
  form.isFeatured = f.isFeatured
  fieldErrors.value = {}
  modalOpen.value = true
}
async function onSave() {
  const errs = validateFaq(form)
  if (Object.keys(errs).length) { fieldErrors.value = errs; return }
  saving.value = true
  try {
    if (isEdit.value && editingId.value) await updateFaq(editingId.value, form)
    else await createFaq(form)
    toast.add({ title: isEdit.value ? '已更新 FAQ' : '已创建 FAQ', color: 'success' })
    modalOpen.value = false
    await load()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '保存失败'
    toast.add({ title: msg, color: 'error' })
  } finally { saving.value = false }
}
async function onPublish(f: OpsFaq) {
  try { await publishFaq(f.id); toast.add({ title: '已发布', color: 'success' }); await load() }
  catch (e: unknown) { toast.add({ title: e instanceof Error ? e.message : '发布失败', color: 'error' }) }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-highlighted">
          FAQ 管理
        </h2>
        <p class="text-sm text-muted">
          运营 FAQ 创建/编辑/发布，与指南同级
        </p>
      </div>
      <div class="flex gap-2">
        <UInput
          v-model="q"
          placeholder="搜索问题"
          size="sm"
          icon="i-lucide-search"
          @keyup.enter="() => { page=1; load() }"
        />
        <UButton
          color="primary"
          size="sm"
          icon="i-lucide-plus"
          @click="openCreate"
        >
          新建 FAQ
        </UButton>
      </div>
    </div>

    <p
      v-if="loading"
      class="text-sm text-muted"
    >
      正在加载…
    </p>
    <p
      v-else-if="error"
      class="text-sm text-danger-600"
    >
      {{ error }}
    </p>
    <UEmpty
      v-else-if="!faqs.length"
      icon="i-lucide-help-circle"
      title="暂无 FAQ"
      description="尝试调整筛选或重新加载后重试。"
      class="rounded-lg border border-default bg-default py-10"
    >
      <template #actions>
        <UButton color="neutral" variant="outline" icon="i-lucide-rotate-ccw" @click="load">重新加载</UButton>
        <UButton color="primary" variant="soft" icon="i-lucide-plus" @click="openCreate">新建 FAQ</UButton>
      </template>
    </UEmpty>
    <div
      v-else
      class="overflow-x-auto rounded-lg border border-default bg-default"
    >
      <table class="w-full text-sm">
        <thead class="bg-muted/40 text-xs text-muted">
          <tr>
            <th class="px-3 py-2 text-left font-medium">
              排序
            </th>
            <th class="px-3 py-2 text-left font-medium">
              分类
            </th>
            <th class="px-3 py-2 text-left font-medium">
              问题
            </th>
            <th class="px-3 py-2 text-left font-medium">
              状态
            </th>
            <th class="px-3 py-2 text-left font-medium">
              操作
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr
            v-for="f in faqs"
            :key="f.id"
            class="hover:bg-muted/20"
          >
            <td class="px-3 py-2 font-mono text-xs">
              {{ f.sortOrder }}
            </td>
            <td class="px-3 py-2 text-xs">
              {{ faqCategoryLabel[f.category] ?? f.category }}
            </td>
            <td class="px-3 py-2 max-w-[400px] truncate font-medium">
              {{ f.question }}
            </td>
            <td class="px-3 py-2">
              <UBadge
                :color="f.publicationState==='PUBLISHED'?'success':'neutral'"
                variant="soft"
                size="xs"
              >
                {{ f.publicationState==='PUBLISHED'?'已发布':'草稿' }}
              </UBadge>
            </td>
            <td class="px-3 py-2">
              <div class="flex gap-1">
                <UButton
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  icon="i-lucide-pencil"
                  @click="openEdit(f)"
                >
                  编辑
                </UButton>
                <UButton
                  v-if="f.publicationState!=='PUBLISHED'"
                  size="xs"
                  variant="soft"
                  color="primary"
                  @click="onPublish(f)"
                >
                  发布
                </UButton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="flex justify-between text-xs text-muted">
      <span>共 {{ total }} 条</span>
      <UPagination
        v-if="total>pageSize"
        :page="page"
        :total="total"
        :items-per-page="pageSize"
        @update:page="p=>{page=p; load()}"
      />
    </div>

    <UModal
      v-model:open="modalOpen"
      :title="isEdit?'编辑 FAQ':'新建 FAQ'"
      :ui="{ content: 'sm:max-w-[560px]' }"
    >
      <template #body>
        <div class="space-y-3">
          <UFormField
            label="分类"
            required
          >
            <USelect
              v-model="form.category"
              :items="Object.entries(faqCategoryLabel).map(([v,l])=>({label:l,value:v}))"
            />
          </UFormField>
          <UFormField
            label="问题"
            :error="fieldErrors.question"
            required
          >
            <UInput
              v-model="form.question"
              maxlength="300"
              placeholder="问题 2-300"
            />
          </UFormField>
          <UFormField
            label="答案"
            :error="fieldErrors.answerMd"
            required
          >
            <UTextarea
              v-model="form.answerMd"
              :rows="8"
              placeholder="支持 Markdown 20000"
            />
          </UFormField>
          <div class="grid grid-cols-2 gap-3">
            <UFormField
              label="排序"
              :error="fieldErrors.sortOrder"
            >
              <UInput
                v-model.number="form.sortOrder"
                type="number"
                :min="0"
              />
            </UFormField>
            <UFormField label="置顶">
              <USwitch v-model="form.isFeatured" />
            </UFormField>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            variant="ghost"
            color="neutral"
            @click="modalOpen=false"
          >
            取消
          </UButton>
          <UButton
            :loading="saving"
            @click="onSave"
          >
            {{ isEdit?'保存':'创建' }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
