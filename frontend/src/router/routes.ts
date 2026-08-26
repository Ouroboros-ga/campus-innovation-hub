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
        meta: { mobileShell: 'tab', mobileTab: 'home' }
      },
      {
        path: 'competitions',
        name: 'competitions',
        component: () =>
          import('@/pages/competitions/CompetitionListPage.vue'),
        meta: { mobileShell: 'tab', mobileTab: 'competitions' }
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
          import('@/pages/placeholder/PublicPlaceholderPage.vue'),
        props: { title: '社团与组织' },
        meta: { mobileShell: 'detail', title: '社团与组织' }
      },
      {
        path: 'teams',
        name: 'teams',
        component: () =>
          import('@/pages/placeholder/PublicPlaceholderPage.vue'),
        props: { title: '组队广场' },
        meta: { mobileShell: 'tab', mobileTab: 'teams' }
      },
      {
        path: 'activities',
        name: 'activities',
        component: () =>
          import('@/pages/activities/CampusDynamicsPage.vue'),
        meta: { mobileShell: 'tab', mobileTab: 'activities', title: '校园动态' }
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
        meta: { mobileShell: 'tab', mobileTab: 'me' }
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
