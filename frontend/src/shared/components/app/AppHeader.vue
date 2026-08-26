<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { useBreakpoint } from '@/shared/composables/useBreakpoint'
import AppLogo from '@/shared/components/app/AppLogo.vue'
import DesktopNavigation from '@/shared/components/app/DesktopNavigation.vue'
import MobilePageHeader from '@/shared/components/app/MobilePageHeader.vue'
import NotificationButton from '@/shared/components/app/NotificationButton.vue'
import SearchButton from '@/shared/components/app/SearchButton.vue'
import TabletNavigationDrawer from '@/shared/components/app/TabletNavigationDrawer.vue'
import UserMenu from '@/shared/components/app/UserMenu.vue'
import PageContainer from '@/shared/components/layout/PageContainer.vue'

const route = useRoute()
const { isPhone, isTablet } = useBreakpoint()

const shell = route.meta.mobileShell
const isBackShell =
  shell === 'detail' || shell === 'form' || shell === 'manage'
const backTitle = computed(() => (route.meta.title as string | undefined) ?? '')
</script>

<template>
  <MobilePageHeader
    v-if="isPhone && isBackShell"
    :title="backTitle"
  />

  <header
    v-else
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
          <TabletNavigationDrawer v-if="isTablet" />
        </div>
      </div>
    </PageContainer>
  </header>
</template>
