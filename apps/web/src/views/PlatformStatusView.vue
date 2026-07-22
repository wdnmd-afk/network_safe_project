<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { storeToRefs } from "pinia";

import { fetchLabs, type LabMetadata } from "../api/labs";
import type { LabEventLogFilters } from "../api/lab-records";
import {
  buildLabReadinessRows,
  getStatusLabel,
  summarizeAutomationCoverage,
  summarizeCategories,
  summarizeEvents,
  summarizeStatusBuckets,
  type LabStatusKey,
} from "../labs/platform-status";
import { useSessionStore } from "../stores/session";

const session = useSessionStore();
const {
  isAuthenticated,
  isLoadingLabEventLogs,
  labEventLogs,
  labEventLogsErrorMessage,
  user,
} = storeToRefs(session);

const labs = ref<LabMetadata[]>([]);
const isLoadingLabs = ref(true);
const labsErrorMessage = ref("");

const eventPhaseFilter = ref<"" | NonNullable<LabEventLogFilters["phase"]>>("");
const eventRiskFilter = ref<
  "" | NonNullable<LabEventLogFilters["riskLevel"]>
>("");
const categoryFilter = ref("");
const statusFilter = ref<"" | LabStatusKey>("");

const eventLogFilters = computed<LabEventLogFilters>(() => ({
  ...(eventPhaseFilter.value ? { phase: eventPhaseFilter.value } : {}),
  ...(eventRiskFilter.value ? { riskLevel: eventRiskFilter.value } : {}),
}));

const statusBuckets = computed(() => summarizeStatusBuckets(labs.value));
const categorySummaries = computed(() => summarizeCategories(labs.value));
const automationCoverage = computed(() =>
  summarizeAutomationCoverage(labs.value),
);
const readinessRows = computed(() => buildLabReadinessRows(labs.value));
const eventSummary = computed(() => summarizeEvents(labEventLogs.value));

const readyPercent = computed(() => {
  const ready = statusBuckets.value.find((bucket) => bucket.key === "ready");
  return ready?.percent ?? 0;
});

const filteredRows = computed(() =>
  readinessRows.value.filter((row) => {
    if (categoryFilter.value && row.category !== categoryFilter.value) {
      return false;
    }

    if (statusFilter.value && row.status !== statusFilter.value) {
      return false;
    }

    return true;
  }),
);

const categoryFilterOptions = computed(() =>
  categorySummaries.value.map((item) => ({
    value: item.category,
    label: item.label,
  })),
);

// 甜甜圈图：把各状态占比换算成 conic-gradient 分段。
const statusDonutStyle = computed(() => {
  const palette: Record<LabStatusKey, string> = {
    ready: "#22c55e",
    "in-progress": "#fbbf24",
    planned: "#38bdf8",
    deprecated: "#64748b",
  };
  const total = labs.value.length;

  if (total === 0) {
    return {
      background: "conic-gradient(rgba(148, 163, 184, 0.25) 0 100%)",
    };
  }

  let cursor = 0;
  const segments = statusBuckets.value
    .filter((bucket) => bucket.count > 0)
    .map((bucket) => {
      const start = (cursor / total) * 360;
      cursor += bucket.count;
      const end = (cursor / total) * 360;
      return `${palette[bucket.key]} ${start}deg ${end}deg`;
    });

  return {
    background: `conic-gradient(${segments.join(", ")})`,
  };
});

const statusLegend = computed(() => {
  const palette: Record<LabStatusKey, string> = {
    ready: "#22c55e",
    "in-progress": "#fbbf24",
    planned: "#38bdf8",
    deprecated: "#64748b",
  };

  return statusBuckets.value.map((bucket) => ({
    ...bucket,
    color: palette[bucket.key],
  }));
});

const riskLegend = computed(() => {
  const palette = {
    critical: "#f43f5e",
    high: "#fb923c",
    medium: "#fbbf24",
    low: "#38bdf8",
  } as const;
  const risk = eventSummary.value.risk;

  return (["critical", "high", "medium", "low"] as const).map((key) => ({
    key,
    color: palette[key],
    count: risk[key],
    percent:
      eventSummary.value.total > 0
        ? Math.round((risk[key] / eventSummary.value.total) * 100)
        : 0,
  }));
});

