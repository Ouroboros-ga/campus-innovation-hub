<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from '@nuxt/ui/composables'

import AccountSubPage from '@/features/account/components/AccountSubPage.vue'
import { profile, saveProfile } from '@/features/account/lib/account'

/** 个人资料（FE-070 /me/profile）。 */
const toast = useToast()

const nickname = ref(profile.nickname)
const realName = ref(profile.realName)
const major = ref(profile.major)
const grade = ref(profile.grade)
const bio = ref(profile.bio)
const skillsText = ref(profile.skills.join(', '))

function save() {
  saveProfile({
    nickname: nickname.value,
    realName: realName.value,
    major: major.value,
    grade: grade.value,
    bio: bio.value,
    skills: skillsText.value
      .split(/[,，、]/)
      .map(item => item.trim())
      .filter(Boolean)
  })
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
      系统字段与公开字段。实名信息仅用于平台内部。
    </p>

    <form
      class="mt-6 space-y-4"
      novalidate
      @submit.prevent="save"
    >
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
