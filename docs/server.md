# 稿舟 CLI Server 模式文档

`gaozhou serve` 会启动一个轻量 HTTP 服务，把“排版 + 图片上传 + 发布到公众号”的能力集中到固定 IP 机器上。这样本地客户端只需要负责准备内容和发起请求。

## 健康检查

```bash
curl http://localhost:3000/health
```

成功时会返回类似结果：

```json
{
  "status": "ok",
  "service": "gaozhou-cli",
  "version": "1.0.11"
}
```

## 鉴权

如果启动时传入了 `--api-key`，后续所有上传和发布请求都要带上：

```http
x-api-key: your-api-key
```

## 上传接口

支持上传 Markdown 文件和图片文件。服务端会把文件暂存到临时目录，默认 10 分钟后自动回收。

```bash
curl -X POST http://localhost:3000/upload \
  -H "x-api-key: my-secret-key" \
  -F "file=@/path/to/article.md"
```

响应示例：

```json
{
  "success": true,
  "data": {
    "fileId": "550e8400-e29b-41d4-a716-446655440000.md",
    "originalFilename": "article.md",
    "mimetype": "text/markdown",
    "size": 1024
  }
}
```

## 发布接口

拿到上传阶段返回的 `fileId` 后，再调用 `/publish` 完成真正发布。

```bash
curl -X POST http://localhost:3000/publish \
  -H "x-api-key: my-secret-key" \
  -H "Content-Type: application/json" \
  -d '{
    "fileId": "550e8400-e29b-41d4-a716-446655440000.md",
    "theme": "paper-ink",
    "highlight": "solarized-light",
    "macStyle": true,
    "footnote": true
  }'
```

## 客户端调用建议

通常不需要你自己手写 `/upload` 和 `/publish` 调用。更常见的方式是直接在本地运行：

```bash
gaozhou publish -f ./article.md --server http://localhost:3000 --api-key "my-secret-key"
```

CLI 会自动完成这些动作：

1. 读取 Markdown
2. 扫描本地图片
3. 上传 Markdown 和图片到服务端
4. 请求服务端发布

## 错误处理

服务端错误会返回统一结构：

```json
{
  "code": -1,
  "desc": "具体错误信息"
}
```

常见失败原因：

- `fileId` 不存在或已经过期
- 上传了不支持的文件类型
- `x-api-key` 不正确
- 微信公众号环境变量没有配置好
- 文章缺少必要元数据，比如标题或封面