const riskBadgeClass: Record<string, string> = {
  critical: "risk-critical",
  high: "risk-high",
  medium: "risk-medium",
  low: "risk-low",
  none: "risk-none",
};

function formatDateTime(value: string) {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}

async function loadLabs() {
  isLoadingLabs.value = true;
  labsErrorMessage.value = "";

  try {
    const response = await fetchLabs();
    labs.value = response.items;
  } catch (error) {
    labsErrorMessage.value =
      error instanceof Error ? error.message : "实验状态加载失败";
  } finally {
    isLoadingLabs.value = false;
  }
}

async function refreshEventLogs() {
  await session.loadLabEventLogs(eventLogFilters.value);
}

function resetLabFilters() {
  categoryFilter.value = "";
  statusFilter.value = "";
}

onMounted(async () => {
  await loadLabs();

  if (!user.value) {
    await session.loadCurrentUser();
  }

  if (session.token) {
    await refreshEventLogs();
  }
});
</script>

<template>
  <section class="page-section status-page">
    <div class="section-heading">
      <p class="eyebrow">Status</p>
      <h1>全局状态检测</h1>
      <p>
        实验就绪状态来自后端 `/api/labs`，事件日志来自 `/api/lab-event-logs/me`，
        本页只做本机可视化聚合，不发起任何外部请求。
      </p>
    </div>

    <p v-if="isLoadingLabs" class="state-text">正在加载实验状态...</p>
    <p v-else-if="labsErrorMessage" class="state-text error-text">
      {{ labsErrorMessage }}
    </p>

    <template v-else>
      <!-- 概览指标卡 -->
      <div class="status-metric-grid">
        <article class="status-metric-card">
          <span class="metric-label">实验总数</span>
          <strong class="metric-value">{{ labs.length }}</strong>
          <span class="metric-hint">跨 {{ categorySummaries.length }} 个分类</span>
        </article>
        <article class="status-metric-card accent-ready">
          <span class="metric-label">已就绪</span>
          <strong class="metric-value">{{ readyPercent }}%</strong>
          <span class="metric-hint">
            {{ statusBuckets.find((bucket) => bucket.key === "ready")?.count ?? 0 }}
            个实验闭环完成
          </span>
        </article>
        <article class="status-metric-card accent-auto">
          <span class="metric-label">自动化覆盖</span>
          <strong class="metric-value">
            {{ automationCoverage.anyAutomationPercent }}%
          </strong>
          <span class="metric-hint">
            {{ automationCoverage.fullyCoveredThreeWay }} 个三重验证齐全
          </span>
        </article>
        <article class="status-metric-card accent-event">
          <span class="metric-label">我的事件日志</span>
          <strong class="metric-value">{{ eventSummary.total }}</strong>
          <span class="metric-hint">
            攻击 {{ eventSummary.phase.attack }} / 防御
            {{ eventSummary.phase.defense }}
          </span>
        </article>
      </div>

      <div class="status-columns">
        <!-- 状态甜甜圈 -->
        <article class="status-panel">
          <h2>就绪状态分布</h2>
          <div class="donut-row">
            <div class="donut" :style="statusDonutStyle">
              <div class="donut-hole">
                <strong>{{ labs.length }}</strong>
                <span>实验</span>
              </div>
            </div>
            <ul class="legend-list">
              <li v-for="item in statusLegend" :key="item.key">
                <span
                  class="legend-dot"
                  :style="{ background: item.color }"
                  aria-hidden="true"
                ></span>
                <span class="legend-label">{{ item.label }}</span>
                <span class="legend-value">{{ item.count }} ({{ item.percent }}%)</span>
              </li>
            </ul>
          </div>
        </article>

        <!-- 自动化覆盖条 -->
        <article class="status-panel">
          <h2>验证证据覆盖</h2>
          <ul class="coverage-list">
            <li>
              <div class="coverage-head">
                <span>Playwright 页面验证</span>
                <span>
                  {{ automationCoverage.withPlaywright }} /
                  {{ automationCoverage.total }}
                </span>
              </div>
              <div class="coverage-track">
                <div
                  class="coverage-fill bar-playwright"
                  :style="{ width: `${automationCoverage.playwrightPercent}%` }"
                ></div>
              </div>
            </li>
            <li>
              <div class="coverage-head">
                <span>服务端 API 测试</span>
                <span>
                  {{ automationCoverage.withApiTest }} /
                  {{ automationCoverage.total }}
                </span>
              </div>
              <div class="coverage-track">
                <div
                  class="coverage-fill bar-apitest"
                  :style="{ width: `${automationCoverage.apiTestPercent}%` }"
                ></div>
              </div>
            </li>
            <li>
              <div class="coverage-head">
                <span>只读一致性验证</span>
                <span>
                  {{ automationCoverage.withScriptVerification }} /
                  {{ automationCoverage.total }}
                </span>
              </div>
              <div class="coverage-track">
                <div
                  class="coverage-fill bar-script"
                  :style="{
                    width: `${automationCoverage.scriptVerificationPercent}%`,
                  }"
                ></div>
              </div>
            </li>
          </ul>
        </article>
      </div>

      <!-- 分类就绪度 -->
      <article class="status-panel">
        <h2>分类就绪度</h2>
        <ul class="category-list">
          <li v-for="item in categorySummaries" :key="item.category">
            <div class="category-head">
              <strong>{{ item.label }}</strong>
              <span>{{ item.ready }} / {{ item.total }} 就绪</span>
            </div>
            <div class="category-track" role="presentation">
              <div
                class="category-seg seg-ready"
                :style="{ width: `${(item.ready / item.total) * 100}%` }"
                :title="`已就绪 ${item.ready}`"
              ></div>
              <div
                class="category-seg seg-progress"
                :style="{ width: `${(item.inProgress / item.total) * 100}%` }"
                :title="`进行中 ${item.inProgress}`"
              ></div>
              <div
                class="category-seg seg-planned"
                :style="{ width: `${(item.planned / item.total) * 100}%` }"
                :title="`规划中 ${item.planned}`"
              ></div>
            </div>
          </li>
        </ul>
      </article>

      <!-- 实验就绪明细表 -->
      <article class="status-panel">
        <div class="panel-head-row">
          <h2>实验就绪明细</h2>
          <div class="filter-row">
            <label>
              <span>分类</span>
              <select v-model="categoryFilter">
                <option value="">全部</option>
                <option
                  v-for="option in categoryFilterOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </label>
            <label>
              <span>状态</span>
              <select v-model="statusFilter">
                <option value="">全部</option>
                <option value="ready">已就绪</option>
                <option value="in-progress">进行中</option>
                <option value="planned">规划中</option>
                <option value="deprecated">已弃用</option>
              </select>
            </label>
            <button type="button" class="ghost-button" @click="resetLabFilters">
              重置
            </button>
          </div>
        </div>

        <p class="table-hint">
          共 {{ filteredRows.length }} / {{ readinessRows.length }} 个实验
        </p>

        <div class="status-table-wrap">
          <table class="status-table">
            <thead>
              <tr>
                <th>实验</th>
                <th>分类</th>
                <th>状态</th>
                <th>模式</th>
                <th>入口 (web/api/脚本/文档)</th>
                <th>验证证据</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in filteredRows" :key="row.id">
                <td>
                  <strong>{{ row.title }}</strong>
                  <small>{{ row.id }}</small>
                </td>
                <td>{{ row.categoryLabel }}</td>
                <td>
                  <span class="status-chip" :class="`chip-${row.status}`">
                    {{ getStatusLabel(row.status) }}
                  </span>
                </td>
                <td>{{ row.mode }}</td>
                <td class="entry-cell">
                  {{ row.webEntryCount }} / {{ row.apiEntryCount }} /
                  {{ row.scriptEntryCount }} / {{ row.docEntryCount }}
                </td>
                <td>
                  <span class="evidence-dots" :aria-label="`${row.automationTypes} 类验证证据`">
                    <span
                      class="evidence-dot"
                      :class="{ on: row.hasPlaywright }"
                      title="Playwright 页面验证"
                    >P</span>
                    <span
                      class="evidence-dot"
                      :class="{ on: row.hasApiTest }"
                      title="服务端 API 测试"
                    >A</span>
                    <span
                      class="evidence-dot"
                      :class="{ on: row.hasScriptVerification }"
                      title="只读一致性验证"
                    >S</span>
                  </span>
                </td>
                <td>
                  <RouterLink class="row-link" :to="row.detailPath">
                    详情
                  </RouterLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <!-- 事件日志审查 -->
      <article class="status-panel">
        <div class="panel-head-row">
          <h2>事件日志审查</h2>
          <div class="filter-row" v-if="isAuthenticated">
            <label>
              <span>阶段</span>
              <select v-model="eventPhaseFilter" @change="refreshEventLogs">
                <option value="">全部</option>
                <option value="attack">攻击</option>
                <option value="defense">防御</option>
                <option value="normal">正常</option>
              </select>
            </label>
            <label>
              <span>风险</span>
              <select v-model="eventRiskFilter" @change="refreshEventLogs">
                <option value="">全部</option>
                <option value="critical">critical</option>
                <option value="high">high</option>
                <option value="medium">medium</option>
                <option value="low">low</option>
              </select>
            </label>
          </div>
        </div>

        <p v-if="!isAuthenticated" class="state-text">
          事件日志需要登录后查看。
          <RouterLink class="row-link" to="/login">去登录</RouterLink>
        </p>

        <template v-else>
          <div class="event-overview">
            <!-- 风险热力条 -->
            <div class="risk-bar" role="img" aria-label="事件风险分布">
              <div
                v-for="item in riskLegend"
                :key="item.key"
                class="risk-seg"
                :style="{
                  width: `${item.percent}%`,
                  background: item.color,
                }"
                :title="`${item.key}: ${item.count}`"
              ></div>
            </div>
            <ul class="risk-legend">
              <li v-for="item in riskLegend" :key="item.key">
                <span
                  class="legend-dot"
                  :style="{ background: item.color }"
                  aria-hidden="true"
                ></span>
                <span>{{ item.key }}</span>
                <strong>{{ item.count }}</strong>
              </li>
            </ul>
          </div>

          <div class="decision-row">
            <span class="decision-chip decision-accepted">
              放行 {{ eventSummary.decision.accepted }}
            </span>
            <span class="decision-chip decision-blocked">
              阻断 {{ eventSummary.decision.blocked }}
            </span>
            <span class="decision-chip decision-failed">
              失败 {{ eventSummary.decision.failed }}
            </span>
          </div>

          <p v-if="isLoadingLabEventLogs" class="state-text">
            正在读取事件日志...
          </p>
          <p
            v-else-if="labEventLogsErrorMessage"
            class="state-text error-text"
          >
            {{ labEventLogsErrorMessage }}
          </p>
          <p v-else-if="eventSummary.total === 0" class="state-text">
            暂无事件日志。进入任意实验并提交一次操作后，这里会出现记录。
          </p>

          <div v-else class="status-table-wrap">
            <table class="status-table">
              <thead>
                <tr>
                  <th>实验</th>
                  <th>事件数</th>
                  <th>攻击/防御/正常</th>
                  <th>最高风险</th>
                  <th>最近时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in eventSummary.byLab" :key="row.labKey">
                  <td>
                    <strong>{{ row.title }}</strong>
                    <small>{{ row.labKey }}</small>
                  </td>
                  <td>{{ row.total }}</td>
                  <td class="entry-cell">
                    {{ row.attack }} / {{ row.defense }} / {{ row.normal }}
                  </td>
                  <td>
                    <span
                      class="status-chip"
                      :class="riskBadgeClass[row.highestRisk]"
                    >
                      {{ row.highestRisk }}
                    </span>
                  </td>
                  <td class="entry-cell">{{ formatDateTime(row.lastCreatedAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </article>
    </template>
  </section>
</template>

<style scoped>
.status-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.status-metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 1rem;
}

.status-metric-card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1.25rem;
  border: 1px solid rgba(248, 250, 252, 0.12);
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.6);
}

