<script setup lang="ts">
import { storeToRefs } from "pinia";

import { useSessionStore } from "../stores/session";

const session = useSessionStore();
const { displayName, membership, riskNoticeCount } = storeToRefs(session);
</script>

<template>
  <section class="page-section">
    <div class="section-heading">
      <p class="eyebrow">Account</p>
      <h1>账户中心</h1>
      <p>账户资料、会员等级和资料更新入口会作为后续权限与文件上传实验基础。</p>
    </div>

    <div class="account-grid">
      <section class="profile-panel">
        <span class="avatar" aria-hidden="true">{{ displayName.slice(0, 1) }}</span>
        <div>
          <h2>{{ displayName }}</h2>
          <p>{{ membership }} 会员</p>
        </div>
      </section>

      <section class="profile-panel">
        <div>
          <h2>{{ riskNoticeCount }} 条</h2>
          <p>账户安全提醒</p>
        </div>
        <button type="button">查看详情</button>
      </section>
    </div>
  </section>
</template>
