# 3D 作品集

用 AI 做的 3D 网页，每个作品都公开在线效果、提示词和完整代码。

在线查看：https://3d.dingxiaopi.com

## 目录

```text
works/<作品名>/
  index.html   作品本身，单文件，双击可打开
  prompt.md    生成作品用的提示词原文
  meta.json    标题、简介、提示词来源、后续调整
  cover.jpg    封面，1200×675
scripts/build.mjs  读取 works/，生成网站到 dist/
```

## 本地运行

需要 Node.js 和 Python 3，没有其他依赖。

```bash
npm run dev    # 打开 http://127.0.0.1:4323
```

推送到 `main` 后，GitHub Actions 会自动构建并发布到 GitHub Pages。

新增作品的规范见 [AGENTS.md](AGENTS.md)。

## 授权

- 代码（包括作品的 `index.html`）使用 [MIT](LICENSE) 协议。
- **提示词不在 MIT 范围内。** `works/*/prompt.md` 的权利归 `meta.json` 中注明的作者所有，转载或改编前请查看原文并联系作者。
