<script setup lang="ts">
import { computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { RouterLink, useRouter } from "vue-router";

import { useSessionStore } from "../stores/session";

const session = useSessionStore();
const router = useRouter();
const { displayName, errorMessage, isAuthenticated, isLoading, user } =
  storeToRefs(session);

const avatarText = computed(() => displayName.value.slice(0, 1));

onMounted(() => {
  if (!user.value) {
    void session.loadCurrentUser();
  }
});

async function logout() {
  await session.logout();
  await router.push("/login");
}
</script>

<template>
  <section class="page-section">
    <div class="section-heading">
      <p class="eyebrow">Account</p>
      <h1>账户中心</h1>
      <p>当前资料来自后端 `/api/auth/me`，用于后续认证、授权和会话类实验。</p>
    </div>

    <div v-if="isLoading" class="profile-panel">
      <div>
        <h2>正在读取账户资料</h2>
        <p>请稍候</p>
      </div>
    </div>

    <div v-else-if="!isAuthenticated" class="profile-panel">
      <div>
        <h2>尚未登录</h2>
        <p>{{ errorMessage || "登录后可以查看 MySQL 用户资料。" }}</p>
      </div>
      <RouterLink class="secondary-action" to="/login">去登录</RouterLink>
    </div>

    <div v-else class="account-grid">
      <section class="profile-panel">
        <span class="avatar" aria-hidden="true">{{ avatarText }}</span>
        <div>
          <h2>{{ displayName }}</h2>
          <p>{{ user?.username }}</p>
        </div>
      </section>

      <section class="profile-panel">
        <div>
          <h2>{{ user?.role }}</h2>
          <p>角色</p>
        </div>
        <button type="button" @click="logout">退出登录</button>
      </section>

      <section class="profile-panel">
        <div>
          <h2>{{ user?.status }}</h2>
          <p>账户状态</p>
        </div>
      </section>
    </div>
  </section>
</template>
