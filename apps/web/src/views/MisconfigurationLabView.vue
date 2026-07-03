<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import {
  submitMisconfigurationAudit,
  type MisconfigurationConfigCaseKey,
  type MisconfigurationResult,
} from "../api/misconfiguration-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  createMisconfigurationLearningProgress,
  createMisconfigurationVerificationRecord,
  formatMisconfigurationSignal,
  getDefaultMisconfigurationAuditPolicyKey,
  getDefaultMisconfigurationConfigCaseKey,
  getMisconfigurationObservationRows,
  getMisconfigurationVariantConfig,
  getRecommendedMisconfigurationAuditPolicyKey,
  misconfigurationAuditPolicyOptions,
  misconfigurationConfigCaseOptions,
  misconfigurationReviewChecklist,
  type MisconfigurationAuditPolicyKey,
  type MisconfigurationVariantKey,
} from "../labs/misconfiguration";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: MisconfigurationVariantKey;
}>();

const session = useSessionStore();
const config = computed(() => getMisconfigurationVariantConfig(props.variant));
const configRows = computed(() =>
  getMisconfigurationObservationRows(config.value.key),
);
const configCaseKey = ref<MisconfigurationConfigCaseKey>(
  getDefaultMisconfigurationConfigCaseKey(props.variant),
);
const auditPolicyKey = ref<MisconfigurationAuditPolicyKey>(
  getDefaultMisconfigurationAuditPolicyKey(props.variant),
);
const result = ref<MisconfigurationResult | null>(null);
const isLoading = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const signalText = computed(() =>
  result.value
    ? formatMisconfigurationSignal(result.value.signal)
    : "尚未观察固定配置样例",
);

const selectedConfigCase = computed(() =>
  misconfigurationConfigCaseOptions.find(
    (configCase) => configCase.key === configCaseKey.value,
  ),
);

const selectedAuditPolicy = computed(() =>
  misconfigurationAuditPolicyOptions.find(
    (policy) => policy.key === auditPolicyKey.value,
  ),
);

const auditRows = computed(() => {
  if (!result.value) {
    return [];
  }

  return [
    {
      label: "暴露面类别",
      value: result.value.audit.exposureCategory,
    },
    {
      label: "暴露状态",
      value: result.value.audit.exposureState,
    },
    {
      label: "认证要求",
      value: result.value.audit.authRequired ? "required" : "not-required",
    },
    {
      label: "CORS 状态",
      value: result.value.audit.corsPolicyStatus,
    },
    {
      label: "错误信息状态",
      value: result.value.audit.errorReportingStatus,
    },
    {
      label: "固定样例命中",
      value: result.value.audit.matchedControlledSample ? "matched" : "blocked",
    },
    {
      label: "风险标签数",
      value: String(result.value.audit.riskIndicatorCount),
    },
    {
      label: "风险标签",
      value:
        result.value.audit.riskIndicators.length > 0
          ? result.value.audit.riskIndicators.join(", ")
          : "none",
    },
    {
      label: "审计动作",
      value:
        result.value.audit.auditActions.length > 0
          ? result.value.audit.auditActions.join(", ")
          : "none",
    },
    {
      label: "建议动作",
      value: result.value.audit.recommendedAction,
    },
  ];
});

const statusRows = computed(() => [
  {
    label: "样例来源",
    value: "固定配置摘要",
  },
  {
    label: "审计策略",
    value: "固定审计策略",
  },
  {
    label: "后端接口",
    value: "已接入受控 audit API",
  },
  {
    label: "脚本入口",
    value: "本轮仍不登记",
  },
]);

async function recordProgress() {
  if (!session.token) {
    return;
  }

  try {
    await recordLearningProgress(
      "infrastructure",
      "misconfiguration",
      session.token,
      createMisconfigurationLearningProgress(config.value),
    );
  } catch {
    // 学习进度失败不阻断实验，避免数据库异常影响本机观察。
  }
}

