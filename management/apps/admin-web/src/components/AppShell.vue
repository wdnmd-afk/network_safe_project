<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRouter } from "vue-router";

import { useSessionStore } from "../stores/session";

const session = useSessionStore();
const router = useRouter();

const navItems = [
  { path: "/overview", label: "总览" },
  { path: "/events", label: "事件审计" },
  { path: "/labs", label: "实验目录" },
  { path: "/learners", label: "学习过程" },
  { path: "/audit", label: "操作审计" },
];

const title = computed(() => {
  const value = router.currentRoute.value.meta.title;
  return typeof value === "string" ? value : "管理端";
});

const displayName = computed(() => session.user?.displayName ?? "未登录");

async function handleLogout() {
  await session.logout();
  void router.push("/login");
}
</script>

<template>
  <div class="shell">
    <aside class="shell-sidebar">
      <div class="shell-brand">
        <span class="shell-brand-mark" aria-hidden="true">NS</span>
        <span class="shell-brand-text">
          <strong>Network Safe</strong>
          <span>管理端</span>
        </span>
      </div>

      <nav class="shell-nav" aria-label="管理端导航">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :class="{ 'is-active': router.currentRoute.value.path.startsWith(item.path) }"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="shell-sidebar-footer">
        <span>仅限本机受控环境</span>
        <a href="http://127.0.0.1:6670" target="_blank" rel="noreferrer">
          打开学习平台
        </a>
      </div>
    </aside>

    <div class="shell-main">
      <header class="shell-topbar">
        <div class="shell-topbar-title">
          <h1>{{ title }}</h1>
          <span>本地实验平台的运行期配置与审计</span>
        </div>
        <div class="shell-topbar-actions">
          <span class="badge badge-accent">{{ displayName }}</span>
          <button type="button" class="btn" @click="handleLogout">退出登录</button>
        </div>
      </header>

      <main class="shell-content">
        <slot />
      </main>
    </div>
  </div>
</template>
