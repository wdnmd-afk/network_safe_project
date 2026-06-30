# 目录遍历实验

## 目标

本实验用于理解 Web 文档读取、下载、预览接口中的目录遍历风险。实验从攻击方视角提交一个受控的 `../` 路径样例，再对比修复版如何在路径规范化后限制最终路径仍位于公开目录内。

## 实验边界

- 仅面向本机、本项目、受控学习环境。
- 后端只读取内置虚拟文档索引，不读取真实文件系统。
- 内部文档是教学占位内容，不包含真实密钥、真实系统路径或真实隐私数据。
- 事件日志只记录路径长度、规范化结果、是否逃逸公开根目录和学习信号。

## 入口

- 漏洞版页面：`/labs/web/path-traversal/vuln`
- 修复版页面：`/labs/web/path-traversal/fixed`
- 漏洞版 API：`POST /api/labs/web/path-traversal/vuln/read`
- 修复版 API：`POST /api/labs/web/path-traversal/fixed/read`

## 关键样例

正常公开文档：

```json
{
  "requestedPath": "user-guide.md"
}
```

受控攻击样例：

```json
{
  "requestedPath": "../internal/admin-note.txt"
}
```

## 预期信号

- 漏洞版提交受控攻击样例：`path-traversal-sensitive-file-exposed`
- 修复版提交同一受控攻击样例：`path-traversal-normalized-blocked`
- 任一版本提交正常公开文档：`path-traversal-normal-file-read`

## 文档

- [攻击步骤](./docs/attack-steps.md)
- [修复说明](./docs/fix-notes.md)
- [手动验证](./docs/manual-verification.md)
