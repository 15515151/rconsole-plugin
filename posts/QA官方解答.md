---
title: QA官方解答
description: R插件的问题解答
date: 2024-08-14
tags:
  - 问题解答
---

##  🐤 Q&A

### 🛠️ 使用方法（基础）

1.【必要】下载插件
```shell
# 国内
git clone https://gitee.com/kyrzy0416/rconsole-plugin.git ./plugins/rconsole-plugin/
# 海外
git clone https://github.com/zhiyu1998/rconsole-plugin.git ./plugins/rconsole-plugin/
```

2.【必要】在`Yunzai-Bot / Miao-Yunzai`目录下安装axios(0.27.2)、魔法工具（tunnel）、二维码处理工具（qrcode）、高性能下载队列（p-queue）、用于拉格朗日（ws）、用于识图（openai）


```shell
pnpm i --filter=rconsole-plugin
```


### 🎬 视频解析使用说明

3.【可选】要使用`视频解析`功能要下载插件【推荐ubuntu系统】
```shell
# ubuntu
sudo apt-get install ffmpeg
# 其他linux参考（群友推荐）：https://gitee.com/baihu433/ffmpeg
# Windows 参考：https://www.jianshu.com/p/5015a477de3c
````

### 🎥 油管和Tiktok使用说明

`油管解析`需要 `yt-dlp` 的依赖才能完成解析（三选一）：
```shell
# 三选一
# ubuntu （国内 or 国外，且安装了snap）
snap install yt-dlp
# debian 海外
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ~/.local/bin/yt-dlp
chmod a+rx ~/.local/bin/yt-dlp
# debian 国内
curl -L https://ghproxy.net/https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ~/.local/bin/yt-dlp
chmod a+rx ~/.local/bin/yt-dlp
# archlinux
sudo pacman -Syu yt-dlp
```

`Tiktok解析`需要将`yt-dlp`升级到`最新版本`，如果不会可以按照下面的教程（Linux），Windows换个文件应该就可以：
```shell
# 1. 去官方下载最新版本：https://github.com/yt-dlp/yt-dlp/releases
# 2. 把yt-dlp放在Linux某个位置，比如/home/YtDlpHome/yt-dlp
# 3. 删除之前的yt-dlp，删除之前可以看看是不是最新版本

# 查看最新版本
yt-dlp --version
# 如果你是 apt 安装需要卸载
apt remove yt-dlp

# 4. 将/home/YtDlpHome/yt-dlp添加到环境变量（下面二选一）
vim ~/.bashrc  # 如果你使用 bash
vim ~/.zshrc   # 如果你使用 zsh

# 5. 添加到最后一行
export PATH="/home/YtDlpHome:$PATH"

# 6. 刷新环境变量即可
source ~/.bashrc  # 如果你使用 bash
source ~/.zshrc   # 如果你使用 zsh
```

### 🍏 Apple Music 和 Spotify 使用说明

`AM解析`和`Spotify解析`需要使用两个依赖`freyr`、`atomicparsley`，现在只以Debian系统为例：

```shell
npm install -g freyr
# 或者你有yarn的话可以使用
yarn global add freyr
# 接着安装它的依赖
apt-get install atomicparsley
```


### 📺 B站总结

对哔哩哔哩解析进行总结：需要填写哔哩哔哩的SESSDATA，或者[【推荐】扫码登录](https://gitee.com/kyrzy0416/rconsole-plugin#b%E7%AB%99%E6%89%AB%E7%A0%81%E7%99%BB%E5%BD%95)

<img src="https://s2.loli.net/2024/08/19/MH6f1AuEKgPIUOB.webp" alt="小程序解析" width="50%" height="50%" />

### 📺 B站扫码登录
命令：`#RBQ`，来自2024/4/1 才子 `Mix` 的命名

