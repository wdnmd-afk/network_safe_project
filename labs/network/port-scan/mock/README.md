# 虚拟资产模型说明

## 1. 作用

`mock/` 目录用于记录后续虚拟资产模型的设计说明。

首版模型必须是固定的内存数据，不读取真实网络状态。

## 2. 计划资产字段

后续虚拟资产建议包含：

- `targetKey`
- `targetTitle`
- `profile`
- `ports`
- `riskNotes`

虚拟端口建议包含：

- `port`
- `protocol`
- `serviceLabel`
- `exposure`
- `riskLevel`
- `learningHint`

## 3. 禁止内容

本目录不得保存：

- 真实 IP。
- 真实主机名。
- 真实服务 banner。
- 真实网络扫描结果。
- 凭据、token、Cookie。

