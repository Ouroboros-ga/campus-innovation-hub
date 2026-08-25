<script setup lang="ts">
import AppLogo from '@/shared/components/app/AppLogo.vue'
import DesktopNavigation from '@/shared/components/app/DesktopNavigation.vue'
import MobileNavigation from '@/shared/components/app/MobileNavigation.vue'
import NotificationButton from '@/shared/components/app/NotificationButton.vue'
import SearchButton from '@/shared/components/app/SearchButton.vue'
import UserMenu from '@/shared/components/app/UserMenu.vue'
import PageContainer from '@/shared/components/layout/PageContainer.vue'
</script>

<template>
  <header
    role="banner"
    class="sticky top-0 z-40 border-b border-default bg-default/95 backdrop-blur-sm"
  >
    <PageContainer>
      <div class="flex h-16 items-center justify-between gap-3">
        <AppLogo />
        <DesktopNavigation />

        <div class="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
          <SearchButton />
          <NotificationButton />
          <UColorModeButton
            aria-label="切换外观"
            class="hidden xl:inline-flex"
          />
          <UserMenu />
          <MobileNavigation />
        </div>
      </div>
    </PageContainer>
  </header>
</template>
