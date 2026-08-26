<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import { carouselSlides } from '@/mocks/fixtures/homepage'
import type { CarouselSlide } from '@/shared/types/homepage'

/**
 * 首页校园轮播（FE-007）。
 *
 * 设计来源：docs/frontend/FrontendDesign.md
 * - §19：使用 UCarousel（不手写轮播 JS）；内容为校园主题 / 竞赛 / 组织招新；
 *   一张幻灯片最多一个类别标签 + 一条标题 + 一句说明 + 一个可选 CTA；
 * - §33：`prefers-reduced-motion` 时关闭自动播放；
 * - §9：轮播为主表面，圆角 12px（rounded-surface）；
 * - §38：预留图片尺寸、`object-fit: cover`、懒加载。
 *
 * 图片比例：统一使用 16:9（`aspect-video`）画框，移动端与 PC 端一致，素材最易获得；
 * 不同比例图片以 `object-fit: cover` 居中裁切填充，并可经 `image.position`（`object-position`）
 * 微调裁切焦点。真实校园图片尚未接入（fixture 的 image.src 为空），以中性深色背景预留图片区，
 * 文字叠加其上；接入真实媒体后由文案层（浅色 scrim）保证可读性（FE-013）。
 */
const props = withDefaults(
  defineProps<{ slides?: CarouselSlide[] }>(),
  { slides: () => carouselSlides }
)

const prefersReducedMotion = ref(false)
let mediaQuery: ReturnType<typeof globalThis.matchMedia> | null = null
const updatePrefersReducedMotion = (event: { matches: boolean }) => {
  prefersReducedMotion.value = event.matches
}

if (
  typeof globalThis !== 'undefined' &&
  typeof globalThis.matchMedia === 'function'
) {
  prefersReducedMotion.value = globalThis.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches
}

onMounted(() => {
  if (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.matchMedia === 'function'
  ) {
    mediaQuery = globalThis.matchMedia('(prefers-reduced-motion: reduce)')
    mediaQuery.addEventListener?.('change', updatePrefersReducedMotion)
  }
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener?.('change', updatePrefersReducedMotion)
})

const autoplay = computed(() => {
  if (prefersReducedMotion.value) return false
  return { delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true }
})
</script>

<template>
  <UCarousel
    :items="props.slides"
    :autoplay="autoplay"
    loop
    arrows
    dots
    :prev="{
      size: 'md',
      variant: 'solid',
      color: 'primary',
      class: 'opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 bg-white/85 text-neutral-900 shadow-md hover:bg-white'
    }"
    :next="{
      size: 'md',
      variant: 'solid',
      color: 'primary',
      class: 'opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 bg-white/85 text-neutral-900 shadow-md hover:bg-white'
    }"
    class="group mb-7 w-full min-w-0 rounded-surface border border-default bg-neutral-900 shadow-sm"
    :ui="{
      viewport: 'overflow-hidden rounded-surface',
      prev: 'absolute left-3! top-1/2 z-10 -translate-y-1/2',
      next: 'absolute right-3! top-1/2 z-10 -translate-y-1/2'
    }"
  >
    <template #default="{ item }">
      <article class="relative aspect-video overflow-hidden">
        <div
          v-if="item.image.src"
          class="absolute inset-0"
        >
          <img
            :src="item.image.src"
            :alt="item.image.alt"
            class="size-full object-cover"
            :style="{
              objectPosition: item.image.position ?? 'center'
            }"
            loading="lazy"
          >
        </div>
        <div
          v-else
          class="absolute inset-0 bg-neutral-900"
          aria-hidden="true"
        />

        <div
          class="relative flex h-full flex-col justify-end px-8 py-5 sm:px-16 sm:py-6 md:py-8"
        >
          <span
            v-if="item.categoryLabel"
            class="w-fit rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-neutral-900"
          >
            {{ item.categoryLabel }}
          </span>
          <h2
            class="mt-3 max-w-md text-xl font-bold leading-snug text-white sm:text-2xl md:text-3xl"
          >
            {{ item.title }}
          </h2>
          <p
            v-if="item.subtitle"
            class="mt-2 max-w-lg text-sm text-white/85 sm:text-base"
          >
            {{ item.subtitle }}
          </p>

          <div
            v-if="item.link.type !== 'NONE'"
            class="mt-4"
          >
            <UButton
              :to="
                item.link.type === 'EXTERNAL'
                  ? (item.link.externalUrl ?? undefined)
                  : (item.link.internalPath ?? undefined)
              "
              :target="item.link.type === 'EXTERNAL' ? '_blank' : undefined"
              :rel="
                item.link.type === 'EXTERNAL' ? 'noopener noreferrer' : undefined
              "
              size="sm"
              variant="soft"
              color="primary"
              :label="
                item.link.type === 'EXTERNAL' ? '访问官网' : '查看详情'
              "
              :trailing-icon="
                item.link.type === 'EXTERNAL'
                  ? 'i-lucide-external-link'
                  : 'i-lucide-arrow-right'
              "
            />
          </div>
        </div>
      </article>
    </template>
  </UCarousel>
</template>
