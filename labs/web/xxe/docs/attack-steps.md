# XXE 攻击步骤

## 攻击方目标

攻击方尝试控制 XML 文档中的 DTD 和实体引用，让服务端 XML 导入流程解析外部实体，从而观察虚拟内部资源暴露信号。

本实验只允许固定受控样例：

```xml
<!DOCTYPE invoice [<!ENTITY labSecret SYSTEM "file:///virtual/lab/internal-note">]>
<invoice><note>&labSecret;</note></invoice>
```

其中 `file:///virtual/lab/internal-note` 只是教学标识，不会映射到真实文件系统。

## 前置条件

- 仅在本机平台运行。
- 已登录演示账号。
- 后端服务已启用统一实验事件日志。

## 漏洞版步骤

1. 打开 `/labs/web/xxe/vuln`。
2. 点击“填入正常 XML”，提交一次导入预览，确认出现 `xxe-safe-xml-imported`。
3. 点击“填入受控 XXE 样例”，提交导入预览。
4. 观察后端返回 `xxe-internal-resource-exposed` 或 `xxe-virtual-entity-resolved`。
5. 查看请求摘要中的 DOCTYPE、实体名和实体来源类型。
6. 在账户中心或实验详情页查看统一事件日志，确认阶段为 `attack`，输入摘要不包含完整 XML 文档。

## 攻击方观察点

- 是否包含 DOCTYPE。
- 是否声明并引用 `labSecret`。
- 实体来源是否为 `virtual-file`。
- 导入预览是否出现虚拟内部说明。
- 日志是否记录学习信号而不是完整 XML。

## 禁止行为

- 不访问外部目标。
- 不扫描网络或内网。
- 不读取本机真实文件。
- 不生成通用 XXE payload 库。
- 不使用真实凭据、真实 token 或真实 Cookie。
- 不尝试解析真实外部实体。
