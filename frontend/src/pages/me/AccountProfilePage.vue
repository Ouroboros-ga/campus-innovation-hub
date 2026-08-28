<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@nuxt/ui/composables'

import AccountSubPage from '@/features/account/components/AccountSubPage.vue'
import { http } from '@/shared/http/client'
import { AppError } from '@/shared/http/types'
import { useAuthStore } from '@/stores/auth'

/** 个人资料（FE-070 /me/profile）— 已接真实 API，Mock 仅作兜底。 */
const toast = useToast()
const auth = useAuthStore()

const loading = ref(true)
const saving = ref(false)
const error = ref('')

const isTeacher = computed(() => auth.user?.identity_type === 'TEACHER')

// 表单状态（初始由接口回填）
const nickname = ref('')
const realName = ref('')
const major = ref('')
const grade = ref('')
const bio = ref('')
const skillsText = ref('')
const publicName = ref('')
const department = ref('')
const academicTitle = ref('')
const publicEmail = ref('')
const officeLocation = ref('')
const researchText = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await http.get<{
      real_name: string
      identity_type: string
      student_no: string | null
      employee_no: string | null
      nickname: string | null
      public_name: string | null
      major: string | null
      grade: number | null
      bio: string | null
      skills: string[]
      department: string | null
      academic_title: string | null
      public_email: string | null
      office_location: string | null
      research_interests: string[]
      class_name: string | null
      avatar: unknown
    }>('/me/profile')
    realName.value = data.real_name ?? ''
    nickname.value = data.nickname ?? ''
    major.value = data.major ?? ''
    grade.value = data.grade != null ? String(data.grade) : ''
    bio.value = data.bio ?? ''
    skillsText.value = (data.skills ?? []).join(', ')
    publicName.value = data.public_name ?? ''
    department.value = data.department ?? ''
    academicTitle.value = data.academic_title ?? ''
    publicEmail.value = data.public_email ?? ''
    officeLocation.value = data.office_location ?? ''
    researchText.value = (data.research_interests ?? []).join(', ')
  } catch (e) {
    // 未登录或接口不可用时回退到 authStore / Mock
    if (auth.user) {
      realName.value = auth.user.real_name ?? ''
      nickname.value = auth.user.profile?.nickname ?? ''
      major.value = auth.user.profile?.major ?? ''
      grade.value = auth.user.profile?.grade != null ? String(auth.user.profile.grade) : ''
      bio.value = auth.user.profile?.bio ?? ''
      skillsText.value = (auth.user.profile?.skills ?? []).join(', ')
      publicName.value = (auth.user.profile as unknown as Record<string, unknown>)?.public_name as string ?? ''
      department.value = (auth.user.profile as unknown as Record<string, unknown>)?.department as string ?? ''
      academicTitle.value = (auth.user.profile as unknown as Record<string, unknown>)?.academic_title as string ?? ''
      publicEmail.value = (auth.user.profile as unknown as Record<string, unknown>)?.public_email as string ?? ''
      officeLocation.value = (auth.user.profile as unknown as Record<string, unknown>)?.office_location as string ?? ''
      researchText.value = ((auth.user.profile as unknown as Record<string, unknown>)?.research_interests as string[] ?? []).join(', ')
    }
    if (e instanceof AppError) error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function save() {
  saving.value = true
  error.value = ''
  const payload: Record<string, unknown> = isTeacher.value
    ? {
        public_name: publicName.value.trim() || null,
        department: department.value.trim() || null,
        academic_title: academicTitle.value.trim() || null,
        public_email: publicEmail.value.trim() || null,
        office_location: officeLocation.value.trim() || null,
        research_interests: researchText.value
          .split(/[,，、]/)
          .map(item => item.trim())
          .filter(Boolean),
        bio: bio.value.trim() || null,
      }
    : {
        nickname: nickname.value.trim() || null,
        major: major.value.trim() || null,
        grade: grade.value ? Number(grade.value) : null,
        bio: bio.value.trim() || null,
        skills: skillsText.value
          .split(/[,，、]/)
          .map(item => item.trim())
          .filter(Boolean),
      }
  // 过滤空：后端要求至少一个字段
  const filtered = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0) || typeof v === 'string'))
  // 若 research_interests / skills 为空数组仍需提交（清空场景）
  if (isTeacher.value && 'research_interests' in payload) filtered.research_interests = payload.research_interests
  if (!isTeacher.value && 'skills' in payload) filtered.skills = payload.skills
  try {
    await http.patch('/me/profile', filtered)
    toast.add({
      title: '已保存',
      description: '个人资料已更新。',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
    await auth.init()
  } catch (e) {
    const message = e instanceof AppError ? e.message : '保存失败，请稍后重试。'
    error.value = message
    toast.add({ title: '保存失败', description: message, color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <AccountSubPage>
    <h1 class="text-xl font-bold text-highlighted sm:text-2xl">
      个人资料
    </h1>
    <p class="mt-1 text-sm text-muted">
      {{ isTeacher ? '教师' : '学生' }} · 系统字段与公开字段。实名信息仅用于平台内部。
    </p>
    <p
      v-if="loading"
      class="mt-4 text-sm text-muted"
    >
      正在加载资料…
    </p>
    <p
      v-if="error"
      class="mt-2 text-sm text-danger-600 dark:text-danger-400"
      role="alert"
    >
      {{ error }}
    </p>

    <form
      class="mt-6 space-y-4"
      novalidate
      @submit.prevent="save"
    >
      <template v-if="isTeacher">
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="公开姓名">
            <UInput
              v-model="publicName"
              class="w-full"
              placeholder="如：王丽华"
            />
          </UFormField>
          <UFormField label="姓名（系统）">
            <UInput
              v-model="realName"
              class="w-full"
              disabled
            />
          </UFormField>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="学院 / 部门">
            <UInput
              v-model="department"
              class="w-full"
            />
          </UFormField>
          <UFormField label="职称">
            <UInput
              v-model="academicTitle"
              class="w-full"
              placeholder="如：教授"
            />
          </UFormField>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="公开邮箱">
            <UInput
              v-model="publicEmail"
              class="w-full"
            />
          </UFormField>
          <UFormField label="办公地点">
            <UInput
              v-model="officeLocation"
              class="w-full"
            />
          </UFormField>
        </div>
        <UFormField label="研究方向">
          <UInput
            v-model="researchText"
            placeholder="多个用逗号分隔"
            class="w-full"
          />
        </UFormField>
        <UFormField label="公开简介">
          <UTextarea
            v-model="bio"
            :rows="3"
            class="w-full"
          />
        </UFormField>
      </template>
      <template v-else>
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="昵称">
            <UInput
              v-model="nickname"
              class="w-full"
            />
          </UFormField>
          <UFormField label="姓名">
            <UInput
              v-model="realName"
              class="w-full"
              disabled
            />
          </UFormField>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="专业">
            <UInput
              v-model="major"
              class="w-full"
            />
          </UFormField>
          <UFormField label="年级">
            <UInput
              v-model="grade"
              class="w-full"
            />
          </UFormField>
        </div>
        <UFormField label="公开简介">
          <UTextarea
            v-model="bio"
            :rows="3"
            class="w-full"
          />
        </UFormField>
        <UFormField label="技能标签">
          <UInput
            v-model="skillsText"
            placeholder="多个用逗号分隔，如：Python, 算法"
            class="w-full"
          />
        </UFormField>
      </template>

      <div class="flex justify-end">
        <UButton
          type="submit"
          color="primary"
          variant="solid"
          icon="i-lucide-save"
          :loading="saving"
          :disabled="loading"
        >
          保存修改
        </UButton>
      </div>
    </form>
  </AccountSubPage>
</template>
