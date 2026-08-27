<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from '@nuxt/ui/composables'

import AccountSubPage from '@/features/account/components/AccountSubPage.vue'
import { profile, saveProfile } from '@/features/account/lib/account'

/** 个人资料（FE-070 /me/profile）。 */
const toast = useToast()

const isTeacher = profile.identityType === 'TEACHER'
const nickname = ref(profile.nickname)
const realName = ref(profile.realName)
const major = ref(profile.major)
const grade = ref(profile.grade)
const bio = ref(profile.bio)
const skillsText = ref(profile.skills.join(', '))
const publicName = ref(profile.publicName ?? '')
const department = ref(profile.department ?? '')
const academicTitle = ref(profile.academicTitle ?? '')
const publicEmail = ref(profile.publicEmail ?? '')
const officeLocation = ref(profile.officeLocation ?? '')
const researchText = ref((profile.researchInterests ?? []).join(', '))

function save() {
  const patch: Record<string, unknown> = isTeacher
    ? {
        publicName: publicName.value,
        department: department.value,
        academicTitle: academicTitle.value,
        publicEmail: publicEmail.value,
        officeLocation: officeLocation.value,
        researchInterests: researchText.value
          .split(/[,，、]/)
          .map(item => item.trim())
          .filter(Boolean),
        bio: bio.value,
      }
    : {
        nickname: nickname.value,
        major: major.value,
        grade: grade.value,
        bio: bio.value,
        skills: skillsText.value
          .split(/[,，、]/)
          .map(item => item.trim())
          .filter(Boolean),
      }
  saveProfile(patch as never)
  toast.add({
    title: '已保存',
    description: '个人资料已更新（mock）。',
    color: 'success',
    icon: 'i-lucide-check-circle'
  })
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

    <form
      class="mt-6 space-y-4"
      novalidate
      @submit.prevent="save"
    >
      <template v-if="isTeacher">
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="公开姓名">
            <UInput v-model="publicName" class="w-full" placeholder="如：王丽华" />
          </UFormField>
          <UFormField label="姓名（系统）">
            <UInput v-model="realName" class="w-full" disabled />
          </UFormField>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="学院 / 部门">
            <UInput v-model="department" class="w-full" />
          </UFormField>
          <UFormField label="职称">
            <UInput v-model="academicTitle" class="w-full" placeholder="如：教授" />
          </UFormField>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="公开邮箱">
            <UInput v-model="publicEmail" class="w-full" />
          </UFormField>
          <UFormField label="办公地点">
            <UInput v-model="officeLocation" class="w-full" />
          </UFormField>
        </div>
        <UFormField label="研究方向">
          <UInput v-model="researchText" placeholder="多个用逗号分隔" class="w-full" />
        </UFormField>
        <UFormField label="公开简介">
          <UTextarea v-model="bio" :rows="3" class="w-full" />
        </UFormField>
      </template>
      <template v-else>
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="昵称">
            <UInput v-model="nickname" class="w-full" />
          </UFormField>
          <UFormField label="姓名">
            <UInput v-model="realName" class="w-full" disabled />
          </UFormField>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="专业">
            <UInput v-model="major" class="w-full" />
          </UFormField>
          <UFormField label="年级">
            <UInput v-model="grade" class="w-full" />
          </UFormField>
        </div>
        <UFormField label="公开简介">
          <UTextarea v-model="bio" :rows="3" class="w-full" />
        </UFormField>
        <UFormField label="技能标签">
          <UInput v-model="skillsText" placeholder="多个用逗号分隔，如：Python, 算法" class="w-full" />
        </UFormField>
      </template>

      <div class="flex justify-end">
        <UButton
          type="submit"
          color="primary"
          variant="solid"
          icon="i-lucide-save"
        >
          保存修改
        </UButton>
      </div>
    </form>
  </AccountSubPage>
</template>
