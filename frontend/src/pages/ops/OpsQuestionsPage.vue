<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import ReplyConsultationModal from '@/features/ops/components/ReplyConsultationModal.vue'
import { listConsultations } from '@/features/ops/api/opsConsultationApi'
import { qaStatusMeta } from '@/features/consultation/lib/consultationLabels'
import type { ConsultQaPost } from '@/features/consultation/types'
import { formatDateTimeCompact } from '@/shared/lib/date'

/** 咨询管理（FE-090 /ops/questions）。 */
const filter = ref<'ALL' | 'PENDING' | 'ANSWERED'>('ALL')

const questions = ref<ConsultQaPost[]>([])
const loading = ref(false)
const error = ref('')

async function loadQuestions() {
  loading.value = true
  error.value = ''
  try {
    const result = await listConsultations({})
    questions.value = result.items
  } catch {
    error.value = '咨询列表加载失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}

onMounted(loadQuestions)

const rows = computed(() =>
  filter.value === 'ALL'
    ? questions.value
    : questions.value.filter(post => post.status === filter.value)
)

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
        @click="filter = item.value"
      >
        {{ item.label }}
      </UButton>
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
      v-else-if="rows.length"
      class="space-y-3"
    >
      <li
        v-for="post in rows"
        :key="post.id"
        class="rounded-surface border border-default bg-default p-4"
      >
        <div class="flex items-start justify-between gap-3">
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
              {{ post.authorName }} · {{ formatDateTimeCompact(post.answeredAt) }}
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

    <ReplyConsultationModal
      :open="replyOpen"
      :question="replying"
      @update:open="replyOpen = $event"
      @saved="loadQuestions"
    />
  </div>
</template>
