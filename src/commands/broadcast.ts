import { AppError } from "../types.js";

export interface BroadcastOptions {
    mediaId: string;
}

interface BroadcastResponse {
    errcode: number;
    errmsg: string;
    msg_id?: number;
    msg_data_id?: number;
}

interface AccessTokenResponse {
    access_token: string;
    expires_in: number;
    errcode?: number;
    errmsg?: string;
}

export async function broadcastCommand(options: BroadcastOptions) {
    const appId = process.env.WECHAT_APP_ID;
    const appSecret = process.env.WECHAT_APP_SECRET;

    if (!appId || !appSecret) {
        throw new AppError("缺少微信凭证。请设置环境变量 WECHAT_APP_ID 和 WECHAT_APP_SECRET", "AUTH_ERROR", undefined, 4);
    }

    const { mediaId } = options;

    const accessToken = await getAccessToken(appId, appSecret);

    const payload = {
        filter: { is_to_all: true },
        mpnews: { media_id: mediaId },
        msgtype: "mpnews",
        send_ignore_reprint: 0,
    };

    const url = `https://api.weixin.qq.com/cgi-bin/message/mass/sendall?access_token=${accessToken}`;
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = (await response.json()) as BroadcastResponse;

    if (data.errcode === 0) {
        return {
            ok: true as const,
            command: "broadcast" as const,
            media_id: mediaId,
            msg_id: data.msg_id || null,
            msg_data_id: data.msg_data_id || null,
        };
    } else {
        const tip = ERROR_TIPS[data.errcode];
        throw new AppError(`群发失败: ${data.errmsg}`, "BROADCAST_FAILED", { tip, errcode: data.errcode }, 5);
    }
}

async function getAccessToken(appId: string, appSecret: string): Promise<string> {
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
    const response = await fetch(url);
    const data = (await response.json()) as AccessTokenResponse;

    if (data.access_token) {
        return data.access_token;
    }

    throw new AppError(`获取 access_token 失败: ${data.errmsg || "未知错误"}`, "AUTH_ERROR", undefined, 4);
}

const ERROR_TIPS: Record<number, string> = {
    40001: "access_token 无效",
    40003: "Media ID 无效（可能已发布或不存在）",
    43004: "群发超过限制（订阅号每天1次，服务号每月4次）",
    45064: "群发消息正在处理中",
    45065: "群发消息失败",
    45066: "群发消息参数错误",
    45067: "文章内容违规",
};
