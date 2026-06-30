# XXE 手动验证

## 验证前置

- 本机后端服务已启动。
- 本机前端页面可访问。
- 已登录演示账号。

## 漏洞版正常导入

1. 打开 `/labs/web/xxe/vuln`。
2. 点击“填入正常 XML”。
3. 点击“导入预览”。
4. 预期信号为 `xxe-safe-xml-imported`。
5. 导入预览展示客户名和金额。

## 漏洞版受控实体

1. 打开 `/labs/web/xxe/vuln`。
2. 点击“填入受控 XXE 样例”。
3. 点击“导入预览”。
4. 预期信号为 `xxe-internal-resource-exposed`。
5. 请求摘要中应显示 DOCTYPE、`labSecret` 和 `virtual-file`。

## 修复版阻断

1. 打开 `/labs/web/xxe/fixed`。
2. 点击“填入受控 XXE 样例”。
3. 点击“导入预览”。
4. 预期信号为 `xxe-doctype-blocked`。
5. 后端决策为 `blocked`。

## 日志检查

在账户中心或实验详情页查看最近事件复盘：

- 漏洞版受控样例阶段应为 `attack`。
- 修复版阻断阶段应为 `defense`。
- 日志只展示 XML 长度、DOCTYPE、实体名、实体来源和学习信号。
- 日志不展示完整 XML 文档、完整实体声明或虚拟资源内容。
