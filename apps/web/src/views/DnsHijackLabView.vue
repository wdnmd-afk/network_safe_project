<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import {
  submitDnsHijackObservation,
  type DnsHijackDomainKey,
  type DnsHijackResolverProfile,
  type DnsHijackResult,
} from "../api/dns-hijack-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  createDnsHijackLearningProgress,
  createDnsHijackVerificationRecord,
  defaultDnsHijackDomainKey,
  defaultDnsHijackResolverProfile,
  dnsHijackDomainOptions,
  dnsHijackResolverProfileOptions,
  dnsHijackReviewChecklist,
  formatDnsHijackSignal,
  getDnsHijackDomainObservationRows,
  getDnsHijackVariantConfig,
  type DnsHijackVariantKey,
} from "../labs/dns-hijack";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: DnsHijackVariantKey;
}>();

const session = useSessionStore();
const config = computed(() => getDnsHijackVariantConfig(props.variant));
const domainRows = computed(() =>
  getDnsHijackDomainObservationRows(config.value.key),
);
const domainKey = ref<DnsHijackDomainKey>(defaultDnsHijackDomainKey);
const resolverProfile = ref<DnsHijackResolverProfile>(
  defaultDnsHijackResolverProfile,
);
const result = ref<DnsHijackResult | null>(null);
const isLoading = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const signalText = computed(() =>
  result.value
    ? formatDnsHijackSignal(result.value.signal)
    : "尚未观察虚拟解析",
);

const selectedDomain = computed(() =>
  dnsHijackDomainOptions.find((domain) => domain.key === domainKey.value),
);

const selectedResolver = computed(() =>
  dnsHijackResolverProfileOptions.find(
    (resolver) => resolver.key === resolverProfile.value,
  ),
);

const resolutionRows = computed(() => {
  if (!result.value) {
    return [];
  }

  return [
    {
      label: "期望虚拟地址",
      value: result.value.resolution.expectedAddressCategory,
    },
    {
      label: "当前虚拟地址",
      value: result.value.resolution.resolvedAddressCategory,
    },
    {
      label: "证书状态",
      value: result.value.resolution.certificateStatus,
    },
    {
      label: "异常解析",
      value: result.value.resolution.anomalyDetected ? "是" : "否",
    },
    {
      label: "可信来源",
      value: result.value.audit.trustedSource ? "是" : "否",
    },
    {
      label: "策略阻断",
      value: result.value.audit.blockedByPolicy ? "是" : "否",
    },
  ];
});

const statusRows = computed(() => [
  {
    label: "样例来源",
    value: "固定内存解析表",
  },
  {
    label: "解析视角",
    value: "固定选择器",
  },
  {
    label: "后端接口",
    value: "已接入受控 API",
  },
  {
    label: "脚本入口",
    value: "尚未接入",
  },
]);

async function recordProgress() {
  if (!session.token) {
    return;
  }

  try {
    await recordLearningProgress(
      "network",
      "dns-hijack",
      session.token,
      createDnsHijackLearningProgress(config.value),
    );
  } catch {
    // 学习进度失败不阻断实验，避免数据库异常影响本机观察。
  }
}

async function recordVerification(resolveResult: DnsHijackResult) {
  if (!session.token) {
    return;
  }

  const isExpectedVulnSignal =
    config.value.key === "vuln" &&
    (resolveResult.signal === "dns-hijack-certificate-mismatch-visible" ||
      resolveResult.signal === "dns-hijack-resolution-misdirected");
  const isExpectedFixedSignal =
    config.value.key === "fixed" &&
    (resolveResult.signal === "dns-hijack-anomaly-blocked" ||
      resolveResult.signal === "dns-hijack-trusted-resolution-restored" ||
      resolveResult.signal === "dns-hijack-normal-resolution-returned");

  if (!isExpectedVulnSignal && !isExpectedFixedSignal) {
    return;
  }

  try {
    await recordVerificationRecord(
      "network",
      "dns-hijack",
      session.token,
      createDnsHijackVerificationRecord(config.value, resolveResult),
    );
  } catch {
    // 验证记录只服务学习闭环，失败后仍保留页面观察结果。
  }
}

function chooseDomain(nextDomainKey: DnsHijackDomainKey) {
  domainKey.value = nextDomainKey;
  resolverProfile.value = "public-cache";
  result.value = null;
  actionMessage.value = `已选择 ${selectedDomain.value?.title ?? nextDomainKey}`;
  errorMessage.value = "";
}

