import { createRouter, createWebHistory } from "vue-router";

import { useSessionStore } from "../stores/session";

export type AdminRouteMeta = {
  requiresAdmin?: boolean;
  title?: string;
};

export const routes = [
  {
    path: "/login",
    name: "admin-login",
    component: () => import("../views/LoginView.vue"),
    meta: { title: "登录" } satisfies AdminRouteMeta,
  },
  {
    path: "/",
    redirect: "/overview",
  },
  {
    path: "/overview",
    name: "admin-overview",
    component: () => import("../views/OverviewView.vue"),
    meta: { requiresAdmin: true, title: "总览" } satisfies AdminRouteMeta,
  },
  {
    path: "/events",
    name: "admin-events",
    component: () => import("../views/EventsView.vue"),
    meta: { requiresAdmin: true, title: "事件审计" } satisfies AdminRouteMeta,
  },
  {
    path: "/events/:traceId",
    name: "admin-trace",
    component: () => import("../views/TraceView.vue"),
    props: true,
    meta: { requiresAdmin: true, title: "攻防链路" } satisfies AdminRouteMeta,
  },
  {
    path: "/labs",
    name: "admin-labs",
    component: () => import("../views/LabsView.vue"),
    meta: { requiresAdmin: true, title: "实验目录配置" } satisfies AdminRouteMeta,
  },
  {
    path: "/learners",
    name: "admin-learners",
    component: () => import("../views/LearnersView.vue"),
    meta: { requiresAdmin: true, title: "学习过程" } satisfies AdminRouteMeta,
  },
  {
    path: "/learners/:userId",
    name: "admin-learner-detail",
    component: () => import("../views/LearnerDetailView.vue"),
    props: true,
    meta: { requiresAdmin: true, title: "学习过程" } satisfies AdminRouteMeta,
  },
  {
    path: "/audit",
    name: "admin-audit",
    component: () => import("../views/AuditView.vue"),
    meta: { requiresAdmin: true, title: "操作审计" } satisfies AdminRouteMeta,
  },
  {
    path: "/:pathMatch(.*)*",
    name: "admin-not-found",
    component: () => import("../views/NotFoundView.vue"),
    meta: { title: "页面不存在" } satisfies AdminRouteMeta,
  },
];

export function createAdminRouter() {
  const router = createRouter({
    history: createWebHistory(),
    routes,
  });

  router.beforeEach(async (to) => {
    const session = useSessionStore();

    if (!to.meta.requiresAdmin) {
      return true;
    }

    // 刷新后只有 token 没有用户信息，先补一次 me；失败即判定会话失效
    if (session.token && !session.user) {
      const restored = await session.loadCurrentUser();

      if (!restored) {
        return {
          path: "/login",
          query: { redirect: to.fullPath },
        };
      }
    }

    if (!session.token) {
      return {
        path: "/login",
        query: { redirect: to.fullPath },
      };
    }

    return true;
  });

  return router;
}
