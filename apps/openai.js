import axios from "axios";
import fs from "fs";
import path from "path";
import config from "../model/config.js";

const prompt = "请用中文回答问题";
// 默认查询，建议写的通用一些，这样可以使用在不限于video、image、file等
const defaultQuery = "描述一下内容";
// base URL
const doubaoBaseURL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
// API Key
const doubaoApiKey = "sk-152249d0e955464fa05ed78cdc2fea11";
// 模型
const doubaoModel = "qwen-vl-plus-latest";
// 每日 8 点 06 分自动清理临时文件
const CLEAN_CRON = "6 8 * * *";

export class Doubao extends plugin {
    constructor() {
        super({
            name: '[R插件补集] 千问多模态助手',
            dsc: '来自 R插件补集 的 千问多模态助手',
            event: 'message',
            priority: -500001,
            rule: [
                {
                    reg: /#gpt/,
                    fnc: 'chat'
                },
            ]
        });
        this.task = {
            cron: CLEAN_CRON,
            name: 'Doubao-自动清理临时文件',
            fnc: () => this.autoCleanTmp(),
            log: false
        };
        // 配置文件
        this.toolsConfig = config.getConfig("tools");
        // 设置基础 URL 和 headers
        this.baseURL = doubaoBaseURL || this.toolsConfig.aiBaseURL;
        this.headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + (doubaoApiKey || this.toolsConfig.aiApiKey)
        };
        this.model = doubaoModel || this.toolsConfig.aiModel;
        // 临时存储消息id，请勿修改
        this.tmpMsgQueue = [];
    }

    /**
     * 自动清理垃圾函数
     * @returns {Promise<void>}
     */
    async autoCleanTmp() {
        const fullPath = path.resolve("./data");

        // 检查目录是否存在
        if (!fs.existsSync(fullPath)) {
            logger.error(`[R插件补集][Doubao自动清理临时文件] 目录不存在: ${fullPath}`);
            return;
        }

        // 读取目录内容
        fs.readdir(fullPath, (err, files) => {
            if (err) {
                logger.error(`[R插件补集][Doubao自动清理临时文件] 无法读取目录: ${fullPath}`, err);
                return;
            }

            // 筛选以 prefix 开头的文件
            const tmpFiles = files.filter(file => file.startsWith("tmp"));

            // 删除筛选到的文件
            tmpFiles.forEach(file => {
                const filePath = path.join(fullPath, file);
                fs.unlink(filePath, err => {
                    if (err) {
                        logger.error(`[R插件补集][Doubao自动清理临时文件] 删除文件失败: ${filePath}`, err);
                    } else {
                        logger.info(`[R插件补集][Doubao自动清理临时文件] 已删除: ${filePath}`);
                    }
                });
            });

            if (tmpFiles.length === 0) {
                logger.info(`[R插件补集][Doubao自动清理临时文件] 暂时没有清理的文件。`);
            }
        });
    }

    async downloadFile(url, outputPath) {
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            await fs.promises.writeFile(outputPath, response.data);
            logger.info(`文件已成功下载至 ${outputPath}`);
            return outputPath;
        } catch (error) {
            logger.error('无法下载文件:', error.message);
            throw error;
        }
    }

    async getReplyMsg(e) {
        const msgList = await e.bot.sendApi("get_group_msg_history", {
            "group_id": e.group_id,
            "count": 1
        });
        let msgId = msgList.data.messages[0]?.message[0]?.data.id;
        let msg = await e.bot.sendApi("get_msg", {
            "message_id": msgId
        });
        return msg.data;
    }

    /**
     * 清除临时消息
     * @returns {Promise<void>}
     */
    async clearTmpMsg(e) {
        if (this.tmpMsgQueue?.length > 0) {
            for (const tmpMsgId of this.tmpMsgQueue) {
                await e.bot.sendApi("delete_msg", { "message_id": tmpMsgId });
            }
        }
    }

    async extractFileExtension(filename) {
        // 使用正则表达式匹配文件名后缀
        const match = filename.match(/\.([a-zA-Z0-9]+)$/);
        return match ? match[1] : null;
    }

    /**
     * 自动获取文件的地址、后缀
     * @param e
     * @returns {Promise<*|string>}
     */
    async autoGetUrl(e) {
        if (e?.reply_id !== undefined) {
            let url, fileType, fileExt;
            // 获取回复消息
            const replyMsg = await this.getReplyMsg(e);
            // 交互告知用户等待
            const tmpMsg = await e.reply("正在上传引用，请稍候...", true);
            // 如果存在就暂时存放到队列
            if (tmpMsg?.data?.message_id) {
                this.tmpMsgQueue.push(tmpMsg.data.message_id);
            }
            // 获取消息数组
            const messages = replyMsg?.message;

            // 先尝试处理forward消息
            if (Array.isArray(messages)) {
                const forwardMessages = await this.handleForwardMsg(messages);
                if (forwardMessages[0].url !== "") {
                    return forwardMessages;
                }
            }

            let replyMessages = [];

            if (Array.isArray(messages) && messages.length > 0) {
                // 遍历消息数组寻找第一个有用的元素
                for (const msg of messages) {
                    fileType = msg.type;

                    if (fileType === "image") {
                        // 如果是图片，直接获取URL
                        url = msg.data?.url;
                        fileExt = msg.data?.file?.match(/\.(jpg|jpeg|png|gif|webp)(?=\.|$)/i)?.[1] || 'jpg';
                        replyMessages.push({
                            url,
                            fileExt,
                            fileType
                        });
                    } else if (fileType === "file") {
                        // 如果是文件，获取文件信息
                        const file_id = msg.data?.file_id;
                        const latestFileUrl = await e.bot.sendApi("get_group_file_url", {
                            "group_id": e.group_id,
                            "file_id": file_id
                        });
                        url = latestFileUrl.data.url;
                        fileExt = await this.extractFileExtension(msg.data?.file_id);
                        replyMessages.push({
                            url,
                            fileExt,
                            fileType
                        });
                    } else if (fileType === "video") {
                        // 如果是一个视频
                        url = msg.data?.path;
                        fileExt = await this.extractFileExtension(msg.data?.file_id);
                        replyMessages.push({
                            url,
                            fileExt,
                            fileType
                        });
                    } else if (fileType === "text") {
                        // 如果是一个文本
                        url = msg.data?.text;
                        replyMessages.push({
                            url,
                            fileExt: "",
                            fileType
                        });
                    }
                }
            }

            // 如果什么也匹配不到会返回：{ url: '', fileExt: undefined, fileType: 'text' }
            if (url === undefined && fileType === 'text') {
                // 获取文本数据到 url 变量
                url = messages?.[0].data?.text || messages?.[1].data?.text;
                replyMessages = [
                    {
                        url,
                        fileExt: "",
                        fileType
                    }
                ];
            }

            return replyMessages;
        }

        let replyMessages = [];
        // 这种情况是直接发送的
        const curMsg = await e.bot.sendApi("get_group_msg_history", {
            "group_id": e.group_id,
            "count": 1
        });
        const messages = curMsg.data.messages[0]?.message;
        for (const msg of messages) {
            if (msg.type === "image") {
                replyMessages.push({
                    url: msg.data?.url,
                    fileExt: await this.extractFileExtension(msg.data?.file_id),
                    fileType: "image"
                });
            }
            // 如果以后有其他文件再添加
        }
        return replyMessages;
    }

    /**
     * 处理合并转发消息
     * @param messages 消息数组
     * @returns {Promise<Array>} 返回处理后的消息数组
     */
    async handleForwardMsg(messages) {
        let forwardMessages = [];

        // 遍历消息数组寻找forward类型的消息
        for (const msg of messages) {
            if (msg.type === "forward") {
                // 获取转发消息的内容
                const forwardContent = msg.data?.content;

                if (Array.isArray(forwardContent)) {
                    // 遍历转发消息内容
                    for (const forwardMsg of forwardContent) {
                        const message = forwardMsg.message;

                        if (Array.isArray(message)) {
                            // 遍历每条消息的内容
                            for (const item of message) {
                                if (item.type === "image") {
                                    // 从file字段中提取真实的文件扩展名
                                    const fileExt = item.data?.file?.match(/\.(jpg|jpeg|png|gif|webp)(?=\.|$)/i)?.[1] || 'jpg';
                                    forwardMessages.push({
                                        url: item.data?.url,
                                        fileExt: fileExt.toLowerCase(),
                                        fileType: "image"
                                    });
                                } else if (item.type === "video") {
                                    forwardMessages.push({
                                        url: item.data?.path || item.data?.url,
                                        fileExt: await this.extractFileExtension(item.data?.file),
                                        fileType: "video"
                                    });
                                } else if (item.type === "text") {
                                    forwardMessages.push({
                                        url: item.data?.text,
                                        fileExt: "",
                                        fileType: "text"
                                    });
                                }
                            }
                        }
                    }
                    // 找到并处理完forward消息后直接返回
                    return forwardMessages;
                }
            }
        }

        // 如果没有找到forward消息,返回空数组
        return [{
            url: "",
            fileExt: "",
            fileType: ""
        }];
    }

    async chat(e) {
        // 检查消息是否包含 #gpt
        if (!e.msg.includes('#gpt')) {
            return false;
        }

        // 去除 #gpt 前缀，获取实际问题
        let query = e.msg.replace('#gpt', '').trim();

        // 如果查询为空，使用默认查询
        if (!query) {
            query = defaultQuery;
        }

        // 自动判断是否有引用文件和图片
        const replyMessages = await this.autoGetUrl(e);

        const collection = [];
        for (let [index, replyItem] of replyMessages.entries()) {
            const { url, fileExt, fileType } = replyItem;
            const downloadFileName = path.resolve(`./data/tmp${index}.${fileExt}`);
            if (fileType === "image") {
                await this.downloadFile(url, downloadFileName);
                collection.push({
                    downloadFileName,
                    fileType
                });
            } else if (fileType === "video" || fileType === "file") {
                await this.downloadFile(url, downloadFileName);
                collection.push({
                    downloadFileName,
                    fileType: "file"
                });
            } else if (fileType === "text") {
                query += `\n引用："${url}"`;
            }
        }

        if (collection.length > 0) {
            const completion = await this.fetchDoubao(query || defaultQuery, collection);
            // 这里统一处理撤回消息，表示已经处理完成
            await this.clearTmpMsg(e);
            await this.splitCompletion(e, completion);
            return;
        }

        const completion = await this.fetchDoubao(query);
        // 这里统一处理撤回消息，示已经处理完成
        await this.clearTmpMsg(e);
        await this.splitCompletion(e, completion);
        return true;
    }

    /**
     * 适配 free 系列的回答
     * @param e
     * @param completion
     * @returns {Promise<void>}
     */
    async splitCompletion(e, completion) {
        // 如果出现搜索再进一步划分
        const contentSplit = completion.split("搜索结果来自：");
        await e.reply(contentSplit[0], true);
        if (contentSplit?.[1] !== undefined) {
            await e.reply(Bot.makeForwardMsg(contentSplit[1]
                .trim()
                .split("\n")
                .map(item => {
                    return {
                        message: { type: "text", text: item || "" },
                        nickname: e.sender.card || e.user_id,
                        user_id: e.user_id,
                    };
                })));
        }
    }

    async fetchDoubao(query, collection = []) {
        const doubaoData = await Promise.all(collection.map(async item => {
            const { downloadFileName, fileType } = item;
            const base64 = await toBase64(downloadFileName);
            if (fileType === "image") {
                return {
                    type: "image_url",
                    image_url: {
                        url: base64,
                    }
                };
            } else {
                return {
                    type: "file",
                    file_url: {
                        url: base64,
                    }
                };
            }
        }));

        const completion = await fetch(this.baseURL + "/chat/completions", {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({
                model: this.model,
                messages: [
                    {
                        "role": "system",
                        "content": prompt
                    },
                    {
                        role: "user",
                        content: [
                            ...doubaoData,
                            {
                                type: "text",
                                text: query || defaultQuery,
                            }
                        ],
                    },
                ],
            }),
            timeout: 100000
        });
        return (await completion.json()).choices[0].message.content;
    }
}

