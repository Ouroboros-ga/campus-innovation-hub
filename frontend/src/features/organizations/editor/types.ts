import type { MediaImage } from '@/shared/types/homepage'

export interface OrganizationProfileDraft {
  shortIntro: string
  descriptionMd: string
  publicContact: string
  logo: MediaImage | null
  banner: MediaImage | null
}

export interface RecruitmentPositionDraft {
  id?: string
  name: string
  headcount: number
  descriptionMd: string
  requirementsMd: string
}

export interface RecruitmentEditorDraft {
  title: string
  introMd: string
  applyStartAt: string
  applyEndAt: string
  targetGradeMin: number | null
  targetGradeMax: number | null
  notesMd: string
  positions: RecruitmentPositionDraft[]
}

export const emptyOrganizationProfileDraft = (): OrganizationProfileDraft => ({
  shortIntro: '', descriptionMd: '', publicContact: '', logo: null, banner: null
})

export const emptyRecruitmentDraft = (): RecruitmentEditorDraft => ({
  title: '', introMd: '', applyStartAt: '', applyEndAt: '', targetGradeMin: null,
  targetGradeMax: null, notesMd: '', positions: [{ name: '', headcount: 1, descriptionMd: '', requirementsMd: '' }]
})