![rbq](https://s2.loli.net/2024/08/19/2ljBYQgSLUEXTKN.webp)

示例：
![rbq2](https://s2.loli.net/2024/08/19/kqLVxKluECW4YGN.webp)

### ⏳ 视频时长限制说明

增加视频的时长限制（默认8分钟(60 * 8 = 480)）：
- 在config/tools.yaml里设置`biliDuration`
- 锅巴设置

### 🔄 R插件版本回退方法（慎重）

下载指定版本的R插件：
如果你觉得当前版本的功能出现了问题，那么可以下载指定版本的插件，比如`1.5.1`：
```shell
# 删除当前的R插件
rm -rf ./plugins/rconsole-plugin/
# 克隆指定版本的R插件稳定版本
git clone -b 1.6.7-lts https://gitee.com/kyrzy0416/rconsole-plugin.git
```

### 🎵 douyin问题

由于douyin的解析变化莫测，现版本需要填入自己的cookie，具体步骤如下：

👍 **推荐方案** ：via 视频教程（由群友 `@麦满分` 录制）：https://thumbsnap.com/rKxUGKqp

![](https://51shazhu.com/autoupload/20240714/Ew6x/1024X640/rKxUGKqp.gif?type=ha)

👍 **推荐方案**（感谢群友 `@湘潭` 提供的便捷方案）：
1. 打开`https://www.douyin.com/` 扫码登入自己的账号
2. F12进入控制台，打开`网络/network`
3. 搜索`www.douyin.com`，把下面的一串cookie复制进去即可

![](https://s2.loli.net/2024/08/19/E8SWgNZKlHmC6oi.webp)

**备用方案1** ：

1. 打开`https://www.douyin.com/` 扫码登入自己的账号
2. F12进入控制台，或者下载一个[Cookie-Editor](https://www.crxsoso.com/webstore/detail/hlkenndednhfkekhgcdicdfddnkalmdm)
3. 如果是F12，就将以下参数填入到`tools.yaml - douyinCookie`，或者使用锅巴
> odin_tt=xxx;passport_fe_beating_status=xxx;sid_guard=xxx;uid_tt=xxx;uid_tt_ss=xxx;sid_tt=xxx;sessionid=xxx;sessionid_ss=xxx;sid_ucp_v1=xxx;ssid_ucp_v1=xxx;passport_assist_user=xxx;ttwid=xxx;

3. 如果是`Cookie-Editor`就直接到插件复制到`tools.yaml - douyinCookie`，或者锅巴

具体图示，找以下这几个：
- odin_tt
- passport_fe_beating_status
- sid_guard
- uid_tt
- uid_tt_ss
- sid_tt
- sessionid
- sessionid_ss
- sid_ucp_v1
- ssid_ucp_v1
- passport_assist_user
- ttwid

![](https://s2.loli.net/2024/08/19/2kUgsz1RntZmQje.webp)

**备用方案2** （由`@重装小兔`提供）

1. 下载python

> 下载链接：[官网](https://www.python.org/) | [微软商店](https://apps.microsoft.com/detail/9pjpw5ldxlz5?hl=zh-cn&gl=CN)

2. 下载：https://gitee.com/OvertimeBunny/tiktok-ck-douying

3. 扫码后自动获取ck



### ✖️ 小蓝鸟问题
**2024-2-5**，修复小蓝鸟的时候看到free计划已经[没有给查看Tweet的api](https://developer.twitter.com/en/portal/products/basic)，原先[使用的库也出现了403报错](https://github.com/PLhery/node-twitter-api-v2)，开通会员要100美元，不值得。目前暂停更新，后续有方案和精力再更新！

> 2024/2/26 目前的替代方案：使用第三方解析，但是无法解析组图，只能解析单个图片，望周知！



### ☀️ 拉格朗日配置

使用拉格朗日作为驱动的同学要进行两步：

1. 配置文件，将拉格朗日的配置文件`appsettings.json`中`Implementations`加入一个正向连接`ForwardWebSocket`
   ，如（最好是9091，这样就不用改tools配置文件）：

```yaml
"Implementations": [
  {
    "Type": "ReverseWebSocket",
    "Host": "127.0.0.1",
    "Port": 9090,
    "Suffix": "/onebot/v11/",
    "ReconnectInterval": 5000,
    "HeartBeatInterval": 5000,
    "AccessToken": ""
  },
  {
    "Type": "ForwardWebSocket",
    "Host": "127.0.0.1",
    "Port": 9091,
    "HeartBeatInterval": 5000,
    "HeartBeatEnable": true,
    "AccessToken": ""
  }
]
```

2. 在任意群里发送`#设置拉格朗日`，转换一下视频发送方式即可

![](https://s2.loli.net/2024/08/19/G5A72aojsUezKg1.webp)



### 🗂️ 微信文章总结 （完全免费总结）

官方Kimi API 暂时没有看到可以联网搜索的选项，所以选用开源的[kimi-free-api](https://github.com/LLM-Red-Team/kimi-free-api)

1. 部署 kimi-free-api

```shell
docker run -it -d --init --name kimi-free-api -p 8000:8000 -e TZ=Asia/Shanghai vinlic/kimi-free-api:latest
```

2. 更改下面两个选项，自行修改 `tools.yaml` 或者锅巴：

```yaml
aiBaseURL: '' # 用于识图的接口，kimi默认接口为：https://api.moonshot.cn，其他服务商自己填写
aiApiKey: '' # 用于识图的api key，kimi接口申请：https://platform.moonshot.cn/console/api-keys
```

- aiBaseURL：你服务器的地址部署的`kimi-free-api`，例如：`http://localhost:8000`
- aiApiKey：kimi 的 `refresh_token` （F12 -> 应用（Application） -> Local Storage -> `https://kimi.moonshot.cn` -> 找到）

3. 开始游玩

![wxkimi](https://s2.loli.net/2024/08/19/7Yty51og3JGpBn2.webp)

### 🍠 小红书的 Cookie 问题

小红书导出 cookie 最佳实践，由群友 `@辰` 提供解决方案：

1. 下一个 `Cookie-Editor`

> - Chrome：https://chrome.google.com/webstore/detail/hlkenndednhfkekhgcdicdfddnkalmdm
>
> - Edge：
    >   https://microsoftedge.microsoft.com/addons/detail/cookieeditor/neaplmfkghagebokkhpjpoebhdledlfi
>
> - 国内直通：https://www.crxsoso.com/webstore/detail/hlkenndednhfkekhgcdicdfddnkalmdm


2. 进入小红书 - 注册 - 点击 `Cookie-Editor` 的导出 `Header String`

![](https://s2.loli.net/2024/08/19/5bWtgOeMlKSaZJH.webp)

### 📺 关于使用 BBDown 下载

- Linux教程：https://pwa.sspai.com/post/83345
- Windows教程：https://github.com/nilaoda/BBDown/issues/305

### ⬇️ 关于使用下载方式

- 轻量

```shell
apt install wget
apt install axel
```

- 稳定（无须安装任何东西）

- 性能
```shell
apt install aria2
```

### ✈️ 关于小飞机解析

1. 下载 `Release`

> https://github.com/iyear/tdl

2. 放到环境变量，Linux用户可以直接解压放到`/usr/local/bin`下

3. 登录，官方提供了三种登录方式

![](https://s2.loli.net/2024/08/15/Nu63gMOUeWnBhob.webp)

4. 添加信任用户（下面分别是设置、查看所有、查看特定信任用户），⚠️ 使用引用的方法去使用命令

```shell
#设置R信任用户
#R信任用户
#查询R信任用户
```

![](https://s2.loli.net/2024/08/15/uaJQOAYyVCg5vbF.webp)

![](https://s2.loli.net/2024/08/15/Ul4kOw5SLjItWzu.webp)

![](https://s2.loli.net/2024/08/15/zVTjAKYG28MbBuL.webp)

![](https://s2.loli.net/2024/08/15/QVmNrKnsJPlpX9S.webp)

5. 开始使用！

### 🐧 关于使用 ICQQ

👍 群友`@非酋`推荐（经过大量测试得出）：icqq建议设置 `27MB` 转群文件

### 🧑‍🌾 关于百度翻译

【可选】相关配置(apps/tools.js)：
> `百度翻译`api:https://fanyi-api.baidu.com/doc/21  
> 注册完填入方式参考上方注释url (config/tools.yaml)；另外，有群友反馈百度翻译需要充钱才能使用！

### 🪄 关于魔法

> (非必要不更改)更改魔法在`config/tools.yaml` 或 [锅巴插件](https://gitee.com/guoba-yunzai/guoba-plugin)的配置位置：  
`proxyAddr: '127.0.0.1' # 魔法地址`  
`proxyPort: '7890' # 魔法端口`

> 海外服务器示例：  
> 直接发送`#设置海外解析`

### 📱 关于小程序

小程序解析适配了：
* 喵崽：[Yoimiya / Miao-Yunzai](https://gitee.com/yoimiya-kokomi/Miao-Yunzai)
* TRSS：[时雨◎星空 / Yunzai](https://gitee.com/TimeRainStarSky/Yunzai)
* 听语惊花：[听语惊花 / Yunzai-Bot-lite](https://gitee.com/Nwflower/yunzai-bot-lite)

> 如果解析有问题参考issue：[#I6MFF7](https://gitee.com/kyrzy0416/rconsole-plugin/issues/I6MFF7)
> [#I7KQVY](https://gitee.com/kyrzy0416/rconsole-plugin/issues/I7KQVY)

<img src="https://s2.loli.net/2024/08/19/uo1J35V4vMDUSbN.webp" alt="小程序解析" width="50%" height="50%" />
