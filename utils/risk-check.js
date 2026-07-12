import axios from "axios";
import { NOBLACK_CHECK_API } from "../constants/tools.js";

// 默认命中即拦截的风险等级（不区分大小写匹配）
const DEFAULT_BLOCK_LEVELS = ["bilibili", "Medium", "High"];

/**
 * 将配置里的拦截等级（数组或逗号分隔字符串）归一化为小写数组。
 * @param {string[]|string} levels
 * @returns {string[]}
 */
function normalizeBlockLevels(levels) {
    let list = levels;
    if (typeof levels === "string") {
        list = levels.split(/[,，]/);
    }
    if (!Array.isArray(list)) {
        list = DEFAULT_BLOCK_LEVELS;
    }
    const normalized = list
        .map(item => String(item).trim().toLowerCase())
        .filter(Boolean);
    return normalized.length > 0 ? normalized : DEFAULT_BLOCK_LEVELS.map(l => l.toLowerCase());
}

/**
 * 解析前置风险检测。
 * 将标题/简介/标签/UP主等信息拼接后送敏感词检测接口，命中拦截等级则要求终止解析。
 *
 * 严格约束：remarks 字段仅用于服务端日志，绝不返回给上层用于拼接用户回复。
 *
 * @param {Object} info
 * @param {string} [info.title] 标题
 * @param {string} [info.desc] 简介
 * @param {string[]|string} [info.tags] 标签
 * @param {string} [info.author] UP主/作者名
 * @param {Object} [options]
 * @param {boolean} [options.enable=true] 是否开启检测；关闭时直接放行
 * @param {string} [options.api] 检测接口地址；缺省用内置常量
 * @param {string[]|string} [options.blockLevels] 命中即拦截的等级；缺省用默认等级
 * @returns {Promise<{ blocked: boolean, hitLevels: string[] }>}
 *          blocked 为 true 表示命中拦截等级、应终止解析；hitLevels 为命中的拦截等级（供提示，不含 remarks）。
 */
export async function checkParseRisk(info = {}, options = {}) {
    // 开关：未开启直接放行
    if (options.enable === false) {
        return { blocked: false, hitLevels: [] };
    }

    const api = options.api || NOBLACK_CHECK_API;
    const blockLevels = normalizeBlockLevels(options.blockLevels);

    // 拼接待检测文本
    const tagText = Array.isArray(info.tags) ? info.tags.join(" ") : (info.tags || "");
    const text = [info.title, info.desc, tagText, info.author]
        .filter(Boolean)
        .join("\n")
        .trim();

    // 无内容可检测，直接放行
    if (!text) {
        return { blocked: false, hitLevels: [] };
    }

    try {
        const resp = await axios.post(api, { text }, {
            headers: { "Content-Type": "application/json" },
            timeout: 5000,
        });

        const data = resp?.data?.data;
        const matches = Array.isArray(data?.matches) ? data.matches : [];
        if (matches.length === 0) {
            return { blocked: false, hitLevels: [] };
        }

        const hitLevels = new Set();
        for (const match of matches) {
            const levels = Array.isArray(match?.levels) ? match.levels : [];
            for (const level of levels) {
                if (blockLevels.includes(String(level).toLowerCase())) {
                    hitLevels.add(level);
                }
            }
            // remarks 仅打印到控制台日志，绝不外泄给用户
            const remarks = Array.isArray(match?.remarks) ? match.remarks : [];
            if (remarks.length > 0) {
                logger.warn(`[R插件][风险检测] 命中「${match?.word}」等级[${(match?.levels || []).join(",")}] 备注：${remarks.join(" / ")}`);
            }
        }

        const blocked = hitLevels.size > 0;
        if (blocked) {
            logger.warn(`[R插件][风险检测] 命中拦截等级 [${[...hitLevels].join(",")}]，终止解析`);
        }
        return { blocked, hitLevels: [...hitLevels] };
    } catch (err) {
        // 检测服务异常时不阻断正常解析（fail-open）
        logger.warn(`[R插件][风险检测] 检测接口请求失败，跳过风险检测：${err.message}`);
        return { blocked: false, hitLevels: [] };
    }
}
