<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import {
  submitPortScanObservation,
  type PortScanResult,
  type PortScanProfile,
  type PortScanTargetKey,
} from "../api/port-scan-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  createPortScanLearningProgress,
  createPortScanVerificationRecord,
  defaultPortScanProfile,
  defaultPortScanTargetKey,
  formatPortScanSignal,
  getPortScanTargetObservationRows,
  getPortScanVariantConfig,
  portScanProfileOptions,
  portScanReviewChecklist,
  portScanTargetOptions,
  type PortScanVariantKey,
} from "../labs/port-scan";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: PortScanVariantKey;
}>();

const session = useSessionStore();
const config = computed(() => getPortScanVariantConfig(props.variant));
const targetRows = computed(() =>
  getPortScanTargetObservationRows(config.value.key),
);
const targetKey = ref<PortScanTargetKey>(defaultPortScanTargetKey);
const scanProfile = ref<PortScanProfile>(defaultPortScanProfile);
const result = ref<PortScanResult | null>(null);
const isLoading = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const signalText = computed(() =>
  result.value
    ? formatPortScanSignal(result.value.signal)
    : "尚未观察虚拟资产",
);

const selectedTarget = computed(() =>
  portScanTargetOptions.find((target) => target.key === targetKey.value),
);

const selectedProfile = computed(() =>
  portScanProfileOptions.find((profile) => profile.key === scanProfile.value),
);

const summaryRows = computed(() => {
  if (!result.value) {
    return [];
  }

  return [
    {
      label: "虚拟端口数量",
      value: String(result.value.summary.virtualPortCount),
    },
    {
      label: "公开端口数量",
      value: String(result.value.summary.openPortCount),
    },
    {
      label: "受限或内部端口",
      value: String(result.value.summary.restrictedPortCount),
    },
    {
      label: "高风险端口",
      value: String(result.value.summary.highRiskPortCount),
    },
    {
      label: "暴露面评分",
      value: String(result.value.summary.exposureScore),
    },
    {
      label: "命中受控样例",
      value: result.value.summary.matchedControlledSample ? "是" : "否",
    },
  ];
});

const statusRows = computed(() => [
  {
    label: "目标来源",
    value: "固定虚拟资产表",
  },
  {
    label: "观察模式",
    value: "固定选择器",
  },
  {
    label: "后端接口",
    value: "已接入受控 API",
  },
  {
    label: "脚本入口",
    value: "本轮不提供",
  },
]);

async function recordProgress() {
  if (!session.token) {
    return;
  }

  try {
    await recordLearningProgress(
      "network",
      "port-scan",
      session.token,
      createPortScanLearningProgress(config.value),
    );
  } catch {
    // 学习进度失败不阻断实验，避免数据库异常影响本机观察。
  }
}

async function recordVerification(scanResult: PortScanResult) {
  if (!session.token) {
    return;
  }

  const isExpectedVulnSignal =
    config.value.key === "vuln" &&
    (scanResult.signal === "port-scan-management-surface-visible" ||
      scanResult.signal === "port-scan-exposure-expanded");
  const isExpectedFixedSignal =
    config.value.key === "fixed" &&
    (scanResult.signal === "port-scan-surface-reduced" ||
      scanResult.signal === "port-scan-normal-inventory-returned");

  if (!isExpectedVulnSignal && !isExpectedFixedSignal) {
    return;
  }

  try {
    await recordVerificationRecord(
      "network",
      "port-scan",
      session.token,
      createPortScanVerificationRecord(config.value, scanResult),
    );
  } catch {
    // 验证记录只服务学习闭环，失败后仍保留页面观察结果。
  }
}

function chooseTarget(nextTargetKey: PortScanTargetKey) {
  targetKey.value = nextTargetKey;
  scanProfile.value = "surface-review";
  result.value = null;
  actionMessage.value = `已选择 ${selectedTarget.value?.title ?? nextTargetKey}`;
  errorMessage.value = "";
}

function chooseBaselineTarget() {
  targetKey.value = "hardened-service";
  scanProfile.value = "quick-observe";
  result.value = null;
  actionMessage.value = "已选择最小化服务和快速公开面观察";
  errorMessage.value = "";
}

