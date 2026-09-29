<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import type { OverviewResponse } from "@nsm/shared";

import { fetchOverview } from "../api/admin";
import EmptyState from "../components/EmptyState.vue";
import { formatCount, formatPercent, riskLabel } from "../modules/format";

const overview = ref<OverviewResponse | null>(null);
const isLoading = ref(true);
const errorMessage = ref("");

const dailyMax = computed(() => {
  const counts = overview.value?.events.daily.map((item) => item.count) ?? [];
  return Math.max(...counts, 1);
});

const riskOrder = ["critical", "high", "medium", "low"] as const;

async function load() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    overview.value = await fetchOverview();
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "总览数据加载失败";
  } finally {
    isLoading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <p v-if="isLoading" class="skeleton" aria-label="加载中"></p>
  <p v-else-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</p>

  <template v-else-if="overview">
    <!-- 主站数据库退化时停用配置不生效，必须显性提示 -->
    <div
      v-if="!overview.mainSite.reachable"
      class="alert alert-warning"
      role="status"
    >
      <strong>无法连接主站</strong>
      <span>
        管理端仍可查看数据，但无法确认启停配置是否生效。请确认主站服务（默认
        127.0.0.1:6667）已启动。
      </span>
    </div>
    <div
      v-else-if="overview.mainSite.availabilitySource === 'metadata-fallback'"
      class="alert alert-warning"
      role="status"
    >
      <strong>主站启停状态已退化</strong>
      <span>
        主站读不到数据库，当前按元数据放行，管理端的停用配置暂不生效。
      </span>
    </div>

    <section class="kpi-grid" aria-label="关键指标">
      <article class="kpi">
        <span>实验总数</span>
        <strong>{{ formatCount(overview.labs.total) }}</strong>
        <small>
          已启用 {{ overview.labs.enabled }} · {{ overview.labs.categories }} 个分类
        </small>
      </article>
      <article class="kpi">
        <span>变体总数</span>
        <strong>{{ formatCount(overview.variants.total) }}</strong>
        <small>已启用 {{ overview.variants.enabled }}</small>
      </article>
      <article class="kpi">
        <span>事件总量</span>
        <strong>{{ formatCount(overview.events.total) }}</strong>
        <small>全部用户累计</small>
      </article>
      <article class="kpi">
        <span>阻断率</span>
        <strong>{{ formatPercent(overview.events.blockRate) }}</strong>
        <small>已阻断 {{ overview.events.blocked }} 条</small>
      </article>
      <article class="kpi">
        <span>账号数</span>
        <strong>{{ formatCount(overview.learners) }}</strong>
        <small>含管理员账号</small>
      </article>
    </section>

    <div class="split">
      <section class="panel" aria-label="近 7 日事件量">
        <div class="panel-heading">
          <div>
            <span class="panel-label">Events</span>
            <h2>近 7 日事件量</h2>
          </div>
          <span class="panel-hint">按天汇总</span>
        </div>

        <ul class="timeline">
          <li
            v-for="item in overview.events.daily"
            :key="item.date"
            class="timeline-item"
          >
            <span class="timeline-marker">{{ item.count }}</span>
            <div class="timeline-body">
              <div class="row">
                <strong>{{ item.date }}</strong>
              </div>
              <div
                :style="{
                  height: '6px',
                  borderRadius: '3px',
                  background: 'var(--accent)',
                  width: `${Math.round((item.count / dailyMax) * 100)}%`,
                  minWidth: item.count > 0 ? '4px' : '0',
                }"
              ></div>
            </div>
          </li>
        </ul>
      </section>

      <section class="panel" aria-label="风险分布">
        <div class="panel-heading">
          <div>
            <span class="panel-label">Risk</span>
            <h2>风险分布</h2>
          </div>
        </div>

        <ul class="stack" style="list-style: none; padding: 0; margin: 0">
          <li v-for="level in riskOrder" :key="level" class="row">
            <span
              class="badge"
              :class="level === 'critical' || level === 'high' ? 'badge-danger' : level === 'medium' ? 'badge-warning' : ''"
            >
              {{ riskLabel(level) }}
            </span>
            <strong>{{ formatCount(overview.events.byRisk[level]) }}</strong>
          </li>
        </ul>
      </section>
    </div>
  </template>

  <EmptyState v-else title="暂无数据" description="后端返回为空。" />
</template>
