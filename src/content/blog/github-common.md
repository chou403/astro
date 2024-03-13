---
author: chou401
pubDatetime: 2024-02-28T10:49:59.000Z
modDatetime: 2024-03-13T12:06:11Z
title: Github
featured: false
draft: false
tags:
  - github
description: github 通用的使用方式
---

## Table of contents

## 创建和使用图床

github 创建新的仓库作为我们图床的服务器存储。

### 生成 token 令牌

![202402281052340.png](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/img/202402281052340.png)

![202402281054250.png](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/img/202402281054250.png)

![202402281055005.png](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/img/202402281055005.png)

然后可以给令牌做个 note，然后选择令牌截止时间，也可以永久。
repo 全部选上即可，选择创建。
这个 token 就是服务器（账号下的 github 服务器）的令牌，暂时和仓库还没有什么关系。
然后创建完之后，就会出现一串 token 字符串，把这个 token 复制，存储下来，因为一会就看不到了。

### 使用 PicGo 来进行图片上传

<https://mirrors.sdu.edu.cn/github-release/Molunerfinn_PicGo/v2.3.1/>
进入上述连接，选择对应安装下载。

选择图床设置->Github

> 配置仓库地址、分支名、AccessToken 等基础信息。
>
> 仓库名：GitHub用户名/GitHub仓库地址
>
> 分支名：GitHub的分支名称
>
> 自定义域名：<https://cdn.jsdelivr.net/gh/用户名/仓库名> e.g: <https://cdn.jsdelivr.net/gh/chou401/pic-md@master/>

![202402281109435.png](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/img/202402281109435.png)

### jsDelivr

官网：<https://www.jsdelivr.com/>

jsDelivr是一个免费、开源、不限带宽的CDN公共库，由Cloudflare、Fastly、StackPath、QUANTIL等CDN供应商提供了全球超过750个CDN节点，包括大陆数百个节点，可加速访问托管仓库内 [主要三种:NPM \ WordPress \ Github] 的静态资源，提升网站访问速度。
