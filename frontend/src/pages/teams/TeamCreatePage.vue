<script setup lang="ts">
import { computed, ref } from 'vue'
import { useToast } from '@nuxt/ui/composables'

import PageContainer from '@/shared/components/layout/PageContainer.vue'

import {
  submitTeamPost,
  teamPostCompetitionOptions,
  teamPostTypeOptions,
  validateTeamPostDraft
} from '@/features/teams/lib/teamPost'
import type { TeamPostType } from '@/shared/types/homepage'
import type { TeamPost, TeamPostDraft } from '@/features/teams/types'

/**
 * 发布组队（FE-032）— /teams/create
 *
 * 字段遵循 PRD §发布组队；使用 Nuxt UI 表单控件（UFormField + USelect + UInput/UInputNumber/UTextarea）。
 * 必填校验靠近字段；提交含 loading；成功后展示 mock 成功响应。
 * 联系方式默认不公开（界面提示）。电话取 form shell（§5 / FrontendArchitecture /teams/create）。
 */
const toast = useToast()

const competitionId = ref('')
const postType = ref('')
const title = ref('')
const teamName = ref('')
const direction = ref('')
const baseCount = ref(0)
const targetCount = ref(0)
const currentMembers = ref('')
const rolesText = ref('')
const skillsText = ref('')
const goal = ref('')
const effort = ref('')
const contact = ref('')
const notes = ref('')

const errors = ref<Record<string, string>>({})
const submitting = ref(false)
const submitted = ref(false)
const createdPost = ref<TeamPost | null>(null)

const competitionOptions = teamPostCompetitionOptions()

/** 技能 / 岗位输入以逗号分隔，实时生成 chip 预览。 */
const roleChips = computed(() => splitTags(rolesText.value))
const skillChips = computed(() => splitTags(skillsText.value))

function splitTags(text: string): string[] {
  return text
    .split(/[,，、]/)
    .map(item => item.trim())
    .filter(Boolean)
}

