<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@nuxt/ui/composables'

import { listFaqs, publishFaq, type OpsFaq } from '@/features/ops/api/opsFaqApi'
import { guideCategoryLabel } from '@/shared/lib/domain-labels'
import { useDebouncedValue } from '@/shared/composables/useDebouncedValue'

const router = useRouter()
const toast = useToast()

const faqs = ref<OpsFaq[]>([])
const loading = ref(false)
const error = ref('')
const q = ref('')
const page = ref(1)
const pageSize = 30
const total = ref(0)
const actionError = ref('')

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

// 懒搜索：输入停顿 300ms 后自动回到第 1 页并加载
const debouncedQ = useDebouncedValue(q, 300)
watch(debouncedQ, () => { page.value = 1; load() })

function openCreate() {
  router.push({ name: 'ops-faq-new' })
}
function openEdit(f: OpsFaq) {
  router.push({ name: 'ops-faq-edit', params: { id: f.id } })
}
async function onPublish(f: OpsFaq) {
  actionError.value = ''
  try {
    await publishFaq(f.id)
    toast.add({ title: '已发布', color: 'success' })
    await load()
  } catch (e: unknown) {
    actionError.value = e instanceof Error ? e.message : '发布失败，请稍后重试。'
  }
}

function statusLabel(faq: OpsFaq): string {
  if (faq.publicationState === 'PUBLISHED') return '已发布'
  if (faq.publicationState === 'ARCHIVED') return '已归档'
  return '草稿'
}

function statusColor(faq: OpsFaq): 'success' | 'warning' | 'neutral' {
  if (faq.publicationState === 'PUBLISHED') return 'success'
  if (faq.publicationState === 'ARCHIVED') return 'warning'
  return 'neutral'
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

    <div
      v-if="actionError"
      class="rounded-surface border border-error/30 bg-error/10 px-4 py-3 text-sm text-error"
      role="alert"
    >
      {{ actionError }}
    </div>

    <div
      v-if="loading"
      class="space-y-2"
    >
      <USkeleton class="h-16 w-full" />
      <USkeleton class="h-16 w-full" />
      <USkeleton class="h-16 w-full" />
    </div>
    <div
      v-else-if="error"
      class="flex items-center gap-2 py-3 text-sm text-danger-600"
    >
      <span>{{ error }}</span>
      <UButton size="xs" variant="ghost" @click="load">重试</UButton>
    </div>
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
    <template v-else>
      <div class="hidden overflow-x-auto rounded-lg border border-default bg-default md:block">
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
              :data-test="`faq-row-${f.id}`"
              class="hover:bg-muted/20"
            >
              <td class="px-3 py-2 font-mono text-xs">
                {{ f.sortOrder }}
              </td>
              <td class="px-3 py-2 text-xs">
                {{ guideCategoryLabel[f.category] ?? f.category }}
              </td>
              <td class="px-3 py-2 max-w-[400px] truncate font-medium">
                {{ f.question }}
              </td>
              <td class="px-3 py-2">
                <UBadge
                  :color="statusColor(f)"
                  variant="soft"
                  size="xs"
                >
                  {{ statusLabel(f) }}
                </UBadge>
              </td>
              <td class="px-3 py-2">
                <div class="flex gap-1">
                  <UButton
                    v-if="f.allowedActions.includes('EDIT')"
                    size="xs"
                    variant="ghost"
                    color="neutral"
                    icon="i-lucide-pencil"
                    @click="openEdit(f)"
                  >
                    编辑
                  </UButton>
                  <UButton
                    v-if="f.allowedActions.includes('PUBLISH')"
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
      <!-- Phone 卡片 -->
      <div class="space-y-3 md:hidden">
      <div
        v-for="f in faqs"
        :key="f.id"
        :data-test="`faq-card-${f.id}`"
        class="rounded-xl border border-default bg-default p-5 shadow-sm"
      >
        <div class="flex items-start justify-between gap-2">
          <p class="min-w-0 flex-1 truncate text-sm font-medium text-highlighted">{{ f.question }}</p>
          <UBadge :color="statusColor(f)" variant="soft" size="xs">{{ statusLabel(f) }}</UBadge>
        </div>
        <p class="mt-1 text-xs text-muted">{{ guideCategoryLabel[f.category] ?? f.category }} · 排序 {{ f.sortOrder }}</p>
        <div class="mt-3 flex gap-1">
          <UButton v-if="f.allowedActions.includes('EDIT')" size="xs" variant="ghost" color="neutral" icon="i-lucide-pencil" @click="openEdit(f)">编辑</UButton>
          <UButton v-if="f.allowedActions.includes('PUBLISH')" size="xs" variant="soft" color="primary" @click="onPublish(f)">发布</UButton>
        </div>
      </div>
      </div>
    </template>
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
  </div>
</template>
