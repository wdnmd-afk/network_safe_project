import { createRouter, createWebHistory } from "vue-router";

import { fetchLab } from "../api/labs";
import { createLabVariantGuard } from "./lab-availability";
import { routes } from "./routes";

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 管理端停用的变体在前台入口层拦截，重定向回详情页并提示停用
router.beforeEach(
  createLabVariantGuard(async (category, scene) => {
    const lab = await fetchLab(category, scene);
    return lab.availability;
  }),
);
