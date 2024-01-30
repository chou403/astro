# 介绍

依赖于 [AstroPaper]（https://github.com/satnaing/astro-paper） 模版创建 Blog 记录相关内容。

## 项目结构

```bash
/
├── public/
│   ├── assets/
│   │   └── logo.svg
│   │   └── logo.png
│   └── favicon.svg
│   └── astropaper-og.jpg
│   └── robots.txt
│   └── toggle-theme.js
├── src/
│   ├── assets/
│   │   └── socialIcons.ts
│   ├── components/
│   ├── content/
│   │   |  blog/
│   │   |    └── some-blog-posts.md
│   │   └── config.ts
│   ├── layouts/
│   └── pages/
│   └── styles/
│   └── utils/
│   └── config.ts
│   └── types.ts
└── package.json
```

Astro 在 src/pages/ 目录中查找 '.astro' 或 '.md' 文件。每个页面都根据其文件名公开为路由。

任何静态资产（如图像）都可以放在“public/”目录中。

所有博客文章都存储在“src/content/blog”目录中。

## 文档

文档可以以两种格式阅读：\_ _markdown_ 和 _blog post_。

- 配置 - [markdown]（src/content/init-blog/how-to-configure-astropaper-theme.md） |[博客文章]（https://astro-paper.pages.dev/posts/how-to-configure-astropaper-theme/）
- 添加帖子 - [markdown]（src/content/init-blog/adding-new-post.md） |[博客文章]（https://astro-paper.pages.dev/posts/adding-new-posts-in-astropaper-theme/）
- 自定义配色方案 - [markdown]（src/content/init-blog/customizing-astropaper-theme-color-schemes.md） |[博客文章]（https://astro-paper.pages.dev/posts/customizing-astropaper-theme-color-schemes/）
- 预定义配色方案 - [markdown]（src/content/init-blog/predefined-color-schemes.md） |[博客文章]（https://astro-paper.pages.dev/posts/predefined-color-schemes/）

> 对于 AstroPaper v1，请查看 [this branch]（https://github.com/satnaing/astro-paper/tree/astro-paper-v1） 和 [live URL]（https://astro-paper-v1.astro-paper.pages.dev/）

## 技术栈

**主框架** - [Astro]（https://astro.build/）
**类型检查** - [TypeScript]（https://www.typescriptlang.org/）
**组件框架** - [ReactJS]（https://reactjs.org/）
**样式** - [TailwindCSS]（https://tailwindcss.com/）
**UI/UX** - [Figma]（https://figma.com）
**模糊搜索** - [FuseJS]（https://fusejs.io/）
**图标** - [Boxicons]（https://boxicons.com/） |[表格]（https://tabler-icons.io/）
**代码格式** - [Prettier]（https://prettier.io/）
**部署** - [Cloudflare Pages]（https://pages.cloudflare.com/）
**关于页面中的插图** - [https://freesvgillustration.com]（https://freesvgillustration.com/）
**Linting** - [ESLint]（https://eslint.org）

## 本地运行

在本地运行此项目的最简单方法是在所需的目录中运行以下命令。

```bash

git clone git@github.com:chou401/astro.git

npm i

npm run dev

```

## 命令

所有命令均从项目的根目录,终端运行:

> **_注意!_** 对于 Docker 命令必须 [已安装](https://docs.docker.com/engine/install/) 在您的机器中。

| 命令                                 | 行动                                                                                                             |
| :----------------------------------- | :--------------------------------------------------------------------------------------------------------------- |
| `npm install`                        | 安装依赖项                                                                                                       |
| `npm run dev`                        | 在启动本地开发服务器 `localhost:4321`                                                                            |
| `npm run build`                      | 创建 `./dist/`                                                                                                   |
| `npm run preview`                    | 部署之前,请在本地预览构建                                                                                        |
| `npm run format:check`               | 使用Prettier检查代码格式                                                                                         |
| `npm run format`                     | 使用更漂亮的格式代码                                                                                             |
| `npm run sync`                       | 为所有Astro模块生成TypeScript类型。 [了解更多](https://docs.astro.build/en/reference/cli-reference/#astro-sync). |
| `npm run cz`                         | 使用commitizen提交代码更改                                                                                       |
| `npm run lint`                       | ESLint                                                                                                           |
| `docker compose up -d`               | 运行在 docker 上面，可以使用同样的主机名和端口进行访问 `dev` 命令.                                               |
| `docker compose run app npm install` | 可以在 docker 容器里运行任何命令.                                                                                |
