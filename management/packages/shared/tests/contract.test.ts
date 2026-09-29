import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  auditActions,
  eventActorPerspectives,
  eventDecisions,
  eventPhases,
  eventRiskLevels,
  isOneOf,
} from "../src/index.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
// 主项目是 management 的上级目录：tests -> shared -> packages -> management -> 主项目
const mainRoot = process.env.NSP_ROOT ?? path.resolve(here, "../../../..");
const eventLogSource = readFileSync(
  path.join(mainRoot, "apps/server/src/services/lab-event-logs.ts"),
  "utf8",
);

// 读取主项目类型别名的字面量联合，而不是在这里复述一遍取值
function readUnion(typeName: string) {
  const match = new RegExp(`export type ${typeName} =([^;]+);`).exec(eventLogSource);
  assert.ok(match, `主项目中找不到类型 ${typeName}`);
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]).sort();
}

test("事件枚举与主项目 lab-event-logs.ts 完全一致", () => {
  assert.deepEqual([...eventPhases].sort(), readUnion("LabEventPhase"));
  assert.deepEqual([...eventDecisions].sort(), readUnion("LabEventDecision"));
  assert.deepEqual([...eventRiskLevels].sort(), readUnion("LabEventRiskLevel"));
  assert.deepEqual(
    [...eventActorPerspectives].sort(),
    readUnion("LabEventActorPerspective"),
  );
});

test("审计动作为固定集合且无重复", () => {
  assert.equal(new Set(auditActions).size, auditActions.length);
});

test("isOneOf 只接受集合内字符串", () => {
  assert.equal(isOneOf(eventPhases, "attack"), true);
  assert.equal(isOneOf(eventPhases, "ATTACK"), false);
  assert.equal(isOneOf(eventPhases, 1), false);
  assert.equal(isOneOf(eventPhases, undefined), false);
});
