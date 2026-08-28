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
        meta: { mobileShell: 'detail', title: '组织详情' }
      },
      {
        path: 'manage/organizations/:organizationId',
        name: 'org-manage',
        component: () =>
          import('@/features/organizations/components/OrgManageShell.vue'),
        meta: { mobileShell: 'manage', title: '组织管理', auth: 'auth' },
        children: [
          {
            path: '',
            name: 'org-manage-index',
            redirect: { name: 'org-manage-profile' }
          },
          {
            path: 'profile',
            name: 'org-manage-profile',
            component: () =>
              import('@/pages/manage/OrgProfileManagePage.vue'),
            meta: { title: '组织资料' }
          },
          {
            path: 'recruitments',
            name: 'org-manage-recruitments',
            component: () =>
              import('@/pages/manage/OrgRecruitmentsPage.vue'),
            meta: { title: '招新管理' }
          },
          {
            path: 'applications',
            name: 'org-manage-applications',
            component: () =>
              import('@/pages/manage/OrgApplicationsPage.vue'),
            meta: { title: '申请管理' }
          }
        ]
      },
      {
        path: 'teams',
        name: 'teams',
        component: () =>
          import('@/pages/teams/TeamPlazaPage.vue'),
        meta: {
          mobileShell: 'tab',
          mobileTab: 'teams',
          mobileHeaderTitle: '组队广场'
        }
      },
      {
        path: 'teams/create',
        name: 'team-plaza-create',
        component: () =>
          import('@/pages/teams/TeamCreatePage.vue'),
        meta: { mobileShell: 'form', title: '发布组队' }
      },
      {
        path: 'teams/:id',
        name: 'team-detail',
        component: () =>
          import('@/pages/teams/TeamDetailPage.vue'),
        meta: { mobileShell: 'detail', title: '组队详情' }
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
          import('@/pages/qa/ConsultationGuidePage.vue'),
        meta: { mobileShell: 'detail', title: '咨询与指南' }
      },
      {
        path: 'qa/faqs',
        name: 'qa-faqs',
        component: () =>
          import('@/pages/qa/FaqFullListPage.vue'),
        meta: { mobileShell: 'detail', title: '常见问题' }
      },
      {
        path: 'qa/guides',
        name: 'qa-guide-list',
        component: () =>
          import('@/pages/qa/GuideListPage.vue'),
        meta: { mobileShell: 'detail', title: '指南' }
      },
      {
        path: 'qa/guides/:id',
        name: 'qa-guide-detail',
        component: () =>
          import('@/pages/qa/GuideDetailPage.vue'),
        meta: { mobileShell: 'detail', title: '指南详情' }
      },
      {
        path: 'qa/questions',
        name: 'qa-question-list',
        component: () =>
          import('@/pages/qa/QuestionListPage.vue'),
        meta: { mobileShell: 'detail', title: '公开问答' }
      },
      {
        path: 'qa/questions/:id',
        name: 'qa-question-detail',
        component: () =>
          import('@/pages/qa/QuestionDetailPage.vue'),
        meta: { mobileShell: 'detail', title: '问答详情' }
      },
      {
        path: 'qa/submit',
        name: 'qa-submit',
        component: () =>
          import('@/pages/qa/ConsultationSubmitPage.vue'),
        meta: { mobileShell: 'detail', title: '提交咨询' }
      },
      {
        path: 'me',
        name: 'me',
        component: () =>
          import('@/pages/me/AccountOverviewPage.vue'),
        meta: {
          mobileShell: 'tab',
          mobileTab: 'me',
          mobileHeaderTitle: '个人中心',
          auth: 'auth'
        }
      },
      {
        path: 'me/profile',
        name: 'me-profile',
        component: () =>
          import('@/pages/me/AccountProfilePage.vue'),
        meta: { mobileShell: 'detail', title: '个人资料' }
      },
      {
        path: 'me/follows',
        name: 'me-follows',
        component: () =>
          import('@/pages/me/AccountFollowsPage.vue'),
        meta: { mobileShell: 'detail', title: '我的关注' }
      },
      {
        path: 'me/teams',
        name: 'me-teams',
        component: () =>
          import('@/pages/me/AccountTeamsPage.vue'),
        meta: { mobileShell: 'detail', title: '我的组队' }
      },
      {
        path: 'me/applications',
        name: 'me-applications',
        component: () =>
          import('@/pages/me/AccountApplicationsPage.vue'),
        meta: { mobileShell: 'detail', title: '我的申请' }
      },
      {
        path: 'me/activities',
        name: 'me-activities',
        component: () =>
          import('@/pages/me/AccountActivitiesPage.vue'),
        meta: { mobileShell: 'detail', title: '我的活动' }
      },
      {
        path: 'me/questions',
        name: 'me-questions',
        component: () =>
          import('@/pages/me/AccountQuestionsPage.vue'),
        meta: { mobileShell: 'detail', title: '我的咨询' }
      },
      {
        path: 'me/settings',
        name: 'me-settings',
        component: () =>
          import('@/pages/me/AccountSettingsPage.vue'),
        meta: { mobileShell: 'detail', title: '账号设置' }
      },
      {
        path: 'ops',
        name: 'ops',
        component: () =>
          import('@/features/ops/components/OpsShell.vue'),
        meta: { mobileShell: 'manage', title: '平台运营', auth: 'operator' },
        children: [
          {
            path: '',
            name: 'ops-overview',
            component: () =>
              import('@/pages/ops/OpsOverviewPage.vue'),
            meta: { title: '平台运营' }
          },
          {
            path: 'competitions',
            name: 'ops-competitions',
            component: () =>
              import('@/pages/ops/OpsCompetitionsPage.vue'),
            meta: { title: '竞赛管理' }
          },
          {
            path: 'activities',
            name: 'ops-activities',
            component: () =>
              import('@/pages/ops/OpsActivitiesPage.vue'),
            meta: { title: '校园动态管理' }
          },
          {
            path: 'questions',
            name: 'ops-questions',
            component: () =>
              import('@/pages/ops/OpsQuestionsPage.vue'),
            meta: { title: '咨询管理' }
          },
          {
            path: 'teams',
            name: 'ops-teams',
            component: () =>
              import('@/pages/ops/OpsTeamsPage.vue'),
            meta: { title: '组队管理' }
          },
          {
            path: 'organizations',
            name: 'ops-organizations',
            component: () =>
              import('@/pages/ops/OpsOrganizationsPage.vue'),
            meta: { title: '社团组织管理' }
          },
          {
            path: 'recruitment-applications',
            name: 'ops-recruitment-applications',
            component: () =>
              import('@/pages/ops/OpsRecruitmentApplicationsPage.vue'),
            meta: { title: '招新审核' }
          },
          {
            path: 'guides',
            name: 'ops-guides',
            component: () =>
              import('@/pages/ops/OpsGuidesPage.vue'),
            meta: { title: '指南管理' }
          },
          {
            path: 'faq',
            name: 'ops-faq',
            component: () =>
              import('@/pages/ops/OpsFaqPage.vue'),
            meta: { title: 'FAQ 管理' }
          },
          {
            path: 'analytics',
            name: 'ops-analytics',
            component: () =>
              import('@/pages/ops/OpsAnalyticsPage.vue'),
            meta: { title: '数据分析' }
          },
          {
            path: 'system',
            name: 'ops-system',
            component: () =>
              import('@/pages/ops/OpsSystemPage.vue'),
            meta: { title: '系统设置' }
          }
        ]
      },
      {
        path: 'login',
        name: 'login',
        component: () =>
          import('@/pages/auth/LoginPage.vue'),
        meta: { mobileShell: 'form', title: '登录' }
      },
      {
        path: 'notifications',
        name: 'notifications',
        component: () =>
          import('@/pages/notifications/NotificationCenterPage.vue'),
        meta: { mobileShell: 'detail', title: '通知中心' }
      },
      {
        path: 'register',
        name: 'register',
        component: () =>
          import('@/pages/auth/RegisterPage.vue'),
        meta: { mobileShell: 'form', title: '注册' }
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
