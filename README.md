# 稿舟 CLI

[![License](https://img.shields.io/github/license/LyleLiu666/wenyan-cli)](LICENSE)
[![Stars](https://img.shields.io/github/stars/LyleLiu666/wenyan-cli?style=social)](https://github.com/LyleLiu666/wenyan-cli)

> 面向自动化发布、脚本调用和 Agent 场景持续演化的 Markdown 排版与发布 CLI。

## 为什么改名

这个仓库最初基于 `caol64/wenyan-cli` 演化而来，但后续路线已经明显分开：

- 更强调非交互调用、CI、定时任务和 Agent 场景
- 更强调结构化 JSON 输出和可脚本化行为
- 更强调 Client-Server 发布链路

为了避免继续和上游官方 CLI 混淆，这个分支现在使用新的项目名和命令名：

- 项目名：`稿舟 CLI`
- CLI 命令：`gaozhou`
- 服务自报名称：`gaozhou-cli`

> 说明：仓库的 GitHub 路径目前仍然是 `wenyan-cli`，这是仓库地址层面的历史包袱，不代表产品名继续沿用旧品牌。

## 项目定位

稿舟 CLI 适合这些场景：

- 本地把 Markdown 排版成适合公众号的 HTML
- 在脚本、CI、定时任务里稳定调用发布流程
- 把发布能力部署到固定 IP 的 Server，再由本地客户端远程调用
- 给 Agent、自动化平台和非交互流程提供结构化输出

## 安装

当前仓库**只提供源码编译使用方式**，不提供 npm 安装包，也不再维护 npm 发布流程；同时不再推荐通过 Git URL 直接全局安装。

使用方式如下：

```bash
git clone https://github.com/LyleLiu666/wenyan-cli.git
cd wenyan-cli
pnpm install
pnpm build
npm link
```

安装后可直接使用：

```bash
gaozhou --help
```

## 基本用法

```bash
gaozhou <command> [options]
```

当前主要子命令：

- `publish` 排版并发布到公众号草稿箱
- `render` 只渲染，不发布
- `theme` 主题管理
- `broadcast` 群发已发布文章
- `serve` 启动远程发布服务

## 常见命令

### 渲染本地 Markdown

```bash
gaozhou render -f ./example.md -t paper-ink
```

### 发布本地 Markdown

```bash
gaozhou publish -f ./example.md -t forest-notes --no-mac-style
```

### 发布前只做预检

```bash
gaozhou publish -f ./example.md --preflight
```

### 通过远程 Server 发布

```bash
gaozhou publish -f ./example.md -t sunset-magazine \
  --server http://localhost:3000 \
  --api-key "my-secret-key"
```

### 启动服务端

```bash
gaozhou serve --port 3000 --api-key "my-secret-key"
```

## 主题

### 查看所有主题

```bash
gaozhou theme -l
```

`theme -l` 现在会分三组展示：

- `内置主题（core）`：来自 `@wenyan-md/core`
- `扩展主题（稿舟）`：这个仓库自带的新主题
- `自定义主题`：你自己安装的主题

### 稿舟自带扩展主题

除了 core 自带主题之外，当前仓库额外提供了这些主题（目前共 18 个扩展主题）：

- `paper-ink`
- `forest-notes`
- `sunset-magazine`
- `midnight-code`
- `lotus-breeze`
- `amber-ledger`
- `ocean-journal`
- `graphite-letter`
- `aurora-slate`
- `bamboo-brief`
- `cocoa-paper`
- `dune-notebook`
- `mist-ledger`
- `maple-editorial`
- `jade-manuscript`
- `steel-column`
- `peach-study`
- `starlight-ledger`

这些主题开箱即用，不需要额外下载。

### 添加自定义主题

```bash
gaozhou theme --add --name my-theme --path ./my-theme.css
```

也支持从远程 CSS 安装：

```bash
gaozhou theme --add --name my-theme --path https://example.com/my-theme.css
```

### 删除自定义主题

```bash
gaozhou theme --rm my-theme
```

> `core` 内置主题和 `稿舟` 扩展主题都属于受保护主题，不能删除。

## 输入规则

`publish` 和 `render` 支持三种输入来源，但一次只能用一种：

- 直接传入字符串参数
- `--file <path>` 读取本地文件
- 从 `stdin` 管道读取

优先级和行为：

- 如果同时传 `input-content` 和 `--file`，命令会直接报错
- 如果传了 `--file`，不会再等待 `stdin`
- 默认 `stdout` 输出结构化 JSON，过程日志写到 `stderr`

## 图片与封面处理

无论本地模式还是远程 `--server` 模式，稿舟 CLI 都支持：

- 本地绝对路径图片
- 当前目录相对路径图片
- 网络图片
- `frontmatter` 中的 `cover`
- `cover` 缺失时，自动回退到正文第一张图

只有在没有 `cover`，并且正文中也没有任何图片时，发布才会失败。

## 环境变量

实际发布到微信公众号时，需要在执行环境里提供：

- `WECHAT_APP_ID`
- `WECHAT_APP_SECRET`

临时使用：

```bash
WECHAT_APP_ID=xxx WECHAT_APP_SECRET=yyy gaozhou publish -f ./example.md
```

## Server 模式

如果本地机器没有稳定公网 IP，可以把发布能力部署到一台固定 IP 的服务器上：

1. 在服务器上运行 `gaozhou serve`
2. 在本地执行 `gaozhou publish --server ...`
3. 本地客户端会自动上传 Markdown 和本地图片，再由服务端完成发布

详细接口说明见：[docs/server.md](docs/server.md)

## 致谢

稿舟 CLI 继承了上游 `caol64/wenyan-cli` 和 `@wenyan-md/core` 的基础能力与早期思路。这个仓库现在已经进入独立演化阶段，但仍然感谢上游项目在排版和发布能力上的开创工作。
