<script setup lang="ts">
import { onMounted, ref } from "vue";

import { auditActions, type AuditAction, type AuditLogItem } from "@nsm/shared";

import { fetchAuditLogs } from "../api/admin";
import EmptyState from "../components/EmptyState.vue";
import PaginationBar from "../components/PaginationBar.vue";
import { auditActionLabel, formatDateTime } from "../modules/format";

const logs = ref<AuditLogItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const action = ref<"" | AuditAction>("");
const isLoading = ref(true);
const errorMessage = ref("");

async function load() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await fetchAuditLogs({
      page: page.value,
      pageSize: pageSize.value,
      action: action.value || undefined,
    });

    logs.value = response.items;
    total.value = response.total;
  } catch (error) {
    logs.value = [];
    total.value = 0;
    errorMessage.value =
      error instanceof Error ? error.message : "操作审计加载失败";
  } finally {
    isLoading.value = false;
  }
}

function applyFilter() {
  page.value = 1;
  void load();
}

function changePage(target: number) {
  page.value = target;
  void load();
}

function describeSnapshot(value: { isEnabled: boolean } | null) {
  if (!value) {
    return "—";
  }

  return value.isEnabled ? "启用" : "停用";
}

onMounted(load);
</script>

<template>
  <section class="panel">
    <div class="panel-heading">
      <div>
        <span class="panel-label">Admin Audit</span>
        <h2>管理操作审计</h2>
        <p class="panel-hint">
          记录谁在何时对哪个对象做了什么，只保存启停前后值，不保存请求体。
        </p>
      </div>
      <button type="button" class="btn" :disabled="isLoading" @click="load">
        刷新
      </button>
    </div>

    <div class="filter-bar">
      <label class="field">
        <span>操作类型</span>
        <select v-model="action" @change="applyFilter">
          <option value="">全部</option>
          <option v-for="item in auditActions" :key="item" :value="item">
            {{ auditActionLabel(item) }}
          </option>
        </select>
      </label>
    </div>
  </section>

  <p v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</p>

  <section class="panel">
    <p v-if="isLoading" class="skeleton" aria-label="加载中"></p>
    <EmptyState v-else-if="logs.length === 0" title="暂无审计记录" />

    <template v-else>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>操作</th>
              <th>对象</th>
              <th>目标</th>
              <th>变更前</th>
              <th>变更后</th>
              <th>操作人</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td>{{ formatDateTime(log.createdAt) }}</td>
              <td>
                <span
                  class="badge"
                  :class="log.action.includes('disable') ? 'badge-warning' : log.action.includes('failure') ? 'badge-danger' : 'badge-success'"
                >
                  {{ auditActionLabel(log.action) }}
                </span>
              </td>
              <td>{{ log.targetType }}</td>
              <td class="mono">{{ log.targetKey }}</td>
              <td>{{ describeSnapshot(log.before) }}</td>
              <td>{{ describeSnapshot(log.after) }}</td>
              <td>{{ log.adminUserId ?? "—" }}</td>
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
    </template>
  </section>
</template>
