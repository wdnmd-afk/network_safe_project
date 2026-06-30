<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import { submitIdorRead, type IdorResult } from "../api/idor-lab";
import {
  recordLearningProgress,
  recordVerificationRecord,
} from "../api/lab-records";
import {
  createIdorLearningProgress,
  createIdorVerificationRecord,
  formatIdorSignal,
  getIdorVariantConfig,
  otherUserOrderIdSample,
  ownOrderIdSample,
  type IdorVariantKey,
} from "../labs/idor";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  variant: IdorVariantKey;
}>();

const session = useSessionStore();
const config = computed(() => getIdorVariantConfig(props.variant));
const orderIdText = ref(ownOrderIdSample);
const result = ref<IdorResult | null>(null);
const isLoading = ref(false);
const actionMessage = ref("");
const errorMessage = ref("");

const signalText = computed(() =>
  result.value ? formatIdorSignal(result.value.signal) : "尚未读取订单",
);

const inspectionRows = computed(() => {
  if (!result.value) {
    return [];
  }

  return [
    {
      label: "对象类型",
      value: result.value.inspection.objectType,
    },
    {
      label: "对象存在",
      value: result.value.inspection.objectFound ? "是" : "否",
    },
    {
      label: "当前用户",
      value: result.value.inspection.currentUserId,
    },
    {
      label: "对象归属",
      value: result.value.inspection.ownerUserId || "无",
    },
    {
      label: "归属匹配",
      value: result.value.inspection.ownerMatches ? "是" : "否",
    },
    {
      label: "跨用户请求",
      value: result.value.inspection.crossUserRequested ? "是" : "否",
    },
  ];
});

const orderRows = computed(() => {
  if (!result.value?.order) {
    return [];
  }

  return [
    {
      label: "订单号",
      value: result.value.order.id,
    },
    {
      label: "商品",
      value: result.value.order.productName,
    },
    {
      label: "归属",
      value: result.value.order.ownerLabel,
    },
    {
      label: "金额",
      value: `¥${result.value.order.amount}`,
    },
    {
      label: "状态",
      value: result.value.order.status,
    },
    {
      label: "联系方式",
      value: result.value.order.contactMasked,
    },
  ];
});

async function recordProgress() {
  if (!session.token) {
    return;
  }

  try {
    await recordLearningProgress(
      "auth",
      "idor",
      session.token,
      createIdorLearningProgress(config.value),
    );
  } catch {
    // 学习进度失败不阻断实验，避免数据库异常影响本地攻防观察。
  }
}

async function recordVerification(idorResult: IdorResult) {
  if (!session.token) {
    return;
  }

  const isExpectedVulnSignal =
    config.value.key === "vuln" &&
    idorResult.signal === "idor-cross-user-order-exposed";
  const isExpectedFixedSignal =
    config.value.key === "fixed" &&
    idorResult.signal === "idor-cross-user-order-blocked";

  if (!isExpectedVulnSignal && !isExpectedFixedSignal) {
    return;
  }

  try {
    await recordVerificationRecord(
      "auth",
      "idor",
      session.token,
      createIdorVerificationRecord(config.value, idorResult),
    );
  } catch {
    // 验证记录只服务学习闭环，失败后仍保留页面观察结果。
  }
}

function useOwnOrderSample() {
  orderIdText.value = ownOrderIdSample;
  result.value = null;
  actionMessage.value = "已填入当前用户自己的订单 ID";
  errorMessage.value = "";
}

function useOtherUserOrderSample() {
  orderIdText.value = otherUserOrderIdSample;
  result.value = null;
  actionMessage.value = "已替换为他人订单 ID 样例";
  errorMessage.value = "";
}

async function submitOrderId() {
  if (!session.token) {
    errorMessage.value = "请先登录后再进行 IDOR 实验";
    return;
  }

  const normalizedOrderId = orderIdText.value.trim();

  if (!normalizedOrderId) {
    errorMessage.value = "请填写要读取的订单 ID";
    return;
  }

  isLoading.value = true;
  actionMessage.value = "";
  errorMessage.value = "";

  try {
    const response = await submitIdorRead(config.value.key, session.token, {
      orderId: normalizedOrderId,
    });

    result.value = response.result;
    actionMessage.value = response.result.message;
    await recordVerification(response.result);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "IDOR 实验请求失败";
  } finally {
    isLoading.value = false;
  }
}

watch(
  config,
  () => {
    orderIdText.value = ownOrderIdSample;
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
      <p class="eyebrow">auth / idor</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <div class="variant-switch">
        <RouterLink to="/labs/auth/idor/vuln">漏洞版</RouterLink>
        <RouterLink to="/labs/auth/idor/fixed">修复版</RouterLink>
      </div>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>
    </div>

    <div class="idor-workbench">
      <form class="form-panel" @submit.prevent="submitOrderId">
        <label>
          <span>订单 ID</span>
          <input v-model="orderIdText" aria-label="订单 ID" />
        </label>
        <div class="form-actions">
          <button type="button" class="secondary-button" @click="useOwnOrderSample">
            读取自己订单
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="useOtherUserOrderSample"
          >
            替换为他人订单
          </button>
          <button type="submit" :disabled="isLoading">读取订单</button>
        </div>
      </form>

      <section class="idor-status-panel" aria-label="IDOR 实验状态">
        <div class="status-metric">
          <span>后端决策</span>
          <strong>{{ result ? result.decision : "pending" }}</strong>
        </div>
        <div class="status-metric">
          <span>学习信号</span>
          <strong>{{ signalText }}</strong>
        </div>
        <div class="status-metric">
          <span>读取对象</span>
          <strong>{{ result?.order?.id ?? "not-granted" }}</strong>
        </div>

        <dl v-if="result" class="inspection-grid">
          <div v-for="row in inspectionRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>

        <article v-if="result?.order" class="document-preview">
          <span
            :class="
              result.inspection.crossUserRequested ? 'danger-pill' : 'status-pill'
            "
          >
            {{ result.inspection.crossUserRequested ? "他人对象" : "本人对象" }}
          </span>
          <h2>订单详情摘要</h2>
          <dl class="inspection-grid">
            <div v-for="row in orderRows" :key="row.label">
              <dt>{{ row.label }}</dt>
              <dd>{{ row.value }}</dd>
            </div>
          </dl>
          <p>{{ result.order.internalNote }}</p>
        </article>

        <article
          v-else-if="result?.inspection.crossUserRequested"
          class="document-preview"
        >
          <span class="danger-pill">已阻断</span>
          <h2>对象级授权结果</h2>
          <p>
            当前用户 {{ result.inspection.currentUserId }} 请求读取归属用户
            {{ result.inspection.ownerUserId }} 的订单，后端没有返回订单详情。
          </p>
        </article>

        <p v-if="actionMessage" class="state-text">{{ actionMessage }}</p>
        <p v-if="result?.nextStep" class="state-text">{{ result.nextStep }}</p>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <p v-if="!session.token" class="state-text">
          登录后可提交受控 IDOR 实验请求，并把关键判断写入统一事件日志。
        </p>
      </section>
    </div>
  </section>
</template>
