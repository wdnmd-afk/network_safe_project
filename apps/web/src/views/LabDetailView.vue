<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import {
  fetchCurrentUserLabEventLogs,
  fetchCurrentUserRecapQuestionCompletions,
  setCurrentUserRecapQuestionCompletion,
  type CurrentUserLabEventLogSummary,
} from "../api/lab-records";
import { fetchLab, type LabMetadata } from "../api/labs";
import EventRecapCard from "../components/EventRecapCard.vue";
import {
  createCompletedEventRecapQuestionKeys,
  createLabEventRecapCardContent,
  useEventRecapExpansionState,
  useEventRecapQuestionCompletionState,
} from "../labs/event-recap";
import {
  createLabEventRecapQuestions,
  filterLabEventLogsForLab,
  filterLabRecordsForLab,
  findVariantWebEntrypoint,
} from "../labs/lab-detail";
import { useSessionStore } from "../stores/session";

const props = defineProps<{
  category: string;
  scene: string;
}>();

const session = useSessionStore();
const lab = ref<LabMetadata | null>(null);
const labEventLogs = ref<CurrentUserLabEventLogSummary[]>([]);
const isLoading = ref(true);
const isLoadingLabEventLogs = ref(false);
const errorMessage = ref("");
const labEventLogsErrorMessage = ref("");
const recapQuestionCompletionErrorMessage = ref("");
const eventRecapExpansion = useEventRecapExpansionState();
const eventRecapQuestionCompletion = useEventRecapQuestionCompletionState();

const variantEntries = computed(() => {
  if (!lab.value) {
    return [];
  }

  return lab.value.variants.map((variant) => ({
    variant,
    entrypoint: findVariantWebEntrypoint(lab.value as LabMetadata, variant),
  }));
});

const currentLabRecords = computed(() => {
  if (!lab.value) {
    return {
      progress: [],
      verifications: [],
    };
  }

  return filterLabRecordsForLab(session.labRecords, lab.value.id);
});

const hasCurrentLabRecords = computed(
  () =>
    currentLabRecords.value.progress.length > 0 ||
    currentLabRecords.value.verifications.length > 0,
);

const currentLabEventLogs = computed(() => {
  if (!lab.value) {
    return [];
  }

  return filterLabEventLogsForLab(labEventLogs.value, lab.value.id);
});

function createEventRecapQuestionViews(event: CurrentUserLabEventLogSummary) {
  return createLabEventRecapQuestions(event).map((question, questionIndex) => ({
    text: question,
    completed: eventRecapQuestionCompletion.isQuestionCompleted(
      event.traceId,
      questionIndex,
    ),
  }));
}

async function loadCurrentLabEventLogs(labKey: string) {
  if (!session.token) {
    labEventLogs.value = [];
    eventRecapExpansion.resetExpandedEvents();
    eventRecapQuestionCompletion.resetCompletedQuestions();
    recapQuestionCompletionErrorMessage.value = "";
    return;
  }

  isLoadingLabEventLogs.value = true;
  labEventLogsErrorMessage.value = "";
  recapQuestionCompletionErrorMessage.value = "";
  eventRecapExpansion.resetExpandedEvents();
  eventRecapQuestionCompletion.resetCompletedQuestions();

  try {
    const result = await fetchCurrentUserLabEventLogs(session.token, {
      labKey,
    });
    labEventLogs.value = result.events;

    const traceIds = [...new Set(result.events.map((event) => event.traceId))];

    if (traceIds.length === 0) {
      return;
    }

    try {
      const completions = await fetchCurrentUserRecapQuestionCompletions(
        session.token,
        {
          labKey,
          traceIds,
        },
      );

      eventRecapQuestionCompletion.replaceCompletedQuestions(
        createCompletedEventRecapQuestionKeys(completions.items),
      );
    } catch (error) {
      recapQuestionCompletionErrorMessage.value =
        error instanceof Error
          ? error.message
          : "复盘问题完成状态加载失败";
    }
  } catch (error) {
    labEventLogs.value = [];
    labEventLogsErrorMessage.value =
      error instanceof Error ? error.message : "实验事件日志加载失败";
  } finally {
    isLoadingLabEventLogs.value = false;
  }
}

