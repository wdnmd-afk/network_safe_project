# Mock 数据说明

本场景不发起真实网络请求。后端服务内置一个虚拟资源表：

- `https://safe-mart-cdn.local/public/catalog.json`：公开商品目录。
- `https://safe-mart-cdn.local/public/banner.json`：公开 Banner 配置。
- `http://169.254.169.254/latest/meta-data/iam/security-credentials/demo`：内部元数据模拟响应。

内部元数据只包含教学占位文本，不包含真实访问密钥、真实云平台字段或真实内部服务信息。