.metric-label {
  color: #cbd5e1;
  font-size: 0.85rem;
}

.metric-value {
  font-size: 2rem;
  line-height: 1;
}

.metric-hint {
  color: #94a3b8;
  font-size: 0.78rem;
}

.accent-ready {
  border-color: rgba(34, 197, 94, 0.5);
}

.accent-auto {
  border-color: rgba(56, 189, 248, 0.5);
}

.accent-event {
  border-color: rgba(251, 191, 36, 0.5);
}

.status-columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
  gap: 1.5rem;
}

.status-panel {
  padding: 1.5rem;
  border: 1px solid rgba(248, 250, 252, 0.12);
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.55);
}

.status-panel h2 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
}

.donut-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.donut {
  position: relative;
  width: 9rem;
  height: 9rem;
  border-radius: 50%;
}

.donut-hole {
  position: absolute;
  inset: 1.5rem;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #0f172a;
  text-align: center;
}

.donut-hole strong {
  font-size: 1.6rem;
}

.donut-hole span {
  color: #94a3b8;
  font-size: 0.75rem;
}

.legend-list,
.coverage-list,
.category-list,
.risk-legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.legend-list li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-dot {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-label {
  flex: 1;
}

.legend-value {
  color: #cbd5e1;
  font-variant-numeric: tabular-nums;
}

.coverage-head,
.category-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.35rem;
  font-size: 0.9rem;
}

