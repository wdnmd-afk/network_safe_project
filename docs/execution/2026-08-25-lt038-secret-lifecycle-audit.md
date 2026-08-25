# LT-038 秘密泄露与密钥生命周期固定审计执行文档

## 1. 目标

新增 `crypto.secret-lifecycle-audit` 专用 D3 模拟，把固定秘密泄露证据与密钥生成、轮换、吊销、版本管理合并为一个受控审计闭环。

## 2. 固定模型与状态机

固定证据只包含不可用标记：配置 `virtual-secret-marker-config`、日志 `virtual-secret-marker-log`、源码 `virtual-secret-marker-source`、构建清单 `virtual-secret-marker-artifact`。

固定密钥台账只包含 `virtual-key-v1` / `virtual-key-v2` 的状态枚举，不含密钥材料。

请求只接受 `scenarioKey: fixed-secret-exposure-and-key-ledger` 和有序 `decisions`。

两步决策：

1. `publish-without-secret-audit` / `scan-fixed-artifacts-and-enforce-lifecycle`。
2. `continue-with-exposed-static-key` / `revoke-rotate-and-inject-secret` / `publish-with-active-version-only`。

## 3. 安全边界、风险与验证

- 不读取 `.env`、Git 历史、日志目录、构建产物或真实凭据。
- 不生成密钥、不做加解密，不回显任何用户输入。
- 交付专用服务/API、页面、元数据、标准文档、测试和 `verify.ts`。
- 验证专项脚本、前后端测试、entrypoints、coverage、`pnpm verify`。

## 4. 完成条件

- 固定泄露标记可被识别，泄露版本进入吊销/轮换摘要，正常活动版本仍可用于虚构发布流程。

