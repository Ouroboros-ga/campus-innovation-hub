<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ReplyConsultationModal from '@/features/ops/components/ReplyConsultationModal.vue'
import { listConsultations } from '@/features/ops/api/opsConsultationApi'
import { qaStatusMeta } from '@/features/consultation/lib/consultationLabels'
import type { ConsultQaPost } from '@/features/consultation/types'
import { formatDateTimeCompact } from '@/shared/lib/date'

const route = useRoute()
const router = useRouter()

const rawStatus = route.query.status as string | undefined
const filter = ref<'ALL' | 'PENDING' | 'ANSWERED'>(rawStatus === 'PENDING' || rawStatus === 'ANSWERED' ? rawStatus : 'ALL')
const q = ref((route.query.q as string) ?? '')
const page = ref(Number(route.query.page ?? 1) || 1)
const pageSize = 20
const total = ref(0)

const questions = ref<ConsultQaPost[]>([])
const loading = ref(false)
const error = ref('')

function syncFromRoute() {
  const s = route.query.status as string | undefined
  filter.value = s === 'PENDING' || s === 'ANSWERED' ? s : 'ALL'
  q.value = (route.query.q as string) ?? ''
  page.value = Number(route.query.page ?? 1) || 1
}
function pushRoute(overrides: Record<string, string|undefined> = {}, resetPage=false) {
  const next: Record<string,string> = {}
  const s = overrides.status !== undefined ? overrides.status : filter.value
  const qq = overrides.q !== undefined ? overrides.q : q.value
  const p = resetPage ? '1' : (overrides.page !== undefined ? overrides.page : String(page.value))
  if (s && s !== 'ALL') next.status = s
  if (qq) next.q = qq
  if (Number(p)>1) next.page = String(p)
  router.replace({ query: next })
}

async function loadQuestions() {
  loading.value = true
  error.value = ''
  try {
    const result = await listConsultations({
      status: filter.value === 'ALL' ? undefined : filter.value,
      q: q.value || undefined,
      page: page.value,
      pageSize
    })
    questions.value = result.items
    total.value = result.total
  } catch {
    error.value = '咨询列表加载失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}

watch(() => route.query, () => { syncFromRoute(); loadQuestions() })
onMounted(() => { syncFromRoute(); loadQuestions() })

function onFilter(v: 'ALL'|'PENDING'|'ANSWERED') { filter.value = v; pushRoute({ status: v }, true) }
function onSearch() { pushRoute({}, true) }
function onPageChange(p:number) { pushRoute({ page: String(p) }) }
function onReset() {
  filter.value='ALL'; q.value=''; page.value=1; router.replace({ query: {} })
}

const replyOpen = ref(false)
const replying = ref<ConsultQaPost | null>(null)

function openReply(post: ConsultQaPost) {
  replying.value = post
  replyOpen.value = true
}

const filters = [
  { value: 'ALL', label: '全部' },
  { value: 'PENDING', label: '待回复' },
  { value: 'ANSWERED', label: '已回复' }
] as const
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-highlighted">
          咨询与反馈
        </h2>
        <p class="text-sm text-muted">
          查看待回复咨询并进行官方回复
        </p>
      </div>
      <UButton
        color="neutral"
        variant="outline"
        icon="i-lucide-rotate-ccw"
        @click="onReset"
      >
        重置
      </UButton>
    </div>

    <div class="flex flex-wrap gap-2">
      <UInput
        v-model="q"
        placeholder="搜索标题、内容"
        icon="i-lucide-search"
        size="sm"
        class="w-64"
        @keyup.enter="onSearch"
      />
      <div
        role="group"
        aria-label="咨询状态筛选"
        class="flex flex-wrap gap-2"
      >
        <UButton
          v-for="item in filters"
          :key="item.value"
          size="sm"
          color="neutral"
          :variant="filter === item.value ? 'solid' : 'outline'"
          :aria-pressed="filter === item.value"
          @click="onFilter(item.value)"
        >
          {{ item.label }}
        </UButton>
      </div>
    </div>

    <p
      v-if="loading"
      class="text-sm text-muted"
    >
      正在加载咨询…
    </p>
    <p
      v-else-if="error"
      class="text-sm text-danger-600 dark:text-danger-400"
    >
      {{ error }}
    </p>
    <ul
      v-else-if="questions.length"
      class="space-y-3"
    >
      <li
        v-for="post in questions"
        :key="post.id"
        class="rounded-xl border border-default bg-default p-4"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-highlighted">
              {{ post.question }}
            </p>
            <p class="mt-1 flex flex-wrap gap-1.5 text-xs text-muted">
              <span
                v-for="tag in post.tags"
                :key="tag"
                class="rounded bg-neutral-100 px-1.5 py-0.5 dark:bg-neutral-800"
              >
                {{ tag }}
              </span>
            </p>
            <p class="mt-1 text-xs text-muted">
              {{ post.authorName }} · {{ post.status === 'PENDING' ? '提问于' : '回答于' }} {{ formatDateTimeCompact(post.status === 'PENDING' ? post.createdAt : post.answeredAt) }}
            </p>
          </div>
          <UBadge
            size="sm"
            variant="soft"
            :color="qaStatusMeta[post.status].color"
          >
            {{ qaStatusMeta[post.status].label }}
          </UBadge>
        </div>

        <div class="mt-3 flex flex-wrap gap-2">
          <UButton
            :to="post.detailPath"
            size="sm"
            color="neutral"
            variant="soft"
          >
            查看
          </UButton>
          <UButton
            v-if="post.status === 'PENDING'"
            size="sm"
            color="primary"
            variant="outline"
            icon="i-lucide-message-circle"
            @click="openReply(post)"
          >
            回复
          </UButton>
        </div>
      </li>
    </ul>

    <p
      v-else
      class="text-sm text-muted"
    >
      暂无符合条件的咨询。
    </p>

    <div
      v-if="!loading && !error && total > pageSize"
      class="flex justify-center"
    >
      <UPagination
        :page="page"
        :total="total"
        :items-per-page="pageSize"
        @update:page="onPageChange"
      />
    </div>
    <p
      v-if="!loading && !error"
      class="text-center text-xs text-muted"
    >
      共 {{ total }} 条
    </p>

    <ReplyConsultationModal
      :open="replyOpen"
      :question="replying"
      @update:open="replyOpen = $event"
      @saved="loadQuestions"
    />
  </div>
</template>


