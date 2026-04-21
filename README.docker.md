# 稿舟 CLI Docker 使用说明

这个仓库的 Docker 镜像现在默认基于**当前源码仓库本身**构建，不再直接拉取上游官方 `wenyan` CLI。

> 说明：当前项目只提供源码编译使用方式；如果你要用 Docker，也是在本仓库源码基础上自己构建镜像。

## 构建镜像

在仓库根目录执行：

```bash
docker build -t gaozhou-cli:local .
```

## 查看帮助

```bash
docker run --rm gaozhou-cli:local --help
```

## 渲染文章

```bash
docker run --rm \
  -e HOST_FILE_PATH=$(pwd) \
  -v $(pwd):/mnt/host-downloads \
  gaozhou-cli:local \
  render -f ./article.md -t paper-ink
```

## 发布文章

```bash
docker run --rm \
  --env-file .env \
  -e HOST_FILE_PATH=$(pwd) \
  -v $(pwd):/mnt/host-downloads \
  gaozhou-cli:local \
  publish -f ./article.md -t forest-notes
```

## 常用说明

- 镜像入口会直接执行当前仓库编译后的 CLI
- 主机路径通过 `HOST_FILE_PATH` 和 `/mnt/host-downloads` 做映射
- Markdown 里的本地图片路径会按主机路径去解析
- 容器里默认命令等价于直接运行 `gaozhou`

## 环境变量

发布到公众号时仍然需要：

```env
WECHAT_APP_ID=xxx
WECHAT_APP_SECRET=yyy
```

## Server 模式

```bash
docker run -d --name gaozhou-server \
  -p 3000:3000 \
  --env-file .env \
  gaozhou-cli:local \
  serve --port 3000 --api-key "my-secret-key"
```

健康检查：

```bash
curl http://localhost:3000/health
```

## 便捷别名

如果你经常用 Docker 方式调用，可以在本机 shell 里加一个别名：

```bash
alias gaozhou='docker run --rm \
  -e HOST_FILE_PATH=$(pwd) \
  -v $(pwd):/mnt/host-downloads \
  gaozhou-cli:local'
```

之后就可以像本地命令一样使用：

```bash
gaozhou publish -f ./article.md
```