.coverage-track,
.category-track {
  height: 0.6rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.2);
  overflow: hidden;
  display: flex;
}

.coverage-fill {
  height: 100%;
  border-radius: 999px;
}

.bar-playwright {
  background: #38bdf8;
}

.bar-apitest {
  background: #22c55e;
}

.bar-script {
  background: #fbbf24;
}

.category-seg {
  height: 100%;
}

.seg-ready {
  background: #22c55e;
}

.seg-progress {
  background: #fbbf24;
}

.seg-planned {
  background: #38bdf8;
}

.panel-head-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}

.filter-row {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
  flex-wrap: wrap;
}

.filter-row label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: #cbd5e1;
}

.filter-row select {
  padding: 0.45rem 0.6rem;
  border-radius: 8px;
  border: 1px solid rgba(248, 250, 252, 0.2);
  background: rgba(15, 23, 42, 0.9);
  color: #f8fafc;
}

.ghost-button {
  padding: 0.5rem 0.9rem;
  border-radius: 8px;
  border: 1px solid rgba(248, 250, 252, 0.2);
  background: transparent;
  color: #f8fafc;
}

.table-hint {
  color: #94a3b8;
  font-size: 0.8rem;
  margin: 0 0 0.75rem;
}

.status-table-wrap {
  overflow-x: auto;
}

