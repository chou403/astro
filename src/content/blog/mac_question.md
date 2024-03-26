---
author: chou401
pubDatetime: 2024-03-22T11:13:59.000Z
modDatetime:
title: Mac
featured: false
draft: false
tags:
  - Mac
description: Mac 碰到的问题
---

## Table of contents

## Mac 的 Launchpad 应用图标重复

1. **重新启动**: 首先尝试简单的重新启动 Mac。有时候这样可以清除临时的缓存问题。

2. **重置 Launchpad**: 可以通过以下步骤重置 Launchpad：

   - 打开终端应用（在应用程序文件夹的实用工具文件夹中找到）。

   - 输入以下命令并按回车键执行：

   - ```javascript
       defaults write com.apple.dock ResetLaunchPad -bool true; killall Dock
     ```

   这将会重置 Launchpad 并重新加载 Dock。

3. **清除缓存**: 尝试清除 Launchpad 缓存。在终端中输入以下命令：

   ```javascript
   rm ~/Library/Application\ Support/Dock/*.db; killall Dock
   ```

   这将会删除 Launchpad 缓存文件并重新加载 Dock。

4. **重新安装应用**: 如果以上方法都没有解决问题，可以尝试重新安装那些显示重复图标的应用程序。首先从 Launchpad 中删除重复的图标，然后前往 App Store 或者官方网站重新下载并安装这些应用。

5. **重建权限**: 使用磁盘工具重建权限可能也会有所帮助。打开“磁盘工具”，选择你的硬盘，点击“修复权限”。

6. **更新 macOS**: 确保你的 macOS 是最新版本。有时候一些系统级的问题会在更新后得到解决。
