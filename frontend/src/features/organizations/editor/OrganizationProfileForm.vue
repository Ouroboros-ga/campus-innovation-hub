<script setup lang="ts">
import CoverUpload from '@/shared/components/upload/CoverUpload.vue'
import MarkdownEditor from '@/shared/components/editor/MarkdownEditor.vue'
import FormSection from '@/shared/components/form/FormSection.vue'
import type { OrganizationProfileDraft } from './types'

const draft = defineModel<OrganizationProfileDraft>({ required: true })
withDefaults(defineProps<{ errors?: Record<string, string>; disabled?: boolean }>(), { errors: () => ({}), disabled: false })
</script>

<template>
  <fieldset class="space-y-6" :disabled="disabled">
    <FormSection title="品牌素材" description="Logo 和 Banner 会用于组织公开页面。">
      <div class="grid gap-5 sm:grid-cols-2">
        <UFormField label="组织 Logo" name="logo" :error="errors.logo"><CoverUpload v-model="draft.logo" label="建议正方形图片" /></UFormField>
        <UFormField label="组织 Banner" name="banner" :error="errors.banner"><CoverUpload v-model="draft.banner" label="建议 16:9 图片" /></UFormField>
      </div>
    </FormSection>
    <FormSection title="组织介绍" description="简要介绍用于列表，完整介绍用于组织详情。">
      <UFormField label="简要介绍" name="shortIntro" :error="errors.shortIntro"><UTextarea v-model="draft.shortIntro" :rows="3" :maxlength="200" class="w-full" /></UFormField>
      <UFormField label="完整介绍" name="descriptionMd" :error="errors.descriptionMd" class="mt-4"><MarkdownEditor v-model="draft.descriptionMd" :height="440" :disabled="disabled" /></UFormField>
    </FormSection>
    <FormSection title="公开联系方式" description="仅填写希望向学生公开的信息。">
      <UFormField label="联系方式" name="publicContact" :error="errors.publicContact"><UInput v-model="draft.publicContact" placeholder="如：邮箱、QQ群或值班地点" class="w-full" /></UFormField>
    </FormSection>
  </fieldset>
</template>
