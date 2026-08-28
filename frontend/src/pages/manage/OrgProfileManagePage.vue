<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from '@nuxt/ui/composables'

import { getManageOrgProfile, updateManageOrgProfile } from '@/features/organizations/api/orgManageApi'
import ContentEditorShell from '@/shared/components/editor/ContentEditorShell.vue'
import CoverUpload from '@/shared/components/upload/CoverUpload.vue'
import FormSection from '@/shared/components/form/FormSection.vue'
import MarkdownEditor from '@/shared/components/editor/MarkdownEditor.vue'
import RichContent from '@/shared/components/reader/RichContent.vue'
import { AppError } from '@/shared/http/types'
import type { MediaImage } from '@/shared/types/homepage'

/** 组织资料管理（FE-080 / PageMap §组织资料管理）。
 *  已接真实后端 `PATCH /manage/organizations/:id/profile`，移除 mock 保存。
 */
const route = useRoute()
const toast = useToast()

const orgId = String(route.params.organizationId ?? '')

const orgName = ref('')
const intro = ref('')
const publicContact = ref('')
const logo = ref<MediaImage | null>(null)
const loading = ref(true)
const saving = ref(false)

async function load() {
  loading.value = true
  try {
    const profile = await getManageOrgProfile(orgId)
    orgName.value = profile.name
    intro.value = profile.descriptionMd ?? ''
    publicContact.value = profile.publicContact ?? ''
    logo.value = profile.logo ? { id: null, src: profile.logo.src, alt: profile.logo.alt } : null
  } catch {
    toast.add({
      title: '加载失败',
      description: '组织资料加载失败，请稍后重试。',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    loading.value = false
  }
}

watch(() => orgId, load, { immediate: true })

const introPreview = computed(() => intro.value)

async function save() {
  saving.value = true
  try {
    await updateManageOrgProfile(orgId, {
      description_md: intro.value || null,
      public_contact: publicContact.value || null,
      logo_asset_id: logo.value?.id ?? null
    })
    toast.add({
      title: '已保存',
      description: '组织资料已保存。',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
  } catch (err) {
    const message = err instanceof AppError ? err.message : '保存失败，请稍后重试。'
    toast.add({
      title: '保存失败',
      description: message,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <form
      class="space-y-6"
      novalidate
      @submit.prevent="save"
    >
      <ContentEditorShell preview-title="组织页预览">
        <template #form>
          <FormSection
            title="品牌与介绍"
            description="Logo 与组织介绍"
          >
            <CoverUpload
              v-model="logo"
              label="组织 Logo"
            />

            <UFormField label="组织介绍">
              <MarkdownEditor
                v-model="intro"
                :height="240"
              />
            </UFormField>
          </FormSection>

          <FormSection
            title="公开联系方式"
            description="对外展示的联系方式"
          >
            <UFormField label="公开联系方式">
              <UInput
                v-model="publicContact"
                placeholder="如：邮箱 / 电话 / 地址"
                class="w-full"
              />
            </UFormField>
          </FormSection>
        </template>

        <template #preview>
          <div
            v-if="logo?.src"
            class="mb-4 aspect-video overflow-hidden rounded-surface border border-default"
          >
            <img
              :src="logo.src"
              :alt="logo.alt"
              class="h-full w-full object-cover"
            >
          </div>
          <h3 class="text-lg font-semibold text-highlighted">
            {{ orgName || '组织名称' }}
          </h3>
          <RichContent :content="introPreview" />
          <p
            v-if="publicContact"
            class="mt-4 text-sm text-toned"
          >
            联系：{{ publicContact }}
          </p>
        </template>
      </ContentEditorShell>

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
  </div>
</template>
