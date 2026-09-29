<script setup lang="ts">
import type { TraceDetail } from "@nsm/shared";

import {
  decisionBadgeClass,
  decisionLabel,
  formatDateTime,
  formatDuration,
  perspectiveLabel,
  phaseLabel,
  riskBadgeClass,
  riskLabel,
} from "../modules/format";

const props = defineProps<{ trace: TraceDetail }>();
</script>

<template>
  <div class="stack">
    <div class="row">
      <span class="badge">{{ props.trace.events.length }} 个事件</span>
      <span class="badge">持续 {{ formatDuration(props.trace.durationMs) }}</span>
      <span class="faint mono">{{ props.trace.traceId }}</span>
    </div>

    <ol class="timeline">
      <li
        v-for="(event, index) in props.trace.events"
        :key="event.id"
        class="timeline-item"
      >
        <span class="timeline-marker">{{ String(index + 1).padStart(2, "0") }}</span>
        <div class="timeline-body">
          <div class="row">
            <strong>{{ event.title }}</strong>
            <span :class="decisionBadgeClass(event.decision)">
              {{ decisionLabel(event.decision) }}
            </span>
            <span :class="riskBadgeClass(event.riskLevel)">
              {{ riskLabel(event.riskLevel) }}
            </span>
          </div>

          <p class="muted">{{ event.message }}</p>

          <div class="timeline-meta">
            <span>{{ phaseLabel(event.phase) }}</span>
            <span>{{ perspectiveLabel(event.actorPerspective) }}</span>
            <span>{{ event.variantKey }}</span>
            <span>HTTP {{ event.statusCode }}</span>
            <code>{{ event.signal }}</code>
            <time>{{ formatDateTime(event.createdAt) }}</time>
          </div>
        </div>
      </li>
    </ol>
  </div>
</template>
