# 2026-06-30 case-study ready 元数据规则执行文档

## 目标

将 LDAP 收口过程中形成的 `case-study ready` 例外标准抽成共享元数据校验规则，避免后续网络层、社会工程学、AI 或其它高风险案例化实验在没有足够证据链时误标为 `ready`。

本轮不新增任何实验能力，不新增攻击脚本，不改变现有页面、API 或服务行为，只收紧 `packages/shared/src/lab-metadata.js` 对元数据的结构与边界校验。

## 范围

- 更新 `packages/shared/src/lab-metadata.js`。
- 更新 `packages/shared/tests/lab-metadata.test.mjs`。
- 更新 `docs/execution/security-lab-master-goal.md` 和 `docs/TODO.md`。

不在本轮范围内：

- 不新增实验目录。
- 不修改后端业务接口。
- 不修改前端页面。
- 不新增 `exploit.py`。
- 不调整现有 LDAP 运行时行为。

## 规则设计

当元数据同时满足：

```text
status: "ready"
mode: "case-study"
```

必须额外满足：

1. `safeBoundaries` 必须是非空数组。
2. `safeBoundaries` 中至少一条同时说明 `case-study` 与 `ready`。
3. `notes` 必须是非空字符串。
4. `notes` 必须说明不提供攻击脚本或 `exploit.py`。
5. `variants[].supportsAutomation` 必须全部为 `false`。
6. 自动化证据至少覆盖两类：Playwright、API 测试、脚本验证。

这些规则只用于 case-study ready 例外，不影响普通 `interactive` / `simulation` 实验。

## 实施建议

- 使用已有 `validateLabMetadata` 路径集中校验，避免在单个测试里散落特殊判断。
- 校验错误消息要明确指出 `ready case-study`，方便后续定位元数据问题。
- 保持现有 LDAP 元数据通过校验，新增负向测试覆盖缺失边界、误标变体自动化、自动化证据不足等风险。

## 潜在风险分析

- 风险：规则过严影响未来 case-study 实验。
  - 控制：规则只在 `status: "ready"` 且 `mode: "case-study"` 时触发，规划中和进行中的案例化实验不受影响。
- 风险：未来确实需要 case-study 提供攻击脚本。
  - 控制：该场景应改用 `simulation` 或 `interactive`，或重新编写执行文档调整元数据规则。
- 风险：中文关键词校验较强约束。
  - 控制：项目文档默认中文，且当前安全边界规则也以中文表达；后续如需英文元数据可再扩展允许词。

## 验证方式

- `pnpm --filter @network-safe/shared test`
- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-case-study-ready-metadata-rule.md packages/shared/src/lab-metadata.js packages/shared/tests/lab-metadata.test.mjs`
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-case-study-ready-metadata-rule.md packages/shared/src/lab-metadata.js packages/shared/tests/lab-metadata.test.mjs`

## 本轮验证记录

- `pnpm --filter @network-safe/shared test` 通过，27 项测试通过。
- 新增正向测试确认合法 `ready + case-study` 元数据可通过。
- 新增负向测试确认缺少 case-study ready 边界、误标变体攻击脚本自动化、自动化证据不足都会被拒绝。
- 目标文件 `git diff --check` 未发现空白错误，仅有既有 LF/CRLF 提示。
- 目标文件行尾空白扫描未命中。
- 当前唯一 `ready + case-study` 元数据仍为 `web.ldap-injection`。