async function handleToggleEventRecapQuestion(
  event: CurrentUserLabEventLogSummary,
  questionIndex: number,
) {
  if (!session.token) {
    return;
  }

  const nextCompleted = !eventRecapQuestionCompletion.isQuestionCompleted(
    event.traceId,
    questionIndex,
  );

  recapQuestionCompletionErrorMessage.value = "";
  eventRecapQuestionCompletion.setQuestionCompleted(
    event.traceId,
    questionIndex,
    nextCompleted,
  );

  try {
    const result = await setCurrentUserRecapQuestionCompletion(session.token, {
      traceId: event.traceId,
      labKey: event.labKey,
      questionIndex,
      completed: nextCompleted,
    });

    eventRecapQuestionCompletion.setQuestionCompleted(
      result.item.traceId,
      result.item.questionIndex,
      result.item.completed,
    );
  } catch (error) {
    eventRecapQuestionCompletion.setQuestionCompleted(
      event.traceId,
      questionIndex,
      !nextCompleted,
    );
    recapQuestionCompletionErrorMessage.value =
      error instanceof Error ? error.message : "复盘问题完成状态保存失败";
  }
}

async function loadLabDetail() {
  isLoading.value = true;
  errorMessage.value = "";
  labEventLogs.value = [];
  labEventLogsErrorMessage.value = "";
  recapQuestionCompletionErrorMessage.value = "";
  eventRecapExpansion.resetExpandedEvents();
  eventRecapQuestionCompletion.resetCompletedQuestions();

  try {
    lab.value = await fetchLab(props.category, props.scene);

    if (session.token) {
      void session.loadLabRecordSummary();
      void loadCurrentLabEventLogs(lab.value.id);
    }
  } catch (error) {
    lab.value = null;
    errorMessage.value =
      error instanceof Error ? error.message : "实验详情加载失败";
  } finally {
    isLoading.value = false;
  }
}

watch(() => [props.category, props.scene], () => void loadLabDetail(), {
  immediate: true,
});
</script>