async function recordVerification(auditResult: MisconfigurationResult) {
  if (!session.token) {
    return;
  }

  const isExpectedVulnSignal =
    config.value.key === "vuln" &&
    (auditResult.signal === "misconfiguration-debug-surface-visible" ||
      auditResult.signal === "misconfiguration-directory-index-visible" ||
      auditResult.signal === "misconfiguration-cors-too-broad" ||
      auditResult.signal === "misconfiguration-admin-status-public" ||
      auditResult.signal === "misconfiguration-error-detail-exposed" ||
      auditResult.signal ===
        "misconfiguration-default-credential-hint-visible" ||
      auditResult.signal === "misconfiguration-boundary-verified");
  const isExpectedFixedSignal =
    config.value.key === "fixed" &&
    (auditResult.signal === "misconfiguration-exposure-reduced" ||
      auditResult.signal === "misconfiguration-auth-required" ||
      auditResult.signal === "misconfiguration-cors-policy-restricted" ||
      auditResult.signal === "misconfiguration-safe-error-reporting" ||
      auditResult.signal === "misconfiguration-boundary-verified");

  if (!isExpectedVulnSignal && !isExpectedFixedSignal) {
    return;
  }

  try {
    await recordVerificationRecord(
      "infrastructure",
      "misconfiguration",
      session.token,
      createMisconfigurationVerificationRecord(config.value, auditResult),
    );
  } catch {
    // 验证记录只服务学习闭环，失败后仍保留页面观察结果。
  }
}

function resetResult(message: string) {
  result.value = null;
  actionMessage.value = message;
  errorMessage.value = "";
}

function chooseConfigCase(
  key: MisconfigurationConfigCaseKey,
  message: string,
) {
  configCaseKey.value = key;
  auditPolicyKey.value = getRecommendedMisconfigurationAuditPolicyKey(
    key,
    config.value.key,
  );
  resetResult(message);
}

function chooseDebugConsole() {
  chooseConfigCase("debug-console-exposed", "已选择调试入口开启固定样例");
}

function chooseDirectoryIndex() {
  chooseConfigCase("directory-index-enabled", "已选择目录索引开启固定样例");
}

function chooseCorsPolicy() {
  chooseConfigCase(
    "wildcard-cors-with-credentials",
    "已选择过宽 CORS 策略固定样例",
  );
}

function chooseAdminStatus() {
  chooseConfigCase("public-admin-status", "已选择公开管理状态页固定样例");
}

function chooseVerboseError() {
  chooseConfigCase("verbose-error-detail", "已选择详细错误信息外显固定样例");
}

function chooseCredentialHint() {
  chooseConfigCase(
    "default-credential-hint-visible",
    "已选择默认凭据提示可见固定样例",
  );
}

async function submitObservation() {
  if (!session.token) {
    errorMessage.value = "请先登录后再进行配置错误固定审计观察";
    return;
  }

  isLoading.value = true;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const response = await submitMisconfigurationAudit(
      config.value.key,
      session.token,
      {
        configCaseKey: configCaseKey.value,
        auditPolicyKey: auditPolicyKey.value,
      },
    );

    result.value = response.result;
    actionMessage.value = response.result.message;
    await recordVerification(response.result);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "配置错误实验请求失败";
  } finally {
    isLoading.value = false;
  }
}

