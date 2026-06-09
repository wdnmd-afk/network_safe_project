<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";

const navItems = [
  { path: "/", label: "首页" },
  { path: "/products", label: "商品" },
  { path: "/orders", label: "订单" },
  { path: "/support", label: "客服" },
  { path: "/labs", label: "实验" },
];
</script>

<template>
  <div class="app-shell">
    <header class="site-header">
      <RouterLink class="brand" to="/" aria-label="SafeMart 首页">
        <span class="brand-mark">S</span>
        <span>
          <strong>SafeMart</strong>
          <small>本机训练商城</small>
        </span>
      </RouterLink>

      <nav class="site-nav" aria-label="主导航">
        <RouterLink v-for="item in navItems" :key="item.path" :to="item.path">
          {{ item.label }}
        </RouterLink>
      </nav>

      <RouterLink class="header-action" to="/account">账户中心</RouterLink>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>