<template>
  <section class="page-section">
    <p v-if="isLoading" class="state-text">正在加载实验详情...</p>
    <p v-else-if="errorMessage" class="state-text error-text">{{ errorMessage }}</p>

    <template v-else-if="lab">
      <div class="section-heading detail-heading">
        <p class="eyebrow">{{ lab.category }} / {{ lab.subcategory }}</p>
        <h1>{{ lab.title }}</h1>
        <p>{{ lab.summary }}</p>
        <div class="lab-meta">
          <span class="status-pill">{{ lab.status }}</span>
          <span>{{ lab.severity }}</span>
          <span>{{ lab.difficulty }}</span>
          <span>{{ lab.mode }}</span>
        </div>
      </div>

      <div class="detail-layout">
        <section class="detail-panel">
          <h2>实验变体</h2>
          <div class="variant-detail-list">
            <article
              v-for="item in variantEntries"
              :key="item.variant.key"
              class="variant-detail-item"
            >
              <div>
                <strong>{{ item.variant.title }}</strong>
                <p>{{ item.variant.description }}</p>
                <small>{{ item.variant.expectedOutcome }}</small>
              </div>
              <RouterLink
                v-if="item.entrypoint"
                class="secondary-action"
                :to="item.entrypoint.path"
              >
                进入{{ item.variant.title }}
              </RouterLink>
              <span v-else class="state-text">暂无页面入口</span>
            </article>
          </div>
        </section>

        <section class="detail-panel">
          <h2>知识点</h2>
          <ul class="detail-list">
            <li v-for="point in lab.knowledgePoints" :key="point">{{ point }}</li>
          </ul>
        </section>

        <section class="detail-panel">
          <h2>验证方式</h2>
          <div class="detail-stack">
            <p v-if="lab.verification.manual.supported">
              手动验证：{{ lab.verification.manual.stepsDocPath }}
            </p>
            <ul class="detail-list">
              <li
                v-for="signal in lab.verification.manual.expectedSignals"
                :key="signal"
              >
                {{ signal }}
              </li>
            </ul>
            <p>
              自动化：{{
                lab.verification.automation.supported ? "已接入" : "未接入"
              }}
            </p>
            <p v-if="lab.verification.automation.playwright?.enabled">
              Playwright：{{ lab.verification.automation.playwright.specPath }}
            </p>
          </div>
        </section>

        <section class="detail-panel">
          <h2>文档与脚本</h2>
          <div class="detail-stack">
            <div>
              <strong>文档入口</strong>
              <ul class="detail-list">
                <li v-for="doc in lab.entrypoints.docs" :key="doc.key">
                  {{ doc.description }}：{{ doc.path }}
                </li>
              </ul>
            </div>
            <div>
              <strong>脚本入口</strong>
              <ul v-if="lab.entrypoints.scripts.length > 0" class="detail-list">
                <li v-for="script in lab.entrypoints.scripts" :key="script.key">
                  {{ script.description }}：{{ script.path }}
                </li>
              </ul>
              <p v-else class="state-text">暂无脚本入口</p>
            </div>
          </div>
        </section>

        <section class="detail-panel records-panel">
          <h2>当前实验记录</h2>
          <div v-if="!session.token" class="detail-stack">
            <p class="state-text">登录后可以查看当前实验的学习进度和验证记录。</p>
            <RouterLink class="secondary-action detail-inline-action" to="/login">
              去登录
            </RouterLink>
          </div>
          <div v-else-if="session.isLoadingLabRecords" class="state-text">
            正在读取实验记录
          </div>
          <div v-else-if="session.labRecordsErrorMessage" class="error-text">
            {{ session.labRecordsErrorMessage }}
          </div>
          <div v-else-if="!hasCurrentLabRecords" class="state-text">
            暂无当前实验记录
          </div>
          <div v-else class="detail-stack">
            <div>
              <strong>学习进度</strong>
              <ul class="record-list">
                <li
                  v-for="item in currentLabRecords.progress"
                  :key="`${item.labKey}-${item.variantKey}`"
                >
                  <span>{{ item.variantKey }} / {{ item.status }}</span>
                  <small>{{ item.updatedAt }}</small>
                </li>
              </ul>
            </div>
            <div>
              <strong>最近验证</strong>
              <ul class="record-list">
                <li
                  v-for="item in currentLabRecords.verifications"
                  :key="`${item.labKey}-${item.createdAt}`"
                >
                  <span>{{ item.variantKey }} / {{ item.result }}</span>
                  <small>{{ item.summary }}</small>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section class="detail-panel records-panel">
          <h2>最近事件复盘</h2>
          <div v-if="!session.token" class="detail-stack">
            <p class="state-text">登录后可以查看当前实验最近事件日志。</p>
          </div>
          <div v-else-if="isLoadingLabEventLogs" class="state-text">
            正在读取事件日志
          </div>
          <div v-else-if="labEventLogsErrorMessage" class="error-text">
            {{ labEventLogsErrorMessage }}
          </div>
          <div v-else-if="currentLabEventLogs.length === 0" class="state-text">
            暂无当前实验事件日志
          </div>
          <template v-else>
            <p
              v-if="recapQuestionCompletionErrorMessage"
              class="error-text"
            >
              {{ recapQuestionCompletionErrorMessage }}
            </p>
            <ul class="record-list">
              <EventRecapCard
                v-for="event in currentLabEventLogs"
                :key="event.traceId"
                :content="createLabEventRecapCardContent(event)"
                :expanded="eventRecapExpansion.isEventExpanded(event.traceId)"
                :questions="createEventRecapQuestionViews(event)"
                @toggle-expanded="
                  eventRecapExpansion.toggleEventExpanded(event.traceId)
                "
                @toggle-question-completed="
                  (questionIndex) =>
                    handleToggleEventRecapQuestion(event, questionIndex)
                "
              />
            </ul>
          </template>
        </section>
      </div>
    </template>
  </section>
</template>
