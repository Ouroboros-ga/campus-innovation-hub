/**
 * 咨询与指南开发 Fixtures（Mock-First）— FE-050
 *
 * 规则（database-design.md §1.3 / §36 / FE-005）：
 * - 日期一律使用 ISO 8601 字符串（+08:00）；
 * - 不存放可推导的展示文本；
 * - 这是开发脚手架，不是生产事实，不作为真实官方数据展示。
 *
 * 覆盖维度：常见问题（可展开答案）、指南（类型 + 更新日期）、公开问答（状态 + 标签 + 回答）。
 */

import type { GuideSummary } from '@/shared/types/homepage'

import type { ConsultFaq, ConsultQaPost } from '@/features/consultation/types'

/** 常见问题。 */
export const consultFaqs: ConsultFaq[] = [
  {
    id: 'faq-how-register',
    category: 'COMPETITION',
    question: '如何报名参加学科竞赛？',
    answer:
      '在对应竞赛页面点击「报名」按钮，按要求填写报名信息并提交材料。报名截止前可在「我的报名」中修改或取消报名。',
    updatedAt: '2026-08-20T09:00:00+08:00',
    detailPath: '/qa/faqs'
  },
  {
    id: 'faq-change-team',
    category: 'TEAM',
    question: '报名后可以更换队员或退出吗？',
    answer:
      '可在报名截止前在「我的报名」中进行调整；报名截止后不可再更换队员或退出。',
    updatedAt: '2026-08-18T09:00:00+08:00',
    detailPath: '/qa/faqs'
  },
  {
    id: 'faq-get-notice',
    category: 'COMPETITION',
    question: '如何获取竞赛通知与重要信息？',
    answer:
      '请关注平台公告及赛事详情页，建议开启站内消息提醒，及时获取最新通知。',
    updatedAt: '2026-08-16T09:00:00+08:00',
    detailPath: '/qa/faqs'
  },
  {
    id: 'faq-mentor-referral',
    category: 'COMPETITION',
    question: '参赛需要导师推荐或盖章吗？',
    answer:
      '多数竞赛无需导师推荐，具体请在报名前仔细阅读各竞赛报名须知与通知要求。',
    updatedAt: '2026-08-14T09:00:00+08:00',
    detailPath: '/qa/faqs'
  },
  {
    id: 'faq-certificate',
    category: 'CERTIFICATE',
    question: '获奖证书何时发放？如何领取？',
    answer:
      '竞赛结果公布并公示结束后，证书将统一安排发放；具体领取方式以官方通知为准。',
    updatedAt: '2026-08-12T09:00:00+08:00',
    detailPath: '/qa/faqs'
  },
  {
    id: 'faq-fix-info',
    category: 'OTHER',
    question: '平台账号与报名信息填错了怎么办？',
    answer:
      '可在个人中心修改个人信息；已提交的报名信息如需更正，请联系平台工作人员协助处理。',
    updatedAt: '2026-08-10T09:00:00+08:00',
    detailPath: '/qa/faqs'
  }
]

/** 指南列表。 */
export const consultGuides: GuideSummary[] = [
  {
    id: 'guide-signup-detail',
    title: '科创竞赛报名与参赛流程指南',
    category: 'COMPETITION',
    summary: '从查找竞赛到报名参赛，详解每个关键步骤与注意事项。',
    publishedAt: '2026-08-18T08:00:00+08:00',
    detailPath: '/qa/guides/signup-detail'
  },
  {
    id: 'guide-proposal-writing',
    title: '项目申报书写要点指南',
    category: 'PROCESS',
    summary: '围绕评审要点，梳理申报书结构、内容与常见问题，提升项目竞争力。',
    publishedAt: '2026-08-12T08:00:00+08:00',
    detailPath: '/qa/guides/proposal-writing'
  },
  {
    id: 'guide-reimbursement',
    title: '经费报销与材料指南',
    category: 'PROCESS',
    summary: '说明报销流程、所需材料及时间节点，帮助你高效完成材料提交与报销。',
    publishedAt: '2026-08-06T08:00:00+08:00',
    detailPath: '/qa/guides/reimbursement'
  },
  {
    id: 'guide-innovation-credit',
    title: '创新创业活动参与与学分认定说明',
    category: 'RESEARCH',
    summary: '介绍各类活动参与方式及学分认定规则，助力你的成长与评优。',
    publishedAt: '2026-08-02T08:00:00+08:00',
    detailPath: '/qa/guides/innovation-credit'
  }
]

