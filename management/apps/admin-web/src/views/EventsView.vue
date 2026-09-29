<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";

import type { AdminEvent, TraceDetail } from "@nsm/shared";

import { fetchEvents, fetchTrace } from "../api/admin";
import EmptyState from "../components/EmptyState.vue";
import PaginationBar from "../components/PaginationBar.vue";
import TraceTimeline from "../components/TraceTimeline.vue";
import {
  decisionBadgeClass,
  decisionLabel,
  formatDateTime,
  phaseLabel,
  riskBadgeClass,
  riskLabel,
} from "../modules/format";
import {
  buildEventListParams,
  createEmptyEventFilters,
  hasActiveFilters,
  summarizeEventPage,
  totalPages,
  type EventFilterState,
} from "../modules/events";

const filters = ref<EventFilterState>(createEmptyEventFilters());
const events = ref<AdminEvent[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const isLoading = ref(true);
const errorMessage = ref("");
const traceDetail = ref<TraceDetail | null>(null);
const traceError = ref("");
const isLoadingTrace = ref(false);
const selectedTraceId = ref("");

const summary = computed(() => summarizeEventPage(events.value));
const lastPage = computed(() => totalPages(total.value, pageSize.value));

async function load() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await fetchEvents(
      buildEventListParams(filters.value, page.value, pageSize.value),
    );

    events.value = response.items;
    total.value = response.total;
  } catch (error) {
    events.value = [];
    total.value = 0;
    errorMessage.value =
      error instanceof Error ? error.message : "事件列表加载失败";
  } finally {
    isLoading.value = false;
  }
}

function applyFilters() {
  page.value = 1;
  void load();
}

function resetFilters() {
  filters.value = createEmptyEventFilters();
  applyFilters();
}

function changePage(target: number) {
  page.value = target;
  void load();
}

async function openTrace(traceId: string) {
  selectedTraceId.value = traceId;
  traceDetail.value = null;
  traceError.value = "";
  isLoadingTrace.value = true;

  try {
    const response = await fetchTrace(traceId);
    traceDetail.value = response.trace;
  } catch (error) {
    traceError.value =
      error instanceof Error ? error.message : "链路详情加载失败";
  } finally {
    isLoadingTrace.value = false;
  }
}

function closeTrace() {
  selectedTraceId.value = "";
  traceDetail.value = null;
  traceError.value = "";
}

onMounted(load);
</script>

<template>
  <section class="panel">
    <div class="panel-heading">
      <div>
        <span class="panel-label">Audit Trail</span>
        <h2>跨用户事件日志</h2>
        <p class="panel-hint">
          事件输入摘要由服务端脱敏后保存，管理端只读取摘要字段，不还原原始 payload。
        </p>
      </div>
      <button type="button" class="btn" :disabled="isLoading" @click="load">
        刷新
      </button>
    </div>

    <div class="filter-bar">
      <label class="field">
        <span>实验 labKey</span>
        <input v-model="filters.labKey" placeholder="例如 web.xss" />
      </label>
      <label class="field">
        <span>变体</span>
        <select v-model="filters.variantKey">
          <option value="">全部</option>
          <option value="vuln">漏洞版</option>
          <option value="fixed">修复版</option>
        </select>
      </label>
      <label class="field">
        <span>阶段</span>
        <select v-model="filters.phase">
          <option value="">全部</option>
          <option value="attack">攻击</option>
          <option value="defense">防御</option>
          <option value="normal">正常流程</option>
        </select>
      </label>
      <label class="field">
        <span>风险</span>
        <select v-model="filters.riskLevel">
          <option value="">全部</option>
          <option value="critical">严重</option>
          <option value="high">高</option>
          <option value="medium">中</option>
          <option value="low">低</option>
        </select>
      </label>
      <label class="field">
        <span>结果</span>
        <select v-model="filters.decision">
          <option value="">全部</option>
          <option value="accepted">已接受</option>
          <option value="blocked">已阻断</option>
          <option value="failed">失败</option>
        </select>
      </label>
      <label class="field">
        <span>用户 ID</span>
        <input v-model="filters.userId" inputmode="numeric" placeholder="例如 2" />
      </label>
      <label class="field">
        <span>起始日期</span>
        <input v-model="filters.from" type="date" />
      </label>
      <label class="field">
        <span>结束日期</span>
        <input v-model="filters.to" type="date" />
      </label>
      <button type="button" class="btn btn-primary" @click="applyFilters">
        查询
      </button>
      <button
        type="button"
        class="btn"
        :disabled="!hasActiveFilters(filters)"
        @click="resetFilters"
      >
        重置
      </button>
    </div>
  </section>

  <p v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</p>

  <section class="panel">
    <div class="panel-heading">
      <div>
        <span class="panel-label">Observed</span>
        <h2>事件列表</h2>
      </div>
      <span v-if="!isLoading" class="panel-hint">
        本页 {{ summary.total }} 条 · {{ summary.traces }} 条链路 · 阻断
        {{ summary.byDecision.blocked }} 条
      </span>
    </div>

    <p v-if="isLoading" class="skeleton" aria-label="加载中"></p>

    <EmptyState
      v-else-if="events.length === 0"
      title="没有匹配的事件"
      description="换个筛选条件，或先在学习平台完成一次实验。"
    />

    <template v-else>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>实验</th>
              <th>变体</th>
              <th>阶段</th>
              <th>结果</th>
              <th>风险</th>
              <th>用户</th>
              <th>信号</th>
              <th>链路</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="event in events" :key="event.id">
              <td>{{ formatDateTime(event.createdAt) }}</td>
              <td>{{ event.title }}</td>
              <td>{{ event.variantKey }}</td>
              <td>{{ phaseLabel(event.phase) }}</td>
              <td>
                <span :class="decisionBadgeClass(event.decision)">
                  {{ decisionLabel(event.decision) }}
                </span>
              </td>
              <td>
                <span :class="riskBadgeClass(event.riskLevel)">
                  {{ riskLabel(event.riskLevel) }}
                </span>
              </td>
              <td>{{ event.username ?? "—" }}</td>
              <td><code>{{ event.signal }}</code></td>
              <td class="cell-actions">
                <button type="button" class="btn" @click="openTrace(event.traceId)">
                  查看
                </button>
                <RouterLink class="btn" :to="`/events/${event.traceId}`">
                  打开
                </RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <PaginationBar
        :page="page"
        :page-size="pageSize"
        :total="total"
        :disabled="isLoading"
        @change="changePage"
      />
      <p v-if="lastPage > 1" class="panel-hint">当前第 {{ page }} 页。</p>
    </template>
  </section>

  <div
    v-if="selectedTraceId"
    class="drawer-backdrop"
    role="dialog"
    aria-modal="true"
    aria-label="链路详情"
    @click.self="closeTrace"
  >
    <div class="drawer">
      <div class="drawer-heading">
        <div>
          <span class="panel-label">Trace</span>
          <h2>{{ selectedTraceId }}</h2>
        </div>
        <button type="button" class="btn" @click="closeTrace">关闭</button>
      </div>

      <p v-if="isLoadingTrace" class="skeleton" aria-label="加载中"></p>
      <p v-else-if="traceError" class="alert alert-danger">{{ traceError }}</p>
      <TraceTimeline v-else-if="traceDetail" :trace="traceDetail" />
      <EmptyState v-else title="没有链路数据" />
    </div>
  </div>
</template>
