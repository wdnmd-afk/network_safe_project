<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import {
  submitSqlInjectionSearch,
  type SqlInjectionSearchResult,
} from "../api/sql-injection-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  createSqlInjectionLearningProgress,
  createSqlInjectionVerificationRecord,
  formatSqlInjectionSignal,
  getSqlInjectionVariantConfig,
  sqlInjectionAttackPayload,
  sqlInjectionNormalKeyword,
  type SqlInjectionVariantKey,
} from "../labs/sql-injection";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: SqlInjectionVariantKey;
}>();

const session = useSessionStore();
const config = computed(() => getSqlInjectionVariantConfig(props.variant));
const keyword = ref(sqlInjectionNormalKeyword);
const result = ref<SqlInjectionSearchResult | null>(null);
const isLoading = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const signalText = computed(() =>
  result.value ? formatSqlInjectionSignal(result.value.signal) : "尚未提交查询",
);

const formattedPrice = computed(() => (priceCents: number) => {
  return `¥${(priceCents / 100).toFixed(2)}`;
});

async function recordProgress() {
  if (!session.token) {
    return;
  }

  try {
    await recordLearningProgress(
      "web",
      "sql-injection",
      session.token,
      createSqlInjectionLearningProgress(config.value),
    );
  } catch {
    // 学习进度失败不阻断实验，方便在数据库状态异常时继续观察攻防差异。
  }
}

async function recordVerification(searchResult: SqlInjectionSearchResult) {
  if (!session.token) {
    return;
  }

  const isExpectedVulnSignal =
    config.value.key === "vuln" &&
    searchResult.signal === "sql-injection-data-exposed";
  const isExpectedFixedSignal =
    config.value.key === "fixed" &&
    searchResult.signal === "sql-injection-parameterized-blocked";

  if (!isExpectedVulnSignal && !isExpectedFixedSignal) {
    return;
  }

  try {
    await recordVerificationRecord(
      "web",
      "sql-injection",
      session.token,
      createSqlInjectionVerificationRecord(config.value, searchResult),
    );
  } catch {
    // 验证记录只服务学习闭环，失败后仍保留页面观察结果。
  }
}

function useNormalKeyword() {
  keyword.value = sqlInjectionNormalKeyword;
  actionMessage.value = "已填入正常业务关键词";
  errorMessage.value = "";
}

function useAttackPayload() {
  keyword.value = sqlInjectionAttackPayload;
  actionMessage.value = "已填入受控 SQL 注入样例";
  errorMessage.value = "";
}

async function submitSearch() {
  if (!session.token) {
    errorMessage.value = "请先登录后再进行 SQL 注入实验";
    return;
  }

  const normalizedKeyword = keyword.value.trim();

  if (!normalizedKeyword) {
    errorMessage.value = "请输入搜索关键词";
    return;
  }

  isLoading.value = true;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const response = await submitSqlInjectionSearch(config.value.key, session.token, {
      keyword: normalizedKeyword,
    });
    result.value = response.result;
    actionMessage.value = response.result.message;
    await recordVerification(response.result);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "SQL 注入实验请求失败";
  } finally {
    isLoading.value = false;
  }
}

watch(
  config,
  () => {
    keyword.value = sqlInjectionNormalKeyword;
    result.value = null;
    actionMessage.value = "";
    errorMessage.value = "";
    void recordProgress();
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <section class="page-section two-column">
    <div class="section-heading">
      <p class="eyebrow">web / sql injection</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <div class="variant-switch">
        <RouterLink to="/labs/web/sql-injection/vuln">漏洞版</RouterLink>
        <RouterLink to="/labs/web/sql-injection/fixed">修复版</RouterLink>
      </div>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>
    </div>

    <div class="sql-workbench">
      <form class="form-panel" @submit.prevent="submitSearch">
        <label>
          <span>商品搜索关键词</span>
          <input v-model="keyword" type="text" aria-label="商品搜索关键词" />
        </label>
        <div class="form-actions">
          <button type="button" class="secondary-button" @click="useNormalKeyword">
            填入正常关键词
          </button>
          <button type="button" class="secondary-button" @click="useAttackPayload">
            填入攻击样例
          </button>
          <button type="submit" :disabled="isLoading">提交查询</button>
        </div>
      </form>

      <section class="sql-status-panel" aria-label="SQL 注入实验状态">
        <div class="status-metric">
          <span>后端决策</span>
          <strong>{{ result ? result.decision : "pending" }}</strong>
        </div>
        <div class="status-metric">
          <span>学习信号</span>
          <strong>{{ signalText }}</strong>
        </div>
        <div class="status-metric">
          <span>查询模式</span>
          <strong>{{ result ? result.queryMode : "not-run" }}</strong>
        </div>

        <pre v-if="result?.queryPreview" class="query-preview">{{ result.queryPreview }}</pre>

        <p v-if="actionMessage" class="state-text">{{ actionMessage }}</p>
        <p v-if="result?.nextStep" class="state-text">{{ result.nextStep }}</p>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <p v-if="!session.token" class="state-text">
          登录后可提交受控 SQL 注入实验请求，并把关键判断写入统一事件日志。
        </p>
      </section>

      <section v-if="result" class="table-surface" aria-label="商品搜索结果">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>商品</th>
              <th>分类</th>
              <th>价格</th>
              <th>可见性</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="result.rows.length === 0">
              <td colspan="5">没有返回商品记录</td>
            </tr>
            <tr v-for="row in result.rows" :key="row.id">
              <td>{{ row.sku }}</td>
              <td>
                {{ row.name }}
                <small v-if="row.internalNote">{{ row.internalNote }}</small>
              </td>
              <td>{{ row.category }}</td>
              <td>{{ formattedPrice(row.priceCents) }}</td>
              <td>
                <span :class="row.isHidden ? 'danger-pill' : 'status-pill'">
                  {{ row.isHidden ? "隐藏数据" : "公开数据" }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </section>
</template>
