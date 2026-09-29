<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";

import type { LearnerSummary } from "@nsm/shared";

import { fetchLearners } from "../api/admin";
import EmptyState from "../components/EmptyState.vue";
import { formatCount, formatDateTime } from "../modules/format";

const learners = ref<LearnerSummary[]>([]);
const isLoading = ref(true);
const errorMessage = ref("");

async function load() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await fetchLearners();
    learners.value = response.items;
  } catch (error) {
    learners.value = [];
    errorMessage.value =
      error instanceof Error ? error.message : "用户列表加载失败";
  } finally {
    isLoading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <section class="panel">
    <div class="panel-heading">
      <div>
        <span class="panel-label">Learners</span>
        <h2>账号与学习概况</h2>
        <p class="panel-hint">
          只读视图。管理端不提供建号、改角色或改状态的操作。
        </p>
      </div>
      <button type="button" class="btn" :disabled="isLoading" @click="load">
        刷新
      </button>
    </div>

    <p v-if="isLoading" class="skeleton" aria-label="加载中"></p>
    <p v-else-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</p>
    <EmptyState v-else-if="learners.length === 0" title="没有账号" />

    <div v-else class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>账号</th>
            <th>角色</th>
            <th>状态</th>
            <th>学习进度</th>
            <th>已完成</th>
            <th>验证记录</th>
            <th>事件数</th>
            <th>最近活动</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="learner in learners" :key="learner.id">
            <td>
              <strong>{{ learner.displayName }}</strong>
              <div class="faint mono">{{ learner.username }}</div>
            </td>
            <td>
              <span class="badge" :class="learner.role === 'admin' ? 'badge-accent' : ''">
                {{ learner.role }}
              </span>
            </td>
            <td>
              <span
                class="badge"
                :class="learner.status === 'active' ? 'badge-success' : 'badge-danger'"
              >
                {{ learner.status === "active" ? "已启用" : "已停用" }}
              </span>
            </td>
            <td>{{ formatCount(learner.progressCount) }}</td>
            <td>{{ formatCount(learner.completedCount) }}</td>
            <td>{{ formatCount(learner.verificationCount) }}</td>
            <td>{{ formatCount(learner.eventCount) }}</td>
            <td>{{ formatDateTime(learner.lastActivityAt) }}</td>
            <td>
              <RouterLink class="btn" :to="`/learners/${learner.id}`">
                查看学习过程
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
