import { ref } from "vue";

import type {
  CurrentUserLabEventLogSummary,
  UserRecapQuestionCompletionSummary,
} from "../api/lab-records";

export type EventRecapCardContent = {
  heading: string;
  metaText: string;
  summaryText: string;
  detailLines: string[];
};

function createEventRecapMetaText(event: CurrentUserLabEventLogSummary) {
  return `${event.variantKey} / ${event.phase} / ${event.decision} / ${event.riskLevel}`;
}

function createEventRecapStatusText(event: CurrentUserLabEventLogSummary) {
  return `${event.createdAt} / HTTP ${event.statusCode}`;
}

export function createAccountEventRecapCardContent(
  event: CurrentUserLabEventLogSummary,
): EventRecapCardContent {
  return {
    heading: event.title,
    metaText: createEventRecapMetaText(event),
    summaryText: event.signal,
    detailLines: [event.message, createEventRecapStatusText(event)],
  };
}

export function createLabEventRecapCardContent(
  event: CurrentUserLabEventLogSummary,
): EventRecapCardContent {
  return {
    heading: event.signal,
    metaText: createEventRecapMetaText(event),
    summaryText: event.message,
    detailLines: [createEventRecapStatusText(event)],
  };
}

export function useEventRecapExpansionState(initialTraceIds: string[] = []) {
  const expandedTraceIds = ref<string[]>([...initialTraceIds]);

  function isEventExpanded(traceId: string) {
    return expandedTraceIds.value.includes(traceId);
  }

  function toggleEventExpanded(traceId: string) {
    if (isEventExpanded(traceId)) {
      expandedTraceIds.value = expandedTraceIds.value.filter(
        (item) => item !== traceId,
      );
      return;
    }

    expandedTraceIds.value = [...expandedTraceIds.value, traceId];
  }

  function resetExpandedEvents() {
    expandedTraceIds.value = [];
  }

  return {
    expandedTraceIds,
    isEventExpanded,
    resetExpandedEvents,
    toggleEventExpanded,
  };
}

export function createEventRecapQuestionKey(
  traceId: string,
  questionIndex: number,
) {
  return `${traceId}::question-${questionIndex}`;
}

export function createCompletedEventRecapQuestionKeys(
  completions: UserRecapQuestionCompletionSummary[],
) {
  return completions
    .filter((item) => item.completed)
    .map((item) =>
      createEventRecapQuestionKey(item.traceId, item.questionIndex),
    );
}

export function useEventRecapQuestionCompletionState(
  initialQuestionKeys: string[] = [],
) {
  const completedQuestionKeys = ref<string[]>([...initialQuestionKeys]);

  function isQuestionCompleted(traceId: string, questionIndex: number) {
    return completedQuestionKeys.value.includes(
      createEventRecapQuestionKey(traceId, questionIndex),
    );
  }

  function toggleQuestionCompleted(traceId: string, questionIndex: number) {
    const questionKey = createEventRecapQuestionKey(traceId, questionIndex);

    if (completedQuestionKeys.value.includes(questionKey)) {
      completedQuestionKeys.value = completedQuestionKeys.value.filter(
        (item) => item !== questionKey,
      );
      return;
    }

    completedQuestionKeys.value = [...completedQuestionKeys.value, questionKey];
  }

  function setQuestionCompleted(
    traceId: string,
    questionIndex: number,
    completed: boolean,
  ) {
    const questionKey = createEventRecapQuestionKey(traceId, questionIndex);
    const isCompleted = completedQuestionKeys.value.includes(questionKey);

    if (completed === isCompleted) {
      return;
    }

    if (completed) {
      completedQuestionKeys.value = [...completedQuestionKeys.value, questionKey];
      return;
    }

    completedQuestionKeys.value = completedQuestionKeys.value.filter(
      (item) => item !== questionKey,
    );
  }

  function replaceCompletedQuestions(questionKeys: string[]) {
    completedQuestionKeys.value = [...questionKeys];
  }

  function countCompletedQuestions(traceId: string, questionCount: number) {
    let completedCount = 0;

    for (let index = 0; index < questionCount; index += 1) {
      if (isQuestionCompleted(traceId, index)) {
        completedCount += 1;
      }
    }

    return completedCount;
  }

  function resetCompletedQuestions() {
    completedQuestionKeys.value = [];
  }

  return {
    completedQuestionKeys,
    countCompletedQuestions,
    isQuestionCompleted,
    replaceCompletedQuestions,
    resetCompletedQuestions,
    setQuestionCompleted,
    toggleQuestionCompleted,
  };
}