/**
 * 转换路径图片为base64格式
 * @param {string} filePath - 图片路径
 * @returns {Promise<string>} Base64字符串
 */
async function toBase64(filePath) {
    try {
        const fileData = await fs.promises.readFile(filePath);
        const base64Data = fileData.toString('base64');
        return `data:${getMimeType(filePath)};base64,${base64Data}`;
    } catch (error) {
        logger.info(error);
    }
}

/**
 * 辅助函数：根据文件扩展名获取MIME类型
 * @param {string} filePath - 文件路径
 * @returns {string} MIME类型
 */
function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return mimeTypes[ext] || 'application/octet-stream';
}

const mimeTypes = {
    // Audio
    '.wav': 'audio/wav',
    '.mp3': 'audio/mp3',
    '.aiff': 'audio/aiff',
    '.aac': 'audio/aac',
    '.ogg': 'audio/ogg',
    '.flac': 'audio/flac',

    // Images
    '.png': 'image/png',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.webp': 'image/webp',
    '.heic': 'image/heic',
    '.heif': 'image/heif',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/vnd.microsoft.icon',
    '.tiff': 'image/tiff',

    // Videos
    '.mp4': 'video/mp4',
    '.mpeg': 'video/mpeg',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.flv': 'video/x-flv',
    '.mpg': 'video/mpg',
    '.webm': 'video/webm',
    '.wmv': 'video/x-ms-wmv',
    '.3gpp': 'video/3gpp',

    // Documents and others
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.htm': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript', // 或 'application/x-javascript'
    '.mjs': 'text/javascript', // 或 'application/x-javascript'
    '.json': 'application/json',
    '.md': 'text/md',
    '.csv': 'text/csv',
    '.xml': 'text/xml',
    '.rtf': 'text/rtf',
    '.zip': 'application/zip',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip',
    '.rar': 'application/vnd.rar',
    '.7z': 'application/x-7z-compressed',

    // Programming languages
    '.py': 'text/x-python', // 或 'application/x-python'
    '.java': 'text/x-java-source',
    '.c': 'text/x-c',
    '.cpp': 'text/x-c++src',
    '.php': 'application/x-php',
    '.sh': 'application/x-shellscript'
};