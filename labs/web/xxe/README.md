# XXE

## 实验目标

本实验通过“XML 发票 / 配置导入预览”学习 XML 外部实体风险：

- 漏洞版展示固定受控实体被虚拟 XML 资源解析器解析后的学习信号。
- 修复版展示禁用 DTD 与外部实体后的阻断效果。
- 后端写入统一实验事件日志，便于账户中心和实验详情页复盘。

## 使用方式

1. 登录平台演示账号。
2. 进入 `/labs/web/xxe/vuln`。
3. 点击“填入受控 XXE 样例”，提交导入预览。
4. 切换到 `/labs/web/xxe/fixed`，提交同样样例。
5. 对比后端决策、学习信号、实体名、实体来源和事件日志。

## 安全边界

- 本实验只使用虚拟 XML 资源解析器。
- 不读取真实本机文件。
- 不请求真实外部 URL、内网 URL 或云元数据地址。
- 不解析真实外部实体。
- `file:///virtual/...` 仅作为教学标识，不映射到真实文件系统。
- 日志只记录 XML 长度、DOCTYPE、实体名、是否命中受控样例和学习信号，不记录完整 XML 文档。

## 预期信号

- `xxe-safe-xml-imported`
- `xxe-virtual-entity-resolved`
- `xxe-internal-resource-exposed`
- `xxe-doctype-blocked`
- `xxe-entity-not-found`

## 相关文档

- `docs/attack-steps.md`
- `docs/fix-notes.md`
- `docs/manual-verification.md`
