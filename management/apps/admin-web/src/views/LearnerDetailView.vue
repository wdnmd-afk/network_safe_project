<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import type { LearnerDetail, LearnerSummary } from "@nsm/shared";

import { fetchLearner } from "../api/admin";
import EmptyState from "../components/EmptyState.vue";
import { formatCount, formatDateTime } from "../modules/format";

const props = defineProps<{ userId: string }>();

const learner = ref<LearnerSummary | null>(null);
const progress = ref<LearnerDetail["progress"]>([]);
const verifications = ref<LearnerDetail["verifications"]>([]);
const recap = ref<LearnerDetail["recap"]>([]);
const isLoading = ref(true);
const errorMessage = ref("");

const recapTotal = computed(() =>
  recap.value.reduce((sum, item) => sum + item.completedQuestions, 0),
);

async function load() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await fetchLearner(props.userId);

    learner.value = response.learner;
    progress.value = response.progress;
    verifications.value = response.verifications;
    recap.value = response.recap;
  } catch (error) {
    learner.value = null;
    errorMessage.value =
      error instanceof Error ? error.message : "学习过程加载失败";
  } finally {
    isLoading.value = false;
  }
}

watch(() => props.userId, load);
onMounted(load);
</script>

<template>
  <section class="panel">
    <div class="panel-heading">
      <div>
        <span class="panel-label">Learner</span>
        <h2>{{ learner?.displayName ?? "学习过程" }}</h2>
        <p v-if="learner" class="panel-hint">
          {{ learner.username }} · 最近活动 {{ formatDateTime(learner.lastActivityAt) }}
        </p>
      </div>
      <div class="row">
        <button type="button" class="btn" :disabled="isLoading" @click="load">
          刷新
        </button>
        <RouterLink class="btn" to="/learners">返回列表</RouterLink>
      </div>
    </div>

    <p v-if="isLoading" class="skeleton" aria-label="加载中"></p>
    <p v-else-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</p>

    <template v-else-if="learner">
      <div class="kpi-grid">
        <article class="kpi">
          <span>学习进度记录</span>
          <strong>{{ formatCount(learner.progressCount) }}</strong>
          <small>已完成 {{ learner.completedCount }}</small>
        </article>
        <article class="kpi">
          <span>验证记录</span>
          <strong>{{ formatCount(learner.verificationCount) }}</strong>
        </article>
        <article class="kpi">
          <span>事件日志</span>
          <strong>{{ formatCount(learner.eventCount) }}</strong>
        </article>
        <article class="kpi">
          <span>已确认复盘题</span>
          <strong>{{ formatCount(recapTotal) }}</strong>
          <small>跨 {{ recap.length }} 个实验</small>
        </article>
      </div>
    </template>
  </section>

  <template v-if="!isLoading && !errorMessage && learner">
    <div class="split">
      <section class="panel" aria-label="学习进度">
        <div class="panel-heading">
          <div>
            <span class="panel-label">Progress</span>
            <h2>学习进度</h2>
          </div>
          <span class="panel-hint">{{ progress.length }} 条</span>
        </div>

        <EmptyState v-if="progress.length === 0" title="暂无进度记录" />
        <div v-else class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>实验</th>
                <th>变体</th>
                <th>状态</th>
                <th>更新时间</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in progress" :key="`${row.labKey}-${row.variantKey}`">
                <td>
                  {{ row.title }}
                  <div class="faint mono">{{ row.labKey }}</div>
                </td>
                <td>{{ row.variantKey }}</td>
                <td>
                  <span
                    class="badge"
                    :class="row.status === 'completed' ? 'badge-success' : ''"
                  >
                    {{ row.status === "completed" ? "已完成" : row.status }}
                  </span>
                </td>
                <td>{{ formatDateTime(row.updatedAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel" aria-label="复盘完成情况">
        <div class="panel-heading">
          <div>
            <span class="panel-label">Recap</span>
            <h2>复盘完成情况</h2>
            <p class="panel-hint">
              只统计题目是否已确认，不展示作答内容，也不做排名或评分。
            </p>
          </div>
        </div>

        <EmptyState v-if="recap.length === 0" title="暂无复盘记录" />
        <ul v-else class="stack" style="list-style: none; padding: 0; margin: 0">
          <li v-for="row in recap" :key="row.labKey" class="row">
            <span class="mono">{{ row.labKey }}</span>
            <span class="badge">{{ row.traceCount }} 条链路</span>
            <span class="badge badge-accent">已完成 {{ row.completedQuestions }} 题</span>
          </li>
        </ul>
      </section>
    </div>

    <section class="panel" aria-label="验证记录">
      <div class="panel-heading">
        <div>
          <span class="panel-label">Verification</span>
          <h2>验证记录</h2>
        </div>
        <span class="panel-hint">{{ verifications.length }} 条</span>
      </div>

      <EmptyState v-if="verifications.length === 0" title="暂无验证记录" />
      <div v-else class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>实验</th>
              <th>变体</th>
              <th>结果</th>
              <th>摘要</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in verifications" :key="`${row.labKey}-${row.createdAt}`">
              <td>{{ formatDateTime(row.createdAt) }}</td>
              <td>{{ row.title }}</td>
              <td>{{ row.variantKey }}</td>
              <td>
                <span
                  class="badge"
                  :class="row.result === 'passed' ? 'badge-success' : 'badge-warning'"
                >
                  {{ row.result }}
                </span>
              </td>
              <td>{{ row.summary }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </template>
</template>
