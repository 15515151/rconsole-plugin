import axios from "axios";
import moment from "moment"; // 引入 moment.js 来处理时间戳

/**
 * 公共的 User-Agent
 * @type {string}
 */
// User-Agent
const COMMON_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
// 撤回时间
const MESSAGE_RECALL_TIME = 10;

export class CheckCar extends plugin {
    constructor() {
        super({
            name: "验车",
            dsc: "验车",
            event: "message",
            priority: 1000,
            rule: [
                {
                    reg: '^#验车(.*?)',
                    fnc: 'yc'
                }
            ]
        })
    }

    async yc(e) {
        const tag = e.msg.replace(/#验车/g, "");

        // 使用时间戳生成 Referer
        const timestamp = moment().valueOf();
        const reqUrl = `https://whatslink.info/api/v1/link?url=${tag}`;
        const resp = await axios.get(reqUrl, {
            headers: {
                "User-Agent": COMMON_USER_AGENT,
                "Referer": `https://${timestamp}.whatslink.info/`
            }
        });
        if (!resp.data) {
            e.reply("没有找到相关磁力");
            return;
        }
        let msgRes = (await e.reply(`🧲 [香菜x R插件 x Mix] 联合为您验车：\n${resp.data.name}`)).message_id
        setTimeout(async () => {
            e?.isGroup ? await e.group.recallMsg(msgRes) : await e.friend.recallMsg(msgRes) 
        }, MESSAGE_RECALL_TIME * 1000);
        const screenshots = resp.data.screenshots.map(async item => {
            const screenshot = item.screenshot;
            try {
                const imageResp = await axios.get(screenshot, {
                    headers: {
                        "User-Agent": COMMON_USER_AGENT,
                        "Referer": `https://${timestamp}.whatslink.info/`
                    },
                    responseType: 'arraybuffer' // 设置响应类型为 arraybuffer 以便处理二进制数据
                });
                //trss 不知道转发多层嵌套
                return {
                    type: 'node',
                    data: {
                        nickname: this.e.sender.card || this.e.user_id,
                        user_id: this.e.user_id,
                        content: [
                            {
                                "type": "image",
                                "data": { 
                                    "file": `base64://${imageResp.data.toString('base64')}`
                                }
                            }
                        ]
                    }
                }  
            } catch (error) {
                console.error("Failed to fetch image:", error);
                return null;
            }
        });
        let msg_id
        const content = (await Promise.all(screenshots)).filter(Boolean); // 过滤掉失败的请求
        let data = {
            type: 'node',
            data: {
                nickname: this.e.sender.card || this.e.user_id,
                user_id: this.e.user_id,
                content
            }
        }
        if(e?.isGroup) {
            msg_id = await e.bot.sendApi("send_group_forward_msg", { group_id: e.group_id, messages: data });
        } else {
            msg_id = await e.bot.sendApi("send_private_forward_msg", { user_id: e.user_id, messages: data });
        }
        setTimeout(async () => {
            e?.isGroup ? await e.group.recallMsg(msg_id.data.message_id) : await e.friend.recallMsg(msg_id.data.message_id) 
        }, MESSAGE_RECALL_TIME * 1000);
        
    }
}