import { computed, ref, type Ref } from 'vue'

import { getManageOrgProfile, updateManageOrgProfile, type OrgProfile } from '@/features/organizations/api/orgManageApi'
import { useEditorTask } from '@/shared/composables/useEditorTask'
import { firstFieldErrors } from '@/shared/lib/form-errors'
import { emptyOrganizationProfileDraft, type OrganizationProfileDraft } from './types'

const aliases = { short_intro: 'shortIntro', description_md: 'descriptionMd', public_contact: 'publicContact', logo_asset_id: 'logo', banner_asset_id: 'banner' }

export function useOrganizationProfileEditor(organizationId: Ref<string>) {
  const profile = ref<OrgProfile | null>(null)
  const task = useEditorTask<OrganizationProfileDraft, OrgProfile>({
    initialDraft: emptyOrganizationProfileDraft(),
    adapter: {
      async load() {
        const loaded = await getManageOrgProfile(organizationId.value)
        profile.value = loaded
        return {
          shortIntro: loaded.shortIntro ?? '', descriptionMd: loaded.descriptionMd ?? '', publicContact: loaded.publicContact ?? '',
          logo: loaded.logo ? { ...loaded.logo } : null, banner: loaded.banner ? { ...loaded.banner } : null
        }
      },
      validate(draft) {
        const errors: Record<string, string> = {}
        if (draft.shortIntro.length > 200) errors.shortIntro = '简要介绍不能超过 200 个字符'
        if (draft.descriptionMd.length > 10000) errors.descriptionMd = '组织介绍不能超过 10000 个字符'
        if (draft.publicContact.length > 200) errors.publicContact = '公开联系方式不能超过 200 个字符'
        return errors
      },
      async submit(draft) {
        const result = await updateManageOrgProfile(organizationId.value, {
          short_intro: draft.shortIntro.trim() || null,
          description_md: draft.descriptionMd.trim() || null,
          public_contact: draft.publicContact.trim() || null,
          logo_asset_id: draft.logo?.id ?? null,
          banner_asset_id: draft.banner?.id ?? null
        })
        profile.value = result
        return result
      }
    }
  })

  return {
    ...task,
    profile,
    errors: computed(() => ({ ...task.clientErrors.value, ...firstFieldErrors(task.serverFieldErrors.value, aliases) })),
    load: task.load,
    save: () => task.submit('SAVE_PUBLISHED')
  }
}
