<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@nuxt/ui/composables'

import { AppError } from '@/shared/http/types'
import PageContainer from '@/shared/components/layout/PageContainer.vue'
import { useAuthStore } from '@/stores/auth'

/** 登录（FE-105）— /login。
 *  用户名即学号或工号；成功后按 `?redirect=` 或回个人中心。写请求依赖已初始化的 CSRF。
 */
const router = useRouter()
const route = useRoute()
const toast = useToast()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)

function redirectTarget(): string {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/me'
}

function messageFor(errorValue: unknown): string {
  if (errorValue instanceof AppError) {
    if (errorValue.code === 'ACCOUNT_UNAVAILABLE') return '账号尚未启用，请联系管理员。'
    if (errorValue.status === 401) return '账号或密码错误。'
    if (errorValue.status === 429) return '尝试过于频繁，请稍后再试。'
  }
  return '登录失败，请检查网络后重试。'
}

async function submit() {
  if (!username.value.trim()) {
    error.value = '请输入用户名（学号或工号）。'
    return
  }
  if (!password.value) {
    error.value = '请输入密码。'
    return
  }
  submitting.value = true
  error.value = ''
  try {
    await auth.login({ username: username.value.trim(), password: password.value })
    toast.add({
      title: '登录成功',
      description: '欢迎回来。',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
    void router.replace(redirectTarget())
  } catch (err) {
    error.value = messageFor(err)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="py-10 sm:py-14">
    <PageContainer class="max-w-md">
      <div class="rounded-card border border-default bg-default p-6 sm:p-8">
        <h1 class="text-2xl font-bold text-highlighted">
          登录
        </h1>
        <p class="mt-2 text-sm text-muted">
          使用学号或工号账号登录，继续你的科创与就业之旅。
        </p>

        <form
          class="mt-6 space-y-4"
          novalidate
          @submit.prevent="submit"
        >
          <UFormField
            label="用户名 / 学号或工号"
            name="username"
          >
            <UInput
              v-model="username"
              autocomplete="username"
              placeholder="学号如 20240001，工号如 T2024001"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="密码"
            name="password"
          >
            <UInput
              v-model="password"
              type="password"
              autocomplete="current-password"
              placeholder="请输入密码"
              class="w-full"
            />
          </UFormField>

          <p
            v-if="error"
            role="alert"
            class="text-sm text-danger-600 dark:text-danger-400"
          >
            {{ error }}
          </p>

          <UButton
            type="submit"
            color="primary"
            variant="solid"
            block
            icon="i-lucide-log-in"
            :loading="submitting"
          >
            登录
          </UButton>
        </form>

        <p class="mt-6 text-center text-sm text-muted">
          还没有账号？
          <RouterLink
            to="/register"
            class="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            注册并提交审核
          </RouterLink>
        </p>
      </div>
    </PageContainer>
  </section>
</template>
