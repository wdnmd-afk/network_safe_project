import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createLabRecapQuestionCompletionsService,
  createRecapQuestionKey,
  type LabRecapQuestionCompletionsRepository,
} from "../src/services/lab-recap-question-completions.js";

test("createRecapQuestionKey creates stable question key from index", () => {
  assert.equal(createRecapQuestionKey(2), "question-2");
});

test("listUserQuestionCompletions maps repository records to summaries", async () => {
  const calls: unknown[] = [];
  const repository: LabRecapQuestionCompletionsRepository = {
    async findUserQuestionCompletions(input) {
      calls.push(input);

      return [
        {
          traceId: "trace-csrf-vuln",
          labKey: "web.csrf",
          questionIndex: 1,
          questionKey: "question-1",
          isCompleted: true,
          completedAt: new Date("2026-06-29T08:00:00.000Z"),
          updatedAt: new Date("2026-06-29T08:01:00.000Z"),
        },
      ];
    },
    async upsertQuestionCompletion() {
      throw new Error("upsertQuestionCompletion should not be called");
    },
  };
  const service = createLabRecapQuestionCompletionsService(repository);

  const result = await service.listUserQuestionCompletions({
    userId: "1",
    labKey: "web.csrf",
    traceIds: ["trace-csrf-vuln"],
  });

  assert.deepEqual(calls, [
    {
      userId: 1n,
      labKey: "web.csrf",
      traceIds: ["trace-csrf-vuln"],
    },
  ]);
  assert.deepEqual(result, [
    {
      traceId: "trace-csrf-vuln",
      labKey: "web.csrf",
      questionIndex: 1,
      questionKey: "question-1",
      completed: true,
      completedAt: "2026-06-29T08:00:00.000Z",
      updatedAt: "2026-06-29T08:01:00.000Z",
    },
  ]);
});

test("setQuestionCompletion upserts completed state with server question key", async () => {
  const calls: unknown[] = [];
  const repository: LabRecapQuestionCompletionsRepository = {
    async findUserQuestionCompletions() {
      throw new Error("findUserQuestionCompletions should not be called");
    },
    async upsertQuestionCompletion(input) {
      calls.push(input);

      return {
        traceId: input.traceId,
        labKey: input.labKey,
        questionIndex: input.questionIndex,
        questionKey: input.questionKey,
        isCompleted: input.completed,
        completedAt: input.completedAt,
        updatedAt: new Date("2026-06-29T08:02:00.000Z"),
      };
    },
  };
  const service = createLabRecapQuestionCompletionsService(repository);

  const result = await service.setQuestionCompletion({
    userId: "2",
    traceId: "trace-jwt-fixed",
    labKey: "auth.jwt",
    questionIndex: 0,
    completed: true,
  });

  const call = calls[0] as {
    userId: bigint;
    traceId: string;
    labKey: string;
    questionIndex: number;
    questionKey: string;
    completed: boolean;
    completedAt: Date | null;
  };

  assert.equal(call.userId, 2n);
  assert.equal(call.traceId, "trace-jwt-fixed");
  assert.equal(call.labKey, "auth.jwt");
  assert.equal(call.questionIndex, 0);
  assert.equal(call.questionKey, "question-0");
  assert.equal(call.completed, true);
  assert.ok(call.completedAt instanceof Date);
  assert.equal(result.completed, true);
  assert.equal(result.questionKey, "question-0");
});

test("setQuestionCompletion clears completedAt when unchecked", async () => {
  const repository: LabRecapQuestionCompletionsRepository = {
    async findUserQuestionCompletions() {
      throw new Error("findUserQuestionCompletions should not be called");
    },
    async upsertQuestionCompletion(input) {
      assert.equal(input.completed, false);
      assert.equal(input.completedAt, null);

      return {
        traceId: input.traceId,
        labKey: input.labKey,
        questionIndex: input.questionIndex,
        questionKey: input.questionKey,
        isCompleted: false,
        completedAt: null,
        updatedAt: new Date("2026-06-29T08:03:00.000Z"),
      };
    },
  };
  const service = createLabRecapQuestionCompletionsService(repository);

  const result = await service.setQuestionCompletion({
    userId: "2",
    traceId: "trace-jwt-fixed",
    labKey: "auth.jwt",
    questionIndex: 0,
    completed: false,
  });

  assert.deepEqual(result, {
    traceId: "trace-jwt-fixed",
    labKey: "auth.jwt",
    questionIndex: 0,
    questionKey: "question-0",
    completed: false,
    completedAt: null,
    updatedAt: "2026-06-29T08:03:00.000Z",
  });
});

