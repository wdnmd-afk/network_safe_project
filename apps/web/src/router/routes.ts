import type { RouteRecordRaw } from "vue-router";

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("../views/HomeView.vue"),
  },
  {
    path: "/products",
    name: "products",
    component: () => import("../views/ProductsView.vue"),
  },
  {
    path: "/login",
    name: "login",
    component: () => import("../views/LoginView.vue"),
  },
  {
    path: "/account",
    name: "account",
    component: () => import("../views/AccountView.vue"),
  },
  {
    path: "/orders",
    name: "orders",
    component: () => import("../views/OrdersView.vue"),
  },
  {
    path: "/support",
    name: "support",
    component: () => import("../views/SupportView.vue"),
  },
  {
    path: "/labs",
    name: "labs",
    component: () => import("../views/LabsView.vue"),
  },
  {
    path: "/labs/web/xss/vuln",
    name: "lab-web-xss-vuln",
    component: () => import("../views/XssLabView.vue"),
    props: {
      variant: "vuln",
    },
  },
  {
    path: "/labs/web/xss/fixed",
    name: "lab-web-xss-fixed",
    component: () => import("../views/XssLabView.vue"),
    props: {
      variant: "fixed",
    },
  },
];
