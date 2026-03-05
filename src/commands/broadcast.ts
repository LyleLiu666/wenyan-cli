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

export async function broadcastCommand(options: BroadcastOptions): Promise<void> {
    const appId = process.env.WECHAT_APP_ID;
    const appSecret = process.env.WECHAT_APP_SECRET;

    if (!appId || !appSecret) {
        throw new AppError("缺少微信凭证。请设置环境变量 WECHAT_APP_ID 和 WECHAT_APP_SECRET");
    }

    const { mediaId } = options;

    console.log(`📣 准备群发文章...`);
    console.log(`   Media ID: ${mediaId}`);
    console.log(`   App ID: ${appId}`);
    console.log();

    const accessToken = await getAccessToken(appId, appSecret);
    console.log(`✅ access_token 获取成功`);
    console.log();

    console.log(`⚠️  警告：群发后将推送给所有粉丝，无法撤回！`);
    console.log(`   - 服务号每月只能群发 4 次`);
    console.log(`   - 订阅号每天只能群发 1 次`);
    console.log();

    const payload = {
        filter: { is_to_all: true },
        mpnews: { media_id: mediaId },
        msgtype: "mpnews",
        send_ignore_reprint: 0,
    };

    console.log(`📤 正在发送群发请求...`);

    const url = `https://api.weixin.qq.com/cgi-bin/message/mass/sendall?access_token=${accessToken}`;
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = (await response.json()) as BroadcastResponse;

    console.log();
    if (data.errcode === 0) {
        console.log(`✅ 群发成功！`);
        console.log(`📱 粉丝将收到推送通知`);
        console.log(`消息 ID: ${data.msg_id}`);
        if (data.msg_data_id) {
            console.log(`消息数据 ID: ${data.msg_data_id}`);
        }
    } else {
        console.log(`❌ 群发失败！`);
        console.log(`错误码: ${data.errcode}`);
        console.log(`错误信息: ${data.errmsg}`);

        const tip = ERROR_TIPS[data.errcode];
        if (tip) {
            console.log(`提示: ${tip}`);
        }

        throw new AppError(`群发失败: ${data.errmsg}`);
    }
}

async function getAccessToken(appId: string, appSecret: string): Promise<string> {
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
    const response = await fetch(url);
    const data = (await response.json()) as AccessTokenResponse;

    if (data.access_token) {
        return data.access_token;
    }

    throw new AppError(`获取 access_token 失败: ${data.errmsg || "未知错误"}`);
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
