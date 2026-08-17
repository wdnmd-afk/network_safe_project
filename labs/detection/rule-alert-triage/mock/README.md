# 固定事件数据说明

本目录表示共享包内置的固定脱敏教学数据，不保存或采集日志文件。

- 数据集 key：`fixed-auth-process-alert-timeline`。
- 虚构来源：`virtual-auth-service`、`virtual-endpoint`、`virtual-network-sensor`。
- 基线标签：四条 `suspicious` 事件和两条 `benign` 事件。
- 规则画像：过宽认证、过窄进程、跨来源关联三组固定命中集合。

禁止在本目录加入真实主机名、账号、IP、域名、路径、凭据、日志、规则表达式、SIEM 配置或恶意样本。
