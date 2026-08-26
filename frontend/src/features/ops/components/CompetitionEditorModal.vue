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
import type {
  CompetitionCategory,
  CompetitionLevel,
  CompetitionSummary,
  ParticipationMode
} from '@/shared/types/homepage'

/** 竞赛编辑（FE-090 /ops/competitions）。 */
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
    officialUrl: officialUrl.value
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
    :ui="{ content: 'max-w-2xl' }"
    @update:open="close"
  >
    <template #header>
      <h2 class="text-base font-semibold text-highlighted">
        {{ isEdit ? '编辑竞赛' : '新建竞赛' }}
      </h2>
    </template>

    <template #content>
      <form
        class="space-y-4"
        novalidate
        @submit.prevent="save"
      >
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
