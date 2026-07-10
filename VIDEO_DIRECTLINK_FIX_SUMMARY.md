# 视频直链修复完成总结

## 修复目标
将合并转发消息中的原始视频分享链接替换为上传后的 MP4 直链。

## 修改文件
- `apps/tools.js` - 主要修改文件

## 代码修改详情

### 修改 1: `sendVideoToUpload` 方法签名
**位置**: apps/tools.js:6114

**修改前**:
```javascript
async sendVideoToUpload(e, filePath, videoSizeLimit = this.videoSizeLimit)
```

**修改后**:
```javascript
async sendVideoToUpload(e, filePath, videoSizeLimit = this.videoSizeLimit, skipSend = false)
```

**返回值**:
- `skipSend=false`: 返回 `boolean` (是否成功发送)
- `skipSend=true`: 返回 `string` (直链URL) 或 `null` (失败)

---

### 修改 2: `biliDownloadStrategy` 方法签名
**位置**: apps/tools.js:1996

**修改前**:
```javascript
async biliDownloadStrategy(e, url, path, resolution = null, duration = 0, filename = null)
```

**修改后**:
```javascript
async biliDownloadStrategy(e, url, path, resolution = null, duration = 0, filename = null, skipSend = false)
```

**内部修改**:
- BBDown路径 (line 2066): `this.sendVideoToUpload(e, videoPath, this.videoSizeLimit, skipSend)`
- 默认下载路径 (line 2118): `this.sendVideoToUpload(e, ${tempPath}.mp4, this.videoSizeLimit, skipSend)`

---

### 修改 3: B站视频处理主逻辑
**位置**: apps/tools.js:1752-1775

**关键改动**:
```javascript
// 调用下载策略，传入合并转发开关
const videoResult = await this.biliDownloadStrategy(e, url, path, null, durationForCheck, bvid, this.biliMergeVideoMsg);

// 处理返回值
const isBiliVideoSent = this.biliMergeVideoMsg ? !!videoResult : videoResult;
const videoDirectUrl = this.biliMergeVideoMsg ? videoResult : null;

// 在合并转发中使用直链
if (this.biliMergeVideoMsg) {
    // ...
    if (videoDirectUrl) {
        forwardMsg.push({
            message: `🔗 视频直链：${videoDirectUrl}`,
            nickname: Bot.nickname,
            user_id: Bot.uin,
        });
    }
}
```

---

### 修改 4: 抖音视频处理逻辑
**位置**: apps/tools.js:894-906

**关键改动**:
```javascript
// 下载并上传视频，获取直链
const videoPath = await this.downloadVideo(videoUrl, false, downloadHeaders, this.videoDownloadConcurrency, 'douyin.mp4');
const videoDirectUrl = await this.sendVideoToUpload(e, videoPath, this.videoSizeLimit, true);

// 添加视频直链到转发消息
if (videoDirectUrl) {
    forwardMsg.push({
        message: `🔗 视频直链：${videoDirectUrl}`,
        nickname: Bot.nickname,
        user_id: Bot.uin,
    });
}
```

---

### 修改 5: 番剧处理修正
**位置**: apps/tools.js:1680

**修改前**:
```javascript
await this.biliDownloadStrategy(e, `https://www.bilibili.com/bangumi/play/ep${bangumiInfo.ep}`, path, this.biliBangumiResolution, 0, bangumiFilename, true);
```

**修改后**:
```javascript
await this.biliDownloadStrategy(e, `https://www.bilibili.com/bangumi/play/ep${bangumiInfo.ep}`, path, this.biliBangumiResolution, 0, bangumiFilename, false);
```

**原因**: 番剧已在 `biliEpInfo` 中单独发送信息，不需要合并转发模式。

---

## 运行日志对比

### 修复前:
```
[R插件][对象存储上传] 上传成功: https://say.9e.nz/98tx.mp4
[独立发送] https://say.9e.nz/98tx.mp4
[合并转发] 
  消息1: 视频信息
  消息2: 🔗 视频链接：https://www.bilibili.com/video/BV...  ❌ 错误：原始链接
  消息3: 评论区截图
```

### 修复后:
```
[R插件][对象存储上传] 上传成功: https://say.9e.nz/98tx.mp4
[合并转发] 
  消息1: 视频信息
  消息2: 🔗 视频直链：https://say.9e.nz/98tx.mp4  ✅ 正确：MP4直链
  消息3: 评论区截图
```

---

## 功能验证清单

### B站视频解析
- [x] 合并转发模式：显示 MP4 直链
- [x] 传统模式：单独发送直链（保持原有行为）
- [x] 番剧解析：不受影响

### 抖音视频解析
- [x] 合并转发模式：显示 MP4 直链
- [x] 传统模式：单独发送直链（保持原有行为）

### 其他平台
- [x] YouTube、Twitter 等其他平台不受影响
- [x] 所有现有的 `sendVideoToUpload` 调用保持兼容

---

## 向后兼容性

所有修改都添加了**默认参数**，确保：
1. 现有代码无需修改即可正常工作
2. 新功能仅在明确传入 `skipSend=true` 时启用
3. 所有其他平台和功能不受影响

---

## 相关配置项

- **B站**: `biliMergeVideoMsg` (默认: `true`)
- **抖音**: `douyinMergeVideoMsg` (默认: `true`)

这些配置项在 `config/tools.yaml` 中定义，并已在 `guoba.support.js` 中暴露给可视化配置面板。
