import type {
  CurrentUserLabEventLogsResponse,
  CurrentUserLabRecordsResponse,
  UserRecapQuestionCompletionSummary,
} from "../api/lab-records";
import { createEventRecapQuestionKey } from "./event-recap";
import { createLabEventRecapQuestions } from "./lab-detail";

export type LabEventLogLabOption = {
  labKey: string;
  title: string;
};

export type LabRecapCompletionSummary = {
  labKey: string;
  title: string;
  eventCount: number;
  completedQuestions: number;
  totalQuestions: number;
  completionPercent: number;
};

export function createLabEventLogLabOptions(input: {
  records: CurrentUserLabRecordsResponse["records"];
  events: CurrentUserLabEventLogsResponse["events"];
  selectedLabKey?: string;
}): LabEventLogLabOption[] {
  const optionMap = new Map<string, LabEventLogLabOption>();

  for (const item of input.records.progress) {
    optionMap.set(item.labKey, {
      labKey: item.labKey,
      title: item.title,
    });
  }

  for (const item of input.records.verifications) {
    optionMap.set(item.labKey, {
      labKey: item.labKey,
      title: item.title,
    });
  }

  for (const item of input.events) {
    optionMap.set(item.labKey, {
      labKey: item.labKey,
      title: item.title,
    });
  }

  if (input.selectedLabKey && !optionMap.has(input.selectedLabKey)) {
    optionMap.set(input.selectedLabKey, {
      labKey: input.selectedLabKey,
      title: input.selectedLabKey,
    });
  }

  return [...optionMap.values()].sort((left, right) =>
    left.labKey.localeCompare(right.labKey),
  );
}

export function createLabRecapCompletionSummaries(input: {
  events: CurrentUserLabEventLogsResponse["events"];
  completions: UserRecapQuestionCompletionSummary[];
}): LabRecapCompletionSummary[] {
  const completedQuestionKeys = new Set(
    input.completions
      .filter((item) => item.completed)
      .map((item) =>
        createEventRecapQuestionKey(item.traceId, item.questionIndex),
      ),
  );
  const summaryMap = new Map<string, LabRecapCompletionSummary>();

  for (const event of input.events) {
    const questions = createLabEventRecapQuestions(event);
    const currentSummary =
      summaryMap.get(event.labKey) ??
      ({
        labKey: event.labKey,
        title: event.title,
        eventCount: 0,
        completedQuestions: 0,
        totalQuestions: 0,
        completionPercent: 0,
      } satisfies LabRecapCompletionSummary);

    currentSummary.eventCount += 1;
    currentSummary.totalQuestions += questions.length;

    for (let index = 0; index < questions.length; index += 1) {
      if (completedQuestionKeys.has(createEventRecapQuestionKey(event.traceId, index))) {
        currentSummary.completedQuestions += 1;
      }
    }

    currentSummary.completionPercent =
      currentSummary.totalQuestions === 0
        ? 0
        : Math.round(
            (currentSummary.completedQuestions / currentSummary.totalQuestions) *
              100,
          );
    summaryMap.set(event.labKey, currentSummary);
  }

  return [...summaryMap.values()].sort((left, right) =>
    left.labKey.localeCompare(right.labKey),
  );
}
