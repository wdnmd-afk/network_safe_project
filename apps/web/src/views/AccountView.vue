<script setup lang="ts">
import { computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { RouterLink, useRouter } from "vue-router";

import { useSessionStore } from "../stores/session";

const session = useSessionStore();
const router = useRouter();
const {
  displayName,
  errorMessage,
  isAuthenticated,
  isLoading,
  isLoadingLabRecords,
  labRecords,
  labRecordsErrorMessage,
  user,
} = storeToRefs(session);

const avatarText = computed(() => displayName.value.slice(0, 1));

onMounted(() => {
  if (!user.value) {
    void session.loadCurrentUser();
  }

  void session.loadLabRecordSummary();
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

      <section class="profile-panel records-panel">
        <div>
          <h2>学习进度</h2>
          <p v-if="isLoadingLabRecords">正在读取实验记录</p>
          <p v-else-if="labRecordsErrorMessage">{{ labRecordsErrorMessage }}</p>
          <p v-else-if="labRecords.progress.length === 0">暂无学习记录</p>
          <ul v-else class="record-list">
            <li v-for="item in labRecords.progress" :key="`${item.labKey}-progress`">
              <strong>{{ item.title }}</strong>
              <span>{{ item.variantKey }} / {{ item.status }}</span>
            </li>
          </ul>
        </div>
      </section>

      <section class="profile-panel records-panel">
        <div>
          <h2>最近验证</h2>
          <p v-if="isLoadingLabRecords">正在读取验证记录</p>
          <p v-else-if="labRecordsErrorMessage">{{ labRecordsErrorMessage }}</p>
          <p v-else-if="labRecords.verifications.length === 0">暂无验证记录</p>
          <ul v-else class="record-list">
            <li
              v-for="item in labRecords.verifications"
              :key="`${item.labKey}-${item.createdAt}`"
            >
              <strong>{{ item.title }}</strong>
              <span>{{ item.variantKey }} / {{ item.result }}</span>
              <small>{{ item.summary }}</small>
            </li>
          </ul>
        </div>
      </section>
    </div>
  </section>
</template>
