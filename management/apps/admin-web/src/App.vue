<script setup lang="ts">
import { computed } from "vue";
import { RouterView, useRoute } from "vue-router";

import AppShell from "./components/AppShell.vue";

const route = useRoute();

// 登录页不套管理端外壳：未登录时侧栏导航没有意义
const showShell = computed(() => route.name !== "admin-login");
</script>

<template>
  <AppShell v-if="showShell">
    <RouterView />
  </AppShell>
  <RouterView v-else />
</template>
