# CRLF 注入模拟资源

## 用途

`mock/` 目录用于记录 CRLF 注入实验的虚拟响应头模板说明。当前预览数据保存在后端内存 service 中，不作为真实 Web 服务器配置。

## 虚拟模板计划

初期只保留一个模板：

- `download-filename`：生成 `Content-Disposition` 虚拟头部。

下载方式初期只允许：

- `attachment`
- `inline`

## 边界

- 不保存真实文件。
- 不保存真实下载链接。
- 不保存真实响应头配置。
- 不作为 nginx、Node HTTP server 或代理配置。
- 不包含可对外复用的响应拆分样例库。