async function submit() {
  const draft: TeamPostDraft = {
    competitionId: competitionId.value,
    postType: postType.value as TeamPostType,
    title: title.value,
    teamName: teamName.value,
    direction: direction.value,
    baseMemberCount: baseCount.value || 0,
    targetMemberCount: targetCount.value || 0,
    currentMembers: currentMembers.value,
    roles: splitTags(rolesText.value),
    skills: splitTags(skillsText.value),
    goal: goal.value,
    expectedEffort: effort.value,
    contact: contact.value,
    notes: notes.value
  }

  const formErrors = validateTeamPostDraft(draft)
  errors.value = formErrors
  if (Object.keys(formErrors).length > 0) return

  submitting.value = true
  try {
    const post = await submitTeamPost(draft)
    createdPost.value = post
    submitted.value = true
    toast.add({
      title: '组队已发布',
      description: '你的组队信息已成功发布。',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="py-10 sm:py-14">
    <PageContainer class="max-w-2xl">
      <template v-if="submitted && createdPost">
        <div class="flex flex-col items-center gap-3 rounded-surface border border-default bg-default p-8 text-center">
          <span
            class="grid size-12 place-items-center rounded-full bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
            aria-hidden="true"
          >
            <UIcon
              name="i-lucide-circle-check"
              class="size-6"
            />
          </span>
          <h1 class="text-lg font-semibold text-highlighted">
            组队已发布
          </h1>
          <p class="text-sm text-muted">
            「{{ createdPost.title }}」已成功发布，正在招募中。
          </p>
          <UButton
            color="primary"
            variant="solid"
            icon="i-lucide-users"
            to="/teams"
            class="mt-2"
          >
            返回组队广场
          </UButton>
        </div>
      </template>

      <template v-else>
        <h1 class="text-2xl font-bold text-highlighted sm:text-3xl">
          发布组队
        </h1>
        <p class="mt-2 text-base text-muted">
          填写队伍信息，寻找合适的队友。联系方式默认不公开。
        </p>

        <form
          class="mt-8 space-y-4"
          novalidate
          @submit.prevent="submit"
        >
          <UFormField
            label="关联竞赛"
            name="competitionId"
            required
            :error="errors.competitionId"
          >
            <USelect
              v-model="competitionId"
              :items="competitionOptions"
              placeholder="请选择关联竞赛"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="信息类型"
            name="postType"
            required
            :error="errors.postType"
          >
            <USelect
              v-model="postType"
              :items="teamPostTypeOptions"
              placeholder="请选择信息类型"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="标题"
            name="title"
            required
            :error="errors.title"
          >
            <UInput
              v-model="title"
              placeholder="如：一起冲省赛，缺一名前端"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="队伍名称（选填）"
            name="teamName"
          >
            <UInput
              v-model="teamName"
              placeholder="如：算法冲锋队"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="项目 / 方向简介"
            name="direction"
            required
            :error="errors.direction"
          >
            <UInput
              v-model="direction"
              placeholder="如：图像识别 / 小程序开发"
              class="w-full"
            />
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="当前人数"
              name="baseMemberCount"
              required
              :error="errors.baseMemberCount"
            >
              <UInputNumber
                v-model="baseCount"
                :min="0"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="计划人数"
              name="targetMemberCount"
              required
              :error="errors.targetMemberCount"
            >
              <UInputNumber
                v-model="targetCount"
                :min="0"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField
            label="已有成员情况"
            name="currentMembers"
          >
            <UTextarea
              v-model="currentMembers"
              :rows="2"
              placeholder="如：2 名后端、1 名算法"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="招募岗位"
            name="roles"
            required
            :error="errors.roles"
          >
            <UInput
              v-model="rolesText"
              placeholder="多个岗位用逗号分隔，如：前端, 算法, 文案"
              class="w-full"
            />
            <div
              v-if="roleChips.length > 0"
              class="mt-2 flex flex-wrap gap-1.5"
            >
              <span
                v-for="chip in roleChips"
                :key="chip"
                class="rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-highlighted dark:bg-neutral-800"
              >
                {{ chip }}
              </span>
            </div>
          </UFormField>

          <UFormField
            label="技能要求"
            name="skills"
          >
            <UInput
              v-model="skillsText"
              placeholder="多个技能用逗号分隔，如：Python, 数据分析"
              class="w-full"
            />
            <div
              v-if="skillChips.length > 0"
              class="mt-2 flex flex-wrap gap-1.5"
            >
              <span
                v-for="chip in skillChips"
                :key="chip"
                class="rounded-md bg-primary-50 px-2 py-0.5 text-xs text-primary-700 dark:bg-primary-950 dark:text-primary-300"
              >
                {{ chip }}
              </span>
            </div>
          </UFormField>

          <UFormField
            label="目标"
            name="goal"
            required
            :error="errors.goal"
          >
            <UTextarea
              v-model="goal"
              :rows="3"
              placeholder="描述你们的目标，如：冲击省级一等奖"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="预计投入时间"
            name="expectedEffort"
            required
            :error="errors.expectedEffort"
          >
            <UInput
              v-model="effort"
              placeholder="如：每周 6–8 小时"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="联系方式"
            name="contact"
            required
            :error="errors.contact"
          >
            <UInput
              v-model="contact"
              placeholder="微信 / 手机号 / 邮箱（默认不公开）"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="其他说明"
            name="notes"
          >
            <UTextarea
              v-model="notes"
              :rows="2"
              placeholder="补充说明（选填）"
              class="w-full"
            />
          </UFormField>

          <div class="flex items-center justify-end gap-2 pt-2">
            <UButton
              type="button"
              color="neutral"
              variant="ghost"
              to="/teams"
            >
              取消
            </UButton>
            <UButton
              type="submit"
              color="primary"
              variant="solid"
              icon="i-lucide-send"
              :loading="submitting"
            >
              发布
            </UButton>
          </div>
        </form>
      </template>
    </PageContainer>
  </section>
</template>
