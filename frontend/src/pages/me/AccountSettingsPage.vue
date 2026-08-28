<script setup lang="ts">
import AccountSubPage from '@/features/account/components/AccountSubPage.vue'
</script>

<template>
  <AccountSubPage>
    <h1 class="text-xl font-bold text-highlighted sm:text-2xl">
      账号设置
    </h1>
    <p class="mt-1 text-sm text-muted">
      安全、通知与隐私设置。外观模式未登录也可切换。
    </p>

    <!-- 外观 -->
    <section class="mt-6 rounded-card border border-default bg-default p-4">
      <div class="flex items-center gap-2">
        <UIcon
          name="i-lucide-palette"
          class="size-4 text-primary-600 dark:text-primary-400"
          aria-hidden="true"
        />
        <h2 class="text-sm font-semibold text-highlighted">
          外观模式
        </h2>
      </div>
      <p class="mt-1 text-xs text-muted">
        跟随系统 / 浅色 / 暗色，偏好保存在本地。
      </p>
      <UFormField
        label="外观模式"
        class="mt-4"
      >
        <UColorModeSelect />
      </UFormField>
    </section>

    <!-- 设置分组：与概览页底部 5 项对应，当前为占位（以最终认证方案为准） -->
    <div class="mt-4 grid grid-cols-1 gap-4">
      <section class="rounded-card border border-default bg-default p-4">
        <div class="flex items-start justify-between gap-3">
          <span class="flex items-center gap-2">
            <UIcon
              name="i-lucide-user-round"
              class="size-4 text-primary-600 dark:text-primary-400"
              aria-hidden="true"
            />
            <span class="text-sm font-semibold text-highlighted">个人资料</span>
          </span>
          <UButton
            to="/me/profile"
            size="xs"
            color="primary"
            variant="soft"
            trailing-icon="i-lucide-chevron-right"
          >
            去完善
          </UButton>
        </div>
        <p class="mt-2 text-xs text-muted">
          查看与编辑昵称、专业、年级、简介与技能标签。
        </p>
      </section>

      <section class="rounded-card border border-default bg-default p-4">
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-lock"
            class="size-4 text-primary-600 dark:text-primary-400"
            aria-hidden="true"
          />
          <h2 class="text-sm font-semibold text-highlighted">
            账号与安全
          </h2>
          <UBadge
            color="neutral"
            variant="soft"
            size="sm"
          >
            占位
          </UBadge>
        </div>
        <p class="mt-2 text-xs text-muted">
          密码修改、登录保护等以最终认证方案为准，当前为占位展示。
        </p>
        <div class="mt-3 flex flex-wrap gap-2">
          <UButton
            size="xs"
            color="neutral"
            variant="outline"
            disabled
          >
            修改密码
          </UButton>
          <UButton
            size="xs"
            color="neutral"
            variant="ghost"
            disabled
          >
            登录保护
          </UButton>
        </div>
      </section>

      <section class="rounded-card border border-default bg-default p-4">
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-bell"
            class="size-4 text-primary-600 dark:text-primary-400"
            aria-hidden="true"
          />
          <h2 class="text-sm font-semibold text-highlighted">
            通知设置
          </h2>
          <UBadge
            color="neutral"
            variant="soft"
            size="sm"
          >
            后续接入
          </UBadge>
        </div>
        <p class="mt-2 text-xs text-muted">
          消息通知与提醒偏好，当前为占位。
        </p>
      </section>

      <section class="rounded-card border border-default bg-default p-4">
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-shield-check"
            class="size-4 text-primary-600 dark:text-primary-400"
            aria-hidden="true"
          />
          <h2 class="text-sm font-semibold text-highlighted">
            隐私设置
          </h2>
          <UBadge
            color="neutral"
            variant="soft"
            size="sm"
          >
            后续接入
          </UBadge>
        </div>
        <p class="mt-2 text-xs text-muted">
          隐私与可见范围控制，当前为占位。
        </p>
      </section>

      <section class="rounded-card border border-default bg-default p-4">
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-link-2"
            class="size-4 text-primary-600 dark:text-primary-400"
            aria-hidden="true"
          />
          <h2 class="text-sm font-semibold text-highlighted">
            绑定设置
          </h2>
          <UBadge
            color="neutral"
            variant="soft"
            size="sm"
          >
            后续接入
          </UBadge>
        </div>
        <p class="mt-2 text-xs text-muted">
          第三方账号绑定，当前为占位。
        </p>
      </section>
    </div>
  </AccountSubPage>
</template>
