<script setup lang="ts">
import HomeCarousel from '@/features/homepage/components/HomeCarousel.vue'
import HomeHero from '@/features/homepage/components/HomeHero.vue'
</script>

<template>
  <HomeHero>
    <template #media>
      <HomeCarousel />
    </template>
  </HomeHero>

  <section class="py-12 sm:py-16">
    <div class="page-container">
      <p class="text-base text-muted">
        首页其余区块将在后续任务中逐步完善。
      </p>
    </div>
  </section>
</template>