.status-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.status-table th,
.status-table td {
  padding: 0.6rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid rgba(248, 250, 252, 0.08);
  vertical-align: middle;
}

.status-table th {
  color: #94a3b8;
  font-weight: 600;
  white-space: nowrap;
}

.status-table td strong {
  display: block;
}

.status-table td small {
  color: #64748b;
  font-size: 0.72rem;
}

.entry-cell {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.status-chip {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  white-space: nowrap;
}

.chip-ready {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.chip-in-progress {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.chip-planned {
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
}

.chip-deprecated {
  background: rgba(100, 116, 139, 0.25);
  color: #cbd5e1;
}

.risk-critical {
  background: rgba(244, 63, 94, 0.2);
  color: #fb7185;
}

.risk-high {
  background: rgba(251, 146, 60, 0.2);
  color: #fdba74;
}

.risk-medium {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.risk-low {
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
}

.risk-none {
  background: rgba(100, 116, 139, 0.25);
  color: #cbd5e1;
}

.evidence-dots {
  display: inline-flex;
  gap: 0.3rem;
}

.evidence-dot {
  display: inline-grid;
  place-items: center;
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  background: rgba(148, 163, 184, 0.18);
  color: #64748b;
}

.evidence-dot.on {
  background: rgba(34, 197, 94, 0.25);
  color: #4ade80;
}

.row-link {
  color: #38bdf8;
  font-size: 0.82rem;
}

.event-overview {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.risk-bar {
  display: flex;
  height: 0.9rem;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(148, 163, 184, 0.2);
}

.risk-seg {
  height: 100%;
}

.risk-legend {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1rem;
}

.risk-legend li {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
}

.decision-row {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.decision-chip {
  padding: 0.3rem 0.8rem;
  border-radius: 999px;
  font-size: 0.8rem;
}

.decision-accepted {
  background: rgba(34, 197, 94, 0.18);
  color: #4ade80;
}

.decision-blocked {
  background: rgba(251, 191, 36, 0.18);
  color: #fbbf24;
}

.decision-failed {
  background: rgba(244, 63, 94, 0.18);
  color: #fb7185;
}

.state-text {
  color: #cbd5e1;
}

.error-text {
  color: #fb7185;
}
</style>