/** 公开问答。 */
export const consultQaPosts: ConsultQaPost[] = [
  {
    id: 'qa-lanqiao-both',
    question: '蓝桥杯省赛和国赛可以同时参加吗？',
    answer:
      '可以同时参加。参赛流程是：先参加省赛，获得省赛一等奖及以上的同学可晋级国赛，具体以当年赛事通知为准。',
    tags: ['竞赛报名', '蓝桥杯全国软件和信息技术专业人才大赛'],
    status: 'ANSWERED',
    authorName: '平台小助手',
    answeredAt: '2026-08-20T14:00:00+08:00',
    likes: 18,
    detailPath: '/qa/questions/lanqiao-both'
  },
  {
    id: 'qa-duplicate-rate',
    question: '项目申报的查重率有要求吗？',
    answer:
      '有要求。一般高校会要求查重率不超过 20%，请勿大段复制粘贴网络内容，确保原创性。',
    tags: ['项目申报', '大学生创新创业训练计划'],
    status: 'ANSWERED',
    authorName: '平台小助手',
    answeredAt: '2026-08-13T10:00:00+08:00',
    likes: 12,
    detailPath: '/qa/questions/duplicate-rate'
  },
  {
    id: 'qa-roadshow',
    question: '路演答辩一般多长时间？需要准备哪些材料？',
    answer:
      '通常 8–10 分钟路演 + 5 分钟问答。建议准备 PPT、项目介绍、路演视频（如有）及相关证明材料以备评委提问。',
    tags: ['路演答辩', 'ACM 国际大学生程序设计竞赛'],
    status: 'PENDING',
    authorName: '张同学',
    answeredAt: '2026-08-05T15:00:00+08:00',
    likes: 6,
    detailPath: '/qa/questions/roadshow'
  }
]

/** 指南正文（按 id）。未收录的指南在查询层用通用兜底文案。 */
export const consultGuideBodies: Record<string, string> = {
  'guide-signup-detail':
    '从查找竞赛到报名参赛，本指南详解每个关键步骤与注意事项。\n\n一、查找竞赛：在「竞赛」页按分类、级别、报名状态筛选，找到适合自己的赛事并进入详情页。\n\n二、确认资格：仔细阅读竞赛通知，核对参赛对象、组队要求与报名截止时间。\n\n三、提交报名：在详情页点击「报名」，按提示填写队伍与成员信息并提交材料。\n\n四、确认结果：及时关注「我的报名」，确认报名成功并留意后续赛程通知。',
  'guide-proposal-writing':
    '围绕评审要点，本指南梳理申报书结构、内容与常见问题，帮助提升项目竞争力。\n\n一、结构完整：通常包括项目背景、目标、内容、方法、进度、预期成果与团队分工。\n\n二、目标清晰：用可度量的指标说明要解决的问题与预期产出。\n\n三、逻辑自洽：背景、内容与成果之间保持对应，避免空泛表述。\n\n四、常见问题：注意查重率、格式规范与时间节点，按时提交。',
  'guide-reimbursement':
    '说明报销流程、所需材料及时间节点，帮助高效完成材料提交与报销。\n\n一、提前报备：经费使用前确认预算科目与审批要求。\n\n二、保留票据：妥善保存发票、支付凭证等原始单据。\n\n三、按规提交：在规定时间内填写报销单并附材料，经审核后发放。\n\n四、注意时限：关注财务截止日期，避免逾期影响报销。',
  'guide-innovation-credit':
    '介绍各类活动参与方式及学分认定规则，助力成长与评优。\n\n一、活动类型：涵盖竞赛、讲座、科研训练、创新创业等，参与方式见活动详情。\n\n二、学分认定：不同活动对应不同学分或综合素质加分，以学院最新认定办法为准。\n\n三、记录留存：参与后及时在平台登记，便于后续学分申报。',
  'guide-math-modeling':
    '从组队、选题到论文写作的完整路径，帮助新手快速上手数学建模竞赛。',
  'guide-innovation-training':
    '介绍大学生创新创业训练计划的申报流程、材料准备与常见问题。',
  'guide-research-start':
    '面向新生的科研入门指南，讲解如何进入实验室并开始科研。'
}
