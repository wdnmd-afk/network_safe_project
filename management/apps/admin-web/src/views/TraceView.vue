<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import type { TraceDetail } from "@nsm/shared";

import { fetchTrace } from "../api/admin";
import TraceTimeline from "../components/TraceTimeline.vue";

const props = defineProps<{ traceId: string }>();

const trace = ref<TraceDetail | null>(null);
const isLoading = ref(true);
const errorMessage = ref("");

async function load() {
  isLoading.value = true;
  errorMessage.value = "";
  trace.value = null;

  try {
    const response = await fetchTrace(props.traceId);
    trace.value = response.trace;
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "链路详情加载失败";
  } finally {
    isLoading.value = false;
  }
}

watch(() => props.traceId, load);
onMounted(load);
</script>

<template>
  <section class="panel">
    <div class="panel-heading">
      <div>
        <span class="panel-label">Trace</span>
        <h2>{{ props.traceId }}</h2>
        <p class="panel-hint">同一条 traceId 下的完整攻防链路，按时间升序。</p>
      </div>
      <div class="row">
        <button type="button" class="btn" :disabled="isLoading" @click="load">
          刷新
        </button>
        <RouterLink class="btn" to="/events">返回列表</RouterLink>
      </div>
    </div>

    <p v-if="isLoading" class="skeleton" aria-label="加载中"></p>
    <p v-else-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</p>
    <TraceTimeline v-else-if="trace" :trace="trace" />
  </section>
</template>
