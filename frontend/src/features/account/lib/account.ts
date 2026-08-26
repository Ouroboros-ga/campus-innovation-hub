import { reactive } from 'vue'

import {
  accountActivities,
  accountApplications,
  accountGames,
  accountProfile,
  accountQuestions,
  accountTeamPosts
} from '@/mocks/fixtures/account'

import type {
  AccountApplication,
  AccountProfile,
  AccountTeamPost
} from '../types'

/** 账号相关展示标签。 */
export const applicationStateLabel: Record<AccountApplication['state'], string> = {
  PENDING: '待处理',
  ACCEPTED: '已接受',
  REJECTED: '已拒绝',
  WITHDRAWN: '已撤回'
}

export const teamPositionLabel: Record<AccountTeamPost['position'], string> = {
  PUBLISHED: '我发布的',
  JOINED: '我加入的'
}

export const questionVisibilityLabel = {
  PUBLIC: '公开',
  PRIVATE: '私密'
} as const

export const questionStateLabel = {
  PENDING: '待回复',
  ANSWERED: '已回复'
} as const

/** 主题模式（外观设置，未登录也可用）。 */
export interface AccountSettings {
  theme: 'SYSTEM' | 'LIGHT' | 'DARK'
}

// ---------------------------------------------------------------------------
// 简单的内存 mock store（跨页面共享，便于「取消关注 / 撤回 / 取消报名」等）
// ---------------------------------------------------------------------------

export const profile = reactive<AccountProfile>({ ...accountProfile })
export const follows = reactive([...accountGames])
export const teamPosts = reactive([...accountTeamPosts])
export const applications = reactive([...accountApplications])
export const activities = reactive([...accountActivities])
export const questions = reactive([...accountQuestions])
export const settings = reactive<AccountSettings>({ theme: 'SYSTEM' })

export function unfollowCompetition(id: string) {
  const index = follows.findIndex(item => item.id === id)
  if (index >= 0) follows.splice(index, 1)
}

export function withdrawApplication(id: string) {
  const application = applications.find(item => item.id === id)
  if (application && application.state === 'PENDING') {
    application.state = 'WITHDRAWN'
  }
}

export function cancelActivityRegistration(id: string) {
  const activity = activities.find(item => item.id === id)
  if (activity) activity.registrationState = 'NOT_REQUIRED'
}

export function saveProfile(patch: Partial<AccountProfile>) {
  Object.assign(profile, patch)
}

export function saveTheme(theme: AccountSettings['theme']) {
  settings.theme = theme
}
