<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import {
  createXssSubmission,
  getXssVariantConfig,
  type XssSubmission,
  type XssVariantKey,
  xssSamplePayload,
} from "../labs/xss";

const props = defineProps<{
  variant: XssVariantKey;
}>();

const config = computed(() => getXssVariantConfig(props.variant));
const message = ref("订单 #SM-2048 的状态说明没有及时更新。");
const submissions = ref<XssSubmission[]>([]);

function resetSubmissions() {
  submissions.value = [
    createXssSubmission("客服会在 24 小时内回复你的留言。", config.value),
  ];
}

watch(config, resetSubmissions, {
  immediate: true,
});

function useSamplePayload() {
  message.value = xssSamplePayload;
}

function submitMessage() {
  const normalizedMessage = message.value.trim();

  if (!normalizedMessage) {
    return;
  }

  submissions.value.unshift(createXssSubmission(normalizedMessage, config.value));
}
</script>

<template>
  <section class="page-section two-column">
    <div class="section-heading">
      <p class="eyebrow">web / xss</p>
      <h1>{{ config.title }}</h1>
      <p>{{ config.explanation }}</p>

      <div class="variant-switch">
        <RouterLink to="/labs/web/xss/vuln">漏洞版</RouterLink>
        <RouterLink to="/labs/web/xss/fixed">修复版</RouterLink>
      </div>

      <div class="lab-note">
        <strong>{{ config.badge }}</strong>
        <span>{{ config.expectedSignal }}</span>
      </div>
    </div>

    <div class="xss-workbench">
      <form class="form-panel" @submit.prevent="submitMessage">
        <label>
          <span>客服留言内容</span>
          <textarea v-model="message" rows="6" aria-label="客服留言内容" />
        </label>
        <div class="form-actions">
          <button type="button" class="secondary-button" @click="useSamplePayload">
            填入样例
          </button>
          <button type="submit">提交留言</button>
        </div>
      </form>

      <section class="xss-preview" aria-label="留言预览">
        <article
          v-for="submission in submissions"
          :key="`${submission.title}-${submission.renderedContent}`"
          class="message-card"
        >
          <div class="message-meta">
            <strong>{{ submission.title }}</strong>
            <span>{{ submission.author }}</span>
          </div>
          <div
            v-if="submission.renderMode === 'html'"
            class="message-body"
            v-html="submission.renderedContent"
          />
          <p v-else class="message-body">{{ submission.renderedContent }}</p>
        </article>
      </section>
    </div>
  </section>
</template>
