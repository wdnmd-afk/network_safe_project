import { describe, expect, it } from "vitest";

import type { CurrentUserLabEventLogSummary } from "../src/api/lab-records";
import {
  createAccountEventRecapCardContent,
  createCompletedEventRecapQuestionKeys,
  createEventRecapQuestionKey,
  createLabEventRecapCardContent,
  useEventRecapExpansionState,
  useEventRecapQuestionCompletionState,
} from "../src/labs/event-recap";

const event = {
  traceId: "trace-csrf-vuln",
  labKey: "web.csrf",
  title: "CSRF transfer",
  variantKey: "vuln",
  phase: "attack",
  eventType: "success",
  actorPerspective: "attacker",
  decision: "accepted",
  signal: "csrf-transfer-accepted",
  statusCode: 200,
  message: "vulnerable variant accepted a request without CSRF token",
  riskLevel: "high",
  createdAt: "2026-06-26T08:30:00.000Z",
} satisfies CurrentUserLabEventLogSummary;

describe("event recap card content", () => {
  it("creates account recap card content", () => {
    expect(createAccountEventRecapCardContent(event)).toEqual({
      heading: "CSRF transfer",
      metaText: "vuln / attack / accepted / high",
      summaryText: "csrf-transfer-accepted",
      detailLines: [
        "vulnerable variant accepted a request without CSRF token",
        "2026-06-26T08:30:00.000Z / HTTP 200",
      ],
    });
  });

  it("creates lab detail recap card content", () => {
    expect(createLabEventRecapCardContent(event)).toEqual({
      heading: "csrf-transfer-accepted",
      metaText: "vuln / attack / accepted / high",
      summaryText: "vulnerable variant accepted a request without CSRF token",
      detailLines: ["2026-06-26T08:30:00.000Z / HTTP 200"],
    });
  });
});

describe("event recap expansion state", () => {
  it("starts with no expanded events", () => {
    const expansion = useEventRecapExpansionState();

    expect(expansion.expandedTraceIds.value).toEqual([]);
    expect(expansion.isEventExpanded("trace-a")).toBe(false);
  });

  it("toggles one event by trace id", () => {
    const expansion = useEventRecapExpansionState();

    expansion.toggleEventExpanded("trace-a");

    expect(expansion.expandedTraceIds.value).toEqual(["trace-a"]);
    expect(expansion.isEventExpanded("trace-a")).toBe(true);

    expansion.toggleEventExpanded("trace-a");

    expect(expansion.expandedTraceIds.value).toEqual([]);
    expect(expansion.isEventExpanded("trace-a")).toBe(false);
  });

  it("keeps different trace ids isolated", () => {
    const expansion = useEventRecapExpansionState(["trace-a"]);

    expansion.toggleEventExpanded("trace-b");

    expect(expansion.isEventExpanded("trace-a")).toBe(true);
    expect(expansion.isEventExpanded("trace-b")).toBe(true);

    expansion.toggleEventExpanded("trace-a");

    expect(expansion.isEventExpanded("trace-a")).toBe(false);
    expect(expansion.isEventExpanded("trace-b")).toBe(true);
  });

  it("resets all expanded events", () => {
    const expansion = useEventRecapExpansionState(["trace-a", "trace-b"]);

    expansion.resetExpandedEvents();

    expect(expansion.expandedTraceIds.value).toEqual([]);
  });
});

describe("event recap question completion state", () => {
  it("creates a stable state key from trace id and question index", () => {
    expect(createEventRecapQuestionKey("trace-a", 2)).toBe(
      "trace-a::question-2",
    );
  });

  it("maps persisted completed records to local state keys", () => {
    expect(
      createCompletedEventRecapQuestionKeys([
        {
          traceId: "trace-a",
          labKey: "web.csrf",
          questionIndex: 0,
          questionKey: "question-0",
          completed: true,
          completedAt: "2026-06-29T08:00:00.000Z",
          updatedAt: "2026-06-29T08:01:00.000Z",
        },
        {
          traceId: "trace-a",
          labKey: "web.csrf",
          questionIndex: 1,
          questionKey: "question-1",
          completed: false,
          completedAt: null,
          updatedAt: "2026-06-29T08:02:00.000Z",
        },
      ]),
    ).toEqual(["trace-a::question-0"]);
  });

  it("toggles one question completion by trace id and question index", () => {
    const completion = useEventRecapQuestionCompletionState();

    completion.toggleQuestionCompleted("trace-a", 0);

    expect(completion.completedQuestionKeys.value).toEqual([
      "trace-a::question-0",
    ]);
    expect(completion.isQuestionCompleted("trace-a", 0)).toBe(true);

    completion.toggleQuestionCompleted("trace-a", 0);

    expect(completion.completedQuestionKeys.value).toEqual([]);
    expect(completion.isQuestionCompleted("trace-a", 0)).toBe(false);
  });

  it("keeps different events and question indexes isolated", () => {
    const completion = useEventRecapQuestionCompletionState([
      "trace-a::question-0",
    ]);

    completion.toggleQuestionCompleted("trace-a", 1);
    completion.toggleQuestionCompleted("trace-b", 0);

    expect(completion.isQuestionCompleted("trace-a", 0)).toBe(true);
    expect(completion.isQuestionCompleted("trace-a", 1)).toBe(true);
    expect(completion.isQuestionCompleted("trace-b", 0)).toBe(true);
    expect(completion.isQuestionCompleted("trace-b", 1)).toBe(false);
  });

  it("counts only completed questions in the requested range", () => {
    const completion = useEventRecapQuestionCompletionState([
      "trace-a::question-0",
      "trace-a::question-2",
      "trace-a::question-5",
      "trace-b::question-0",
    ]);

    expect(completion.countCompletedQuestions("trace-a", 4)).toBe(2);
    expect(completion.countCompletedQuestions("trace-b", 4)).toBe(1);
  });

  it("sets one question completion state exactly", () => {
    const completion = useEventRecapQuestionCompletionState();

    completion.setQuestionCompleted("trace-a", 0, true);
    completion.setQuestionCompleted("trace-a", 0, true);

    expect(completion.completedQuestionKeys.value).toEqual([
      "trace-a::question-0",
    ]);

    completion.setQuestionCompleted("trace-a", 0, false);

    expect(completion.completedQuestionKeys.value).toEqual([]);
  });

  it("replaces local completion state from persisted records", () => {
    const completion = useEventRecapQuestionCompletionState([
      "trace-old::question-0",
    ]);

    completion.replaceCompletedQuestions(["trace-new::question-1"]);

    expect(completion.completedQuestionKeys.value).toEqual([
      "trace-new::question-1",
    ]);
  });

  it("resets all question completion state", () => {
    const completion = useEventRecapQuestionCompletionState([
      "trace-a::question-0",
      "trace-b::question-1",
    ]);

    completion.resetCompletedQuestions();

    expect(completion.completedQuestionKeys.value).toEqual([]);
  });
});

