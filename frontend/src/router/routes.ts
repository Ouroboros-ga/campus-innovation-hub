import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/PublicLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/pages/home/HomePage.vue')
      },
      {
        path: 'competitions',
        name: 'competitions',
        component: () =>
          import('@/pages/competitions/CompetitionListPage.vue')
      },
      {
        path: 'organizations',
        name: 'organizations',
        component: () =>
          import('@/pages/placeholder/PublicPlaceholderPage.vue'),
        props: { title: '社团与组织' }
      },
      {
        path: 'teams',
        name: 'teams',
        component: () =>
          import('@/pages/placeholder/PublicPlaceholderPage.vue'),
        props: { title: '组队广场' }
      },
      {
        path: 'activities',
        name: 'activities',
        component: () =>
          import('@/pages/placeholder/PublicPlaceholderPage.vue'),
        props: { title: '活动中心' }
      },
      {
        path: 'qa',
        name: 'qa',
        component: () =>
          import('@/pages/placeholder/PublicPlaceholderPage.vue'),
        props: { title: '咨询指南' }
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
