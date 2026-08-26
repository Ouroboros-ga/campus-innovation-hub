import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/PublicLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/pages/home/HomePage.vue'),
        meta: {
          mobileShell: 'tab',
          mobileTab: 'home',
          mobileHeaderTitle: '科创与就业服务平台'
        }
      },
      {
        path: 'competitions',
        name: 'competitions',
        component: () =>
          import('@/pages/competitions/CompetitionListPage.vue'),
        meta: {
          mobileShell: 'tab',
          mobileTab: 'competitions',
          mobileHeaderTitle: '竞赛中心'
        }
      },
      {
        path: 'competitions/:id',
        name: 'competition-detail',
        component: () =>
          import('@/pages/competitions/CompetitionDetailPage.vue'),
        meta: { mobileShell: 'detail', title: '竞赛详情' }
      },
      {
        path: 'organizations',
        name: 'organizations',
        component: () =>
          import('@/pages/organizations/OrganizationListPage.vue'),
        meta: {
          mobileShell: 'tab',
          title: '社团与组织',
          mobileHeaderTitle: '社团与组织'
        }
      },
      {
        path: 'organizations/:id/recruitments/:recruitmentId',
        name: 'recruitment-detail',
        component: () =>
          import('@/pages/organizations/RecruitmentDetailPage.vue'),
        meta: { mobileShell: 'detail', title: '招新详情' }
      },
      {
        path: 'organizations/:id',
        name: 'organization-detail',
        component: () =>
          import('@/pages/organizations/OrganizationDetailPage.vue'),
        meta: { mobileShell: 'detail', title: '组织主页' }
      },
      {
        path: 'teams',
        name: 'teams',
        component: () =>
          import('@/pages/placeholder/PublicPlaceholderPage.vue'),
        props: { title: '组队广场' },
        meta: {
          mobileShell: 'tab',
          mobileTab: 'teams',
          mobileHeaderTitle: '组队广场'
        }
      },
      {
        path: 'activities',
        name: 'activities',
        component: () =>
          import('@/pages/activities/CampusDynamicsPage.vue'),
        meta: {
          mobileShell: 'tab',
          mobileTab: 'activities',
          title: '校园动态',
          mobileHeaderTitle: '校园动态'
        }
      },
      {
        path: 'activities/announcements/:announcementId',
        name: 'announcement-detail',
        component: () =>
          import('@/pages/activities/AnnouncementDetailPage.vue'),
        meta: { mobileShell: 'detail', title: '公告详情' }
      },
      {
        path: 'activities/:activityId',
        name: 'activity-detail',
        component: () =>
          import('@/pages/activities/ActivityDetailPage.vue'),
        meta: { mobileShell: 'detail', title: '活动详情' }
      },
      {
        path: 'qa',
        name: 'qa',
        component: () =>
          import('@/pages/placeholder/PublicPlaceholderPage.vue'),
        props: { title: '咨询指南' },
        meta: { mobileShell: 'detail', title: '咨询指南' }
      },
      {
        path: 'me',
        name: 'me',
        component: () =>
          import('@/pages/placeholder/PublicPlaceholderPage.vue'),
        props: { title: '我的' },
        meta: { mobileShell: 'tab', mobileTab: 'me', mobileHeaderTitle: '我的' }
      }
    ]
  }
]

if (import.meta.env.DEV) {
  routes.push({
    path: '/dev/design-system',
    name: 'dev-design-system',
    component: () =>
      import('@/pages/dev/design-system/DevDesignSystemPage.vue')
  })
}