async function submitObservation() {
  if (!session.token) {
    errorMessage.value = "请先登录后再进行端口扫描暴露面实验";
    return;
  }

  isLoading.value = true;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const response = await submitPortScanObservation(
      config.value.key,
      session.token,
      {
        targetKey: targetKey.value,
        scanProfile: scanProfile.value,
      },
    );

    result.value = response.result;
    actionMessage.value = response.result.message;
    await recordVerification(response.result);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "端口扫描实验请求失败";
  } finally {
    isLoading.value = false;
  }
}

watch(
  config,
  () => {
    targetKey.value = defaultPortScanTargetKey;
    scanProfile.value = defaultPortScanProfile;
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
      <p class="eyebrow">network / port scan</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <div class="variant-switch">
        <RouterLink to="/labs/network/port-scan/vuln">漏洞版</RouterLink>
        <RouterLink to="/labs/network/port-scan/fixed">修复版</RouterLink>
      </div>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>
    </div>

    <div class="port-scan-workbench">
      <form class="form-panel" @submit.prevent="submitObservation">
        <label>
          <span>虚拟目标</span>
          <select v-model="targetKey" aria-label="端口扫描虚拟目标">
            <option
              v-for="target in portScanTargetOptions"
              :key="target.key"
              :value="target.key"
            >
              {{ target.title }}
            </option>
          </select>
        </label>
        <label>
          <span>观察模式</span>
          <select v-model="scanProfile" aria-label="端口扫描观察模式">
            <option
              v-for="profile in portScanProfileOptions"
              :key="profile.key"
              :value="profile.key"
            >
              {{ profile.title }}
            </option>
          </select>
        </label>
        <div class="form-actions">
          <button
            type="button"
            class="secondary-button"
            @click="chooseTarget('admin-node')"
          >
            后台管理节点
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="chooseTarget('office-gateway')"
          >
            办公网关
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="chooseBaselineTarget"
          >
            最小化服务
          </button>
          <button type="submit" :disabled="isLoading">观察暴露面</button>
        </div>
      </form>

      <section class="port-scan-status-panel" aria-label="端口扫描实验状态">
        <div class="status-metric">
          <span>后端决策</span>
          <strong>{{ result ? result.decision : "pending" }}</strong>
        </div>
        <div class="status-metric">
          <span>学习信号</span>
          <strong>{{ signalText }}</strong>
        </div>
        <div class="status-metric">
          <span>当前目标</span>
          <strong>{{ result?.target?.title ?? selectedTarget?.title }}</strong>
        </div>

        <dl v-if="result" class="inspection-grid">
          <div v-for="row in summaryRows" :key="row.label">
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

        <article v-if="result?.target" class="document-preview">
          <span
            :class="
              result.target.profile === 'exposed' ? 'danger-pill' : 'status-pill'
            "
          >
            {{ result.target.profile }}
          </span>
          <h2>{{ result.target.title }}</h2>
          <p>{{ result.target.description }}</p>
        </article>

        <ul v-if="result" class="record-list">
          <li v-for="port in result.ports" :key="`${port.port}-${port.exposure}`">
            <strong>{{ port.port }}/{{ port.protocol }} · {{ port.serviceLabel }}</strong>
            <span>{{ port.exposure }} / {{ port.riskLevel }}</span>
            <small>{{ port.learningHint }}</small>
          </li>
        </ul>

        <p v-if="!result && selectedTarget" class="state-text">
          {{ selectedTarget.description }}
        </p>
        <p v-if="!result && selectedProfile" class="state-text">
          {{ selectedProfile.description }}
        </p>
        <p v-if="actionMessage" class="state-text">{{ actionMessage }}</p>
        <p v-if="result?.nextStep" class="state-text">{{ result.nextStep }}</p>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <p v-if="!session.token" class="state-text">
          登录后可提交端口扫描暴露面观察请求，并把关键判定写入统一事件日志。
        </p>
      </section>

      <section class="form-panel" aria-label="端口扫描目标观察">
        <h2>固定目标观察</h2>
        <p class="form-hint">{{ config.panelIntro }}</p>
        <ul class="record-list">
          <li v-for="target in targetRows" :key="target.key">
            <strong>{{ target.title }}</strong>
            <span>{{ target.description }}</span>
            <small>{{ target.focus }}</small>
          </li>
        </ul>
      </section>

      <section class="form-panel" aria-label="端口扫描复盘清单">
        <h2>复盘清单</h2>
        <ul class="record-list">
          <li v-for="item in portScanReviewChecklist" :key="item.key">
            <strong>{{ item.title }}</strong>
            <span>{{ item.description }}</span>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>