function chooseTrustedResolver() {
  resolverProfile.value = "trusted-resolver";
  result.value = null;
  actionMessage.value = "已切换到可信解析视角";
  errorMessage.value = "";
}

async function submitObservation() {
  if (!session.token) {
    errorMessage.value = "请先登录后再进行 DNS 劫持 / 污染实验";
    return;
  }

  isLoading.value = true;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const response = await submitDnsHijackObservation(
      config.value.key,
      session.token,
      {
        domainKey: domainKey.value,
        resolverProfile: resolverProfile.value,
      },
    );

    result.value = response.result;
    actionMessage.value = response.result.message;
    await recordVerification(response.result);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "DNS 劫持实验请求失败";
  } finally {
    isLoading.value = false;
  }
}

watch(
  config,
  () => {
    domainKey.value = defaultDnsHijackDomainKey;
    resolverProfile.value = defaultDnsHijackResolverProfile;
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
      <p class="eyebrow">network / dns hijack</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <div class="variant-switch">
        <RouterLink to="/labs/network/dns-hijack/vuln">漏洞版</RouterLink>
        <RouterLink to="/labs/network/dns-hijack/fixed">修复版</RouterLink>
      </div>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>
    </div>

    <div class="dns-hijack-workbench">
      <form class="form-panel" @submit.prevent="submitObservation">
        <label>
          <span>虚拟域名样例</span>
          <select v-model="domainKey" aria-label="DNS 劫持虚拟域名样例">
            <option
              v-for="domain in dnsHijackDomainOptions"
              :key="domain.key"
              :value="domain.key"
            >
              {{ domain.title }}
            </option>
          </select>
        </label>
        <label>
          <span>解析视角</span>
          <select v-model="resolverProfile" aria-label="DNS 劫持解析视角">
            <option
              v-for="resolver in dnsHijackResolverProfileOptions"
              :key="resolver.key"
              :value="resolver.key"
            >
              {{ resolver.title }}
            </option>
          </select>
        </label>
        <div class="form-actions">
          <button
            type="button"
            class="secondary-button"
            @click="chooseDomain('customer-portal')"
          >
            客户门户
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="chooseDomain('update-service')"
          >
            更新服务
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="chooseDomain('internal-dashboard')"
          >
            内部看板
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="chooseTrustedResolver"
          >
            可信解析
          </button>
          <button type="submit" :disabled="isLoading">观察解析结果</button>
        </div>
      </form>

      <section class="dns-hijack-status-panel" aria-label="DNS 劫持实验状态">
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
          <strong>{{ result?.domain?.title ?? selectedDomain?.title }}</strong>
        </div>

        <dl v-if="result" class="inspection-grid">
          <div v-for="row in resolutionRows" :key="row.label">
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

        <article v-if="result?.domain" class="document-preview">
          <span
            :class="
              result.resolution.anomalyDetected ? 'danger-pill' : 'status-pill'
            "
          >
            {{ result.resolution.sourceTrust }}
          </span>
          <h2>{{ result.domain.title }}</h2>
          <p>{{ result.domain.businessPurpose }}</p>
          <p>{{ result.domain.riskNotes }}</p>
        </article>

        <p v-if="result" class="state-text">
          {{ result.audit.learningHint }}
        </p>
        <p v-if="!result && selectedDomain" class="state-text">
          {{ selectedDomain.displayDomain }} · {{ selectedDomain.description }}
        </p>
        <p v-if="!result && selectedResolver" class="state-text">
          {{ selectedResolver.description }}
        </p>
        <p v-if="actionMessage" class="state-text">{{ actionMessage }}</p>
        <p v-if="result?.nextStep" class="state-text">{{ result.nextStep }}</p>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <p v-if="!session.token" class="state-text">
          登录后可提交 DNS 劫持 / 污染观察请求，并把关键判定写入统一事件日志。
        </p>
      </section>

      <section class="form-panel" aria-label="DNS 劫持域名样例观察">
        <h2>固定样例观察</h2>
        <p class="form-hint">{{ config.panelIntro }}</p>
        <ul class="record-list">
          <li v-for="domain in domainRows" :key="domain.key">
            <strong>{{ domain.title }}</strong>
            <span>{{ domain.displayDomain }} · {{ domain.description }}</span>
            <small>{{ domain.focus }}</small>
          </li>
        </ul>
      </section>

      <section class="form-panel" aria-label="DNS 劫持复盘清单">
        <h2>复盘清单</h2>
        <ul class="record-list">
          <li v-for="item in dnsHijackReviewChecklist" :key="item.key">
            <strong>{{ item.title }}</strong>
            <span>{{ item.description }}</span>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>