watch(
  config,
  () => {
    configCaseKey.value = getDefaultMisconfigurationConfigCaseKey(
      config.value.key,
    );
    auditPolicyKey.value = getDefaultMisconfigurationAuditPolicyKey(
      config.value.key,
    );
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
      <p class="eyebrow">infrastructure / misconfiguration</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <div class="variant-switch">
        <RouterLink to="/labs/infrastructure/misconfiguration/vuln">
          配置风险观察版
        </RouterLink>
        <RouterLink to="/labs/infrastructure/misconfiguration/fixed">
          配置审计复盘版
        </RouterLink>
      </div>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>
    </div>

    <div class="misconfiguration-workbench">
      <form class="form-panel" @submit.prevent="submitObservation">
        <label>
          <span>固定配置样例</span>
          <select v-model="configCaseKey" aria-label="配置错误固定配置样例">
            <option
              v-for="configCase in misconfigurationConfigCaseOptions"
              :key="configCase.key"
              :value="configCase.key"
            >
              {{ configCase.title }}
            </option>
          </select>
        </label>
        <label>
          <span>固定审计策略</span>
          <select v-model="auditPolicyKey" aria-label="配置错误固定审计策略">
            <option
              v-for="policy in misconfigurationAuditPolicyOptions"
              :key="policy.key"
              :value="policy.key"
            >
              {{ policy.title }}
            </option>
          </select>
        </label>
        <div class="form-actions">
          <button
            type="button"
            class="secondary-button"
            @click="chooseDebugConsole"
          >
            调试入口
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="chooseDirectoryIndex"
          >
            目录索引
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="chooseCorsPolicy"
          >
            CORS 策略
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="chooseAdminStatus"
          >
            管理状态
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="chooseVerboseError"
          >
            错误信息
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="chooseCredentialHint"
          >
            凭据提示
          </button>
          <button type="submit" :disabled="isLoading">观察审计结果</button>
        </div>
      </form>

      <section
        class="misconfiguration-status-panel"
        aria-label="配置错误实验状态"
      >
        <div class="status-metric">
          <span>后端决策</span>
          <strong>{{ result ? result.decision : "pending" }}</strong>
        </div>
        <div class="status-metric">
          <span>学习信号</span>
          <strong>{{ signalText }}</strong>
        </div>
        <div class="status-metric">
          <span>当前样例</span>
          <strong>
            {{ result?.configSummary?.title ?? selectedConfigCase?.title }}
          </strong>
        </div>

        <dl v-if="result" class="inspection-grid">
          <div v-for="row in auditRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>

        <dl v-else class="inspection-grid">
          <div v-for="row in statusRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>

        <article v-if="result?.configSummary" class="document-preview">
          <span
            :class="
              result.decision === 'blocked' ||
              result.audit.exposureState === 'visible'
                ? 'danger-pill'
                : 'status-pill'
            "
          >
            {{ result.audit.exposureState }}
          </span>
          <h2>{{ result.configSummary.title }}</h2>
          <p>
            {{ result.configSummary.exposureCategory }} ·
            {{
              result.configSummary.visibleInVulnerableVariant
                ? "漏洞版可见"
                : "漏洞版不可见"
            }}
          </p>
          <p>{{ result.configSummary.learningNotes }}</p>
        </article>

        <p v-if="!result && selectedConfigCase" class="state-text">
          {{ selectedConfigCase.exposureCategory }} ·
          {{ selectedConfigCase.description }}
        </p>
        <p v-if="!result && selectedAuditPolicy" class="state-text">
          {{ selectedAuditPolicy.description }}
        </p>
        <p v-if="actionMessage" class="state-text">{{ actionMessage }}</p>
        <p v-if="result?.nextStep" class="state-text">{{ result.nextStep }}</p>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <p v-if="!session.token" class="state-text">
          登录后可提交配置错误固定审计观察请求，并把关键判定写入统一事件日志。
        </p>
      </section>

      <section class="form-panel" aria-label="配置错误固定样例观察">
        <h2>固定样例观察</h2>
        <p class="form-hint">{{ config.panelIntro }}</p>
        <ul class="record-list">
          <li v-for="configCase in configRows" :key="configCase.key">
            <strong>{{ configCase.title }}</strong>
            <span>
              {{ configCase.exposureCategory }} · {{ configCase.description }}
            </span>
            <small>{{ configCase.focus }}</small>
          </li>
        </ul>
      </section>

      <section class="form-panel" aria-label="配置错误复盘清单">
        <h2>复盘清单</h2>
        <ul class="record-list">
          <li
            v-for="item in misconfigurationReviewChecklist"
            :key="item.key"
          >
            <strong>{{ item.title }}</strong>
            <span>{{ item.description }}</span>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>
