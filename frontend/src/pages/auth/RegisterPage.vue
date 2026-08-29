<script setup lang="ts">
import { computed, ref } from 'vue'
import { useToast } from '@nuxt/ui/composables'

import { AppError } from '@/shared/http/types'
import PageContainer from '@/shared/components/layout/PageContainer.vue'
import { useAuthStore } from '@/stores/auth'

/** 学生自助注册（FE-105）— /register。
 *  仅提交学号 / 姓名 / 密码；注册成功不创建 Session，按服务端激活状态显示结果。
 */
const toast = useToast()
const auth = useAuthStore()

const studentNo = ref('')
const realName = ref('')
const password = ref('')
const confirmPassword = ref('')

const errors = ref<Record<string, string>>({})
const submitting = ref(false)
const submitted = ref(false)
const submittedMessage = ref('')
const submittedStatus = ref<'active' | 'pending_approval' | null>(null)

const passwordValid = computed(() => password.value.length >= 6)
const accountIsActive = computed(() => submittedStatus.value === 'active')

function validate(): Record<string, string> {
  const result: Record<string, string> = {}
  if (!studentNo.value.trim()) result.studentNo = '请填写学号'
  if (!realName.value.trim()) result.realName = '请填写真实姓名'
  if (!password.value) result.password = '请设置密码'
  else if (!passwordValid.value) result.password = '密码至少 6 位'
  if (confirmPassword.value !== password.value) {
    result.confirmPassword = '两次输入的密码不一致'
  }
  return result
}

function messageFor(errorValue: unknown): string {
  if (errorValue instanceof AppError) {
    if (errorValue.code === 'ACCOUNT_EXISTS') {
      return '该学号已注册，请联系管理员或直接登录。'
    }
    if (errorValue.status === 429) return '提交过于频繁，请稍后再试。'
    if (errorValue.fieldErrors) {
      const first = Object.values(errorValue.fieldErrors)[0]
      if (first) return first
    }
  }
  return '注册提交失败，请检查网络后重试。'
}

async function submit() {
  const formErrors = validate()
  errors.value = formErrors
  if (Object.keys(formErrors).length > 0) return

  submitting.value = true
  try {
    const result = await auth.register({
      student_no: studentNo.value.trim(),
      real_name: realName.value.trim(),
      password: password.value
    })
    submitted.value = true
    submittedMessage.value = result.message
    submittedStatus.value = result.status
    toast.add({
      title: result.status === 'active' ? '注册成功' : '注册已提交',
      description:
        result.status === 'active' ? '现在可以使用学号和密码登录。' : '请等待管理员审核后登录。',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
  } catch (err) {
    errors.value = { form: messageFor(err) }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="py-10 sm:py-14">
    <PageContainer class="max-w-md">
      <div class="rounded-card border border-default bg-default p-6 sm:p-8">
        <template v-if="submitted">
          <div class="flex flex-col items-center gap-3 text-center">
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
              {{ accountIsActive ? '注册成功' : '注册已提交' }}
            </h1>
            <p class="text-sm text-muted">
              {{
                submittedMessage ||
                  (accountIsActive ? '注册成功，现在可以登录。' : '注册已提交，请等待管理员审核。')
              }}
            </p>
            <RouterLink
              to="/login"
              class="mt-2 inline-flex min-h-9 items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              {{ accountIsActive ? '立即登录' : '返回登录' }}
            </RouterLink>
          </div>
        </template>

        <template v-else>
          <h1 class="text-2xl font-bold text-highlighted">
            注册
          </h1>
          <p class="mt-2 text-sm text-muted">
            填写信息创建学生账号，提交后会显示账号状态。
          </p>

          <form
            class="mt-6 space-y-4"
            novalidate
            @submit.prevent="submit"
          >
            <UFormField
              label="学号"
              name="studentNo"
              :error="errors.studentNo"
            >
              <UInput
                v-model="studentNo"
                autocomplete="username"
                placeholder="如：20240001"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="真实姓名"
              name="realName"
              :error="errors.realName"
            >
              <UInput
                v-model="realName"
                placeholder="请输入真实姓名"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="密码"
              name="password"
              :error="errors.password"
            >
              <UInput
                v-model="password"
                type="password"
                autocomplete="new-password"
                placeholder="至少 6 位"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="确认密码"
              name="confirmPassword"
              :error="errors.confirmPassword"
            >
              <UInput
                v-model="confirmPassword"
                type="password"
                autocomplete="new-password"
                placeholder="再次输入密码"
                class="w-full"
              />
            </UFormField>

            <p
              v-if="errors.form"
              role="alert"
              class="text-sm text-danger-600 dark:text-danger-400"
            >
              {{ errors.form }}
            </p>

            <UButton
              type="submit"
              color="primary"
              variant="solid"
              block
              icon="i-lucide-user-plus"
              :loading="submitting"
            >
              注册并创建账号
            </UButton>
          </form>

          <p class="mt-6 text-center text-sm text-muted">
            已有账号？
            <RouterLink
              to="/login"
              class="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              直接登录
            </RouterLink>
          </p>
        </template>
      </div>
    </PageContainer>
  </section>
</template>
