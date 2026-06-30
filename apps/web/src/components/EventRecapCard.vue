<script setup lang="ts">
import type { EventRecapCardContent } from "../labs/event-recap";

export type EventRecapQuestionView = {
  text: string;
  completed: boolean;
};

defineProps<{
  content: EventRecapCardContent;
  expanded: boolean;
  questions?: EventRecapQuestionView[];
}>();

defineEmits<{
  toggleExpanded: [];
  toggleQuestionCompleted: [questionIndex: number];
}>();

function countCompletedQuestions(questions: EventRecapQuestionView[]) {
  return questions.filter((question) => question.completed).length;
}
</script>

<template>
  <li class="recap-event-card">
    <div class="recap-event-summary">
      <div>
        <strong>{{ content.heading }}</strong>
        <span>{{ content.metaText }}</span>
        <small>{{ content.summaryText }}</small>
      </div>
      <button
        type="button"
        class="secondary-button recap-toggle"
        :aria-expanded="expanded"
        @click="$emit('toggleExpanded')"
      >
        {{ expanded ? "收起" : "展开" }}
      </button>
    </div>

    <div v-if="expanded" class="recap-event-details">
      <small v-for="line in content.detailLines" :key="line">{{ line }}</small>
      <template v-if="questions && questions.length > 0">
        <small>
          问题完成
          {{ countCompletedQuestions(questions) }}
          / {{ questions.length }}
        </small>
        <ul class="detail-list recap-question-list">
          <li
            v-for="(question, questionIndex) in questions"
            :key="question.text"
            class="recap-question-item"
            :class="{ 'is-completed': question.completed }"
          >
            <label>
              <input
                type="checkbox"
                :checked="question.completed"
                @change="$emit('toggleQuestionCompleted', questionIndex)"
              />
              <span>{{ question.text }}</span>
            </label>
          </li>
        </ul>
      </template>
    </div>
  </li>
</template>
