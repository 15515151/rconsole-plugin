# 视频直链修复说明

## 问题描述
在合并转发模式下，视频链接显示的是原始分享链接（如 `https://www.bilibili.com/video/BV...`），而不是上传后生成的 MP4 直链（如 `https://say.9e.nz/98tx.mp4`）。

## 修复内容

### 1. 修改 `sendVideoToUpload` 方法 (apps/tools.js:6114)
- **新增参数**: `skipSend` - 是否跳过发送直链消息
- **返回值变化**: 
  - `skipSend=false`: 返回 `boolean`（是否成功发送）
  - `skipSend=true`: 返回 `string`（直链 URL）或 `null`（失败）
- **用途**: 在合并转发模式下，只上传视频获取直链，不立即发送消息

### 2. 修改 `biliDownloadStrategy` 方法 (apps/tools.js:1996)
- **新增参数**: `skipSend` - 是否跳过发送直链（用于合并转发模式）
- **返回值变化**:
  - `skipSend=false`: 返回 `boolean`（是否成功）
  - `skipSend=true`: 返回 `string`（直链 URL）或 `null`（失败）
- **内部调用**: 将 `skipSend` 参数传递给 `sendVideoToUpload`

### 3. 修改 B 站视频处理逻辑 (apps/tools.js:1752-1775)
- **调用变化**: `biliDownloadStrategy` 传入 `this.biliMergeVideoMsg` 作为 `skipSend` 参数
- **处理逻辑**:
  - 合并转发模式: `videoResult` 是直链字符串
  - 传统模式: `videoResult` 是 boolean
- **合并消息**: 使用 `videoDirectUrl` 构建直链消息，格式为 `🔗 视频直链：${直链地址}`

### 4. 修改抖音视频处理逻辑 (apps/tools.js:894-906)
- **调用变化**: `sendVideoToUpload` 传入 `true` 作为 `skipSend` 参数
- **新增步骤**: 将返回的 `videoDirectUrl` 添加到 `forwardMsg` 数组中
- **格式**: `🔗 视频直链：${直链地址}`

### 5. 修正番剧处理 (apps/tools.js:1680)
- 将番剧下载的 `skipSend` 参数从 `true` 改为 `false`
- 原因: 番剧已在 `biliEpInfo` 中单独发送信息，不需要合并转发

## 修改文件
- `apps/tools.js`

## 测试要点
1. ✅ 合并转发模式下，第2条消息应显示 MP4 直链而非原始链接
2. ✅ 传统模式下，功能保持不变，直链单独发送
3. ✅ 番剧下载不受影响
4. ✅ 其他平台（YouTube、Twitter等）不受影响
5. ✅ 抖音合并转发也使用 MP4 直链

## 预期效果
合并转发消息结构：
```
[合并聊天记录]
├─ 消息1: 视频封面 + 标题 + 点赞/播放等信息
├─ 消息2: 🔗 视频直链：https://say.9e.nz/xxxxx.mp4
└─ 消息3: 评论区截图（如果有）
```

## 向后兼容性
- ✅ 所有现有调用保持兼容
- ✅ 新参数有默认值，不影响其他功能
