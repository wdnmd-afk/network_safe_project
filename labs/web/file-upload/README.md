# 文件上传漏洞实验

## 目标

本实验用于理解 Web 上传入口中常见的文件校验缺失问题。实验从攻击方视角提交一个受控的可执行内容样例，再对比修复版如何在进入存储前阻断。

## 实验边界

- 仅面向本机、本项目、受控学习环境。
- 上传内容通过 JSON 字段模拟，不写入真实文件系统。
- 漏洞版只返回模拟存储路径，不生成真实可访问的脚本文件。
- 事件日志只记录文件名、MIME、扩展名、内容长度和检测信号，不记录完整上传内容。

## 入口

- 漏洞版页面：`/labs/web/file-upload/vuln`
- 修复版页面：`/labs/web/file-upload/fixed`
- 漏洞版 API：`POST /api/labs/web/file-upload/vuln/upload`
- 修复版 API：`POST /api/labs/web/file-upload/fixed/upload`

## 关键样例

正常图片样例：

```json
{
  "fileName": "avatar.png",
  "contentType": "image/png",
  "contentText": "PNG image bytes for local learning sample"
}
```

受控攻击样例：

```json
{
  "fileName": "shell.php",
  "contentType": "application/x-php",
  "contentText": "<?php echo 'local controlled sample'; ?>"
}
```

## 预期信号

- 漏洞版提交受控攻击样例：`file-upload-executable-stored`
- 修复版提交同一受控攻击样例：`file-upload-validation-blocked`
- 任一版本提交正常图片样例：`file-upload-normal-image-stored`

## 文档

- [攻击步骤](./docs/attack-steps.md)
- [修复说明](./docs/fix-notes.md)
- [手动验证](./docs/manual-verification.md)
