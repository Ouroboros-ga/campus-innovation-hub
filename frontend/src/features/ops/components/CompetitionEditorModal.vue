<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useToast } from '@nuxt/ui/composables'

import {
  addCompetition,
  updateCompetition,
  validateCompetition,
  type CompetitionEditorDraft
} from '../lib/opsStore'
import {
  competitionCategoryLabel,
  competitionLevelLabel,
  participationModeLabel
} from '@/shared/lib/domain-labels'
import ContentEditorShell from '@/shared/components/editor/ContentEditorShell.vue'
import CoverUpload from '@/shared/components/upload/CoverUpload.vue'
import FormSection from '@/shared/components/form/FormSection.vue'
import type {
  CompetitionCategory,
  CompetitionLevel,
  CompetitionSummary,
  MediaImage,
  ParticipationMode
} from '@/shared/types/homepage'

/** 竞赛编辑（FE-090 /ops/competitions）。
 *  结构化字段分组 + 封面媒体上传 + 卡片化实时预览（桌面双栏 / 移动 编辑↔预览）。
 */
const props = defineProps<{ open: boolean; competition?: CompetitionSummary | null }>()
const emit = defineEmits<{ 'update:open': [open: boolean]; saved: [] }>()
const toast = useToast()

const name = ref('')
const edition = ref('')
const category = ref<CompetitionCategory>('OTHER')
const level = ref<CompetitionLevel>('SCHOOL')
const participationMode = ref<ParticipationMode>('INDIVIDUAL')
const registrationStartAt = ref('')
const registrationEndAt = ref('')
const officialUrl = ref('')
const cover = ref<MediaImage | null>(null)
const errors = ref<Record<string, string>>({})

const isEdit = computed(() => Boolean(props.competition))

const categoryOptions = (Object.keys(competitionCategoryLabel) as CompetitionCategory[]).map(
  value => ({ label: competitionCategoryLabel[value], value })
)
const levelOptions = (Object.keys(competitionLevelLabel) as CompetitionLevel[]).map(value => ({
  label: competitionLevelLabel[value],
  value
}))
const participationOptions = (Object.keys(participationModeLabel) as ParticipationMode[]).map(
  value => ({ label: participationModeLabel[value], value })
)

watch(
  () => props.open,
  open => {
    if (!open) return
    const competition = props.competition
    name.value = competition?.name ?? ''
    edition.value = competition?.edition ?? ''
    category.value = competition?.category ?? 'OTHER'
    level.value = competition?.level ?? 'SCHOOL'
    participationMode.value = competition?.participationMode ?? 'INDIVIDUAL'
    registrationStartAt.value = competition?.registrationStartAt?.slice(0, 16) ?? ''
    registrationEndAt.value = competition?.registrationEndAt?.slice(0, 16) ?? ''
    officialUrl.value = competition?.officialUrl ?? ''
    cover.value = competition?.cover ? { id: null, src: competition.cover.src, alt: competition.cover.alt } : null
    errors.value = {}
  }
)

function close() {
  emit('update:open', false)
}

function save() {
  const draft: CompetitionEditorDraft = {
    name: name.value,
    edition: edition.value,
    category: category.value,
    level: level.value,
    participationMode: participationMode.value,
    registrationStartAt: registrationStartAt.value,
    registrationEndAt: registrationEndAt.value,
    officialUrl: officialUrl.value,
    cover: cover.value
  }
  const formErrors = validateCompetition(draft)
  errors.value = formErrors
  if (Object.keys(formErrors).length > 0) return

  if (isEdit.value && props.competition) {
    updateCompetition(props.competition.id, draft)
  } else {
    addCompetition(draft)
  }
  toast.add({
    title: isEdit.value ? '已更新竞赛' : '已新建竞赛',
    description: '已保存（mock）。',
    color: 'success',
    icon: 'i-lucide-check-circle'
  })
  close()
  emit('saved')
}
</script>

<template>
  <UModal
    :open="props.open"
    :ui="{ content: 'max-w-5xl' }"
    @update:open="close"
  >
    <template #header>
      <h2 class="text-base font-semibold text-highlighted">
        {{ isEdit ? '编辑竞赛' : '新建竞赛' }}
      </h2>
    </template>

    <template #content>
      <form
        class="space-y-6"
        novalidate
        @submit.prevent="save"
      >
        <ContentEditorShell preview-title="竞赛预览">
          <template #form>
            <CoverUpload
              v-model="cover"
              label="竞赛封面（选填）"
            />

            <FormSection
              title="基本信息"
              description="名称、年份与类型"
            >
              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField
                  label="竞赛名称"
                  name="name"
                  required
                  :error="errors.name"
                >
                  <UInput
                    v-model="name"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="年份"
                  name="edition"
                  required
                  :error="errors.edition"
                >
                  <UInput
                    v-model="edition"
                    placeholder="如：2026"
                    class="w-full"
                  />
                </UFormField>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField label="分类">
                  <USelect
                    v-model="category"
                    :items="categoryOptions"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="级别">
                  <USelect
                    v-model="level"
                    :items="levelOptions"
                    class="w-full"
                  />
                </UFormField>
              </div>

              <UFormField label="参赛形式">
                <USelect
                  v-model="participationMode"
                  :items="participationOptions"
                  class="w-full"
                />
              </UFormField>
            </FormSection>

            <FormSection
              title="报名与链接"
              description="报名时间窗与官网"
            >
              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField label="报名开始">
                  <UInput
                    v-model="registrationStartAt"
                    type="datetime-local"
                    class="w-full"
                  />
                </UFormField>
                <UFormField
                  label="报名截止"
                  name="registrationEndAt"
                  required
                  :error="errors.registrationEndAt"
                >
                  <UInput
                    v-model="registrationEndAt"
                    type="datetime-local"
                    class="w-full"
                  />
                </UFormField>
              </div>

              <UFormField label="官网链接">
                <UInput
                  v-model="officialUrl"
                  placeholder="https://example.com"
                  class="w-full"
                />
              </UFormField>
            </FormSection>
          </template>

          <template #preview>
            <div
              v-if="cover?.src"
              class="mb-4 aspect-video overflow-hidden rounded-surface border border-default"
            >
              <img
                :src="cover.src"
                :alt="cover.alt"
                class="h-full w-full object-cover"
              >
            </div>
            <h3 class="text-lg font-semibold text-highlighted">
              {{ name || '竞赛名称' }}
            </h3>
            <p class="mt-1 text-sm text-muted">
              {{ [edition, competitionLevelLabel[level], competitionCategoryLabel[category]].filter(Boolean).join(' · ') }}
            </p>
            <div class="mt-3 flex flex-wrap gap-1.5">
              <span class="rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-highlighted dark:bg-neutral-800">
                {{ participationModeLabel[participationMode] }}
              </span>
              <span
                v-if="registrationEndAt"
                class="rounded-md bg-primary-50 px-2 py-0.5 text-xs text-primary-700 dark:bg-primary-950 dark:text-primary-300"
              >
                报名截止 {{ registrationEndAt }}
              </span>
            </div>
            <a
              v-if="officialUrl"
              :href="officialUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-4 inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              <UIcon
                name="i-lucide-external-link"
                class="size-3.5"
                aria-hidden="true"
              />
              查看官网
            </a>
          </template>
        </ContentEditorShell>
      </form>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-end gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          @click="close"
        >
          取消
        </UButton>
        <UButton
          color="primary"
          variant="solid"
          icon="i-lucide-save"
          @click="save"
        >
          保存
        </UButton>
      </div>
    </template>
  </UModal>
</template>
