# Big Text 大字 · micro.blog 静态页插件

把 iOS 应用 [big-text](../big-text/) 的核心体验搬到 Web：输入一句话，全屏放大给别人看。
以 micro.blog plugin 的形式发布，安装后就是一个静态页面
`https://你的域名/bigtext/`，同时也是一个可安装、可离线的 PWA。

界面按 [Ferrari Design System](https://open-design.ai/plugins/design-system-ferrari/)
的语言设计：电影感黑底、法拉利红每屏只点一处、2px 直角、1px 描边环。

## 功能

- 输入 200 字以内的一句话，`X/200` 计数在 180 字后变红
- 全屏黑底白字，自动缩放到最大可容纳的字号
- 单击屏幕呼出「返回 / 闪烁」，双击屏幕直接切换闪烁提醒
- 显示期间屏幕常亮（Wake Lock API，需要 iOS 16.4+ / 主流桌面浏览器）
- 竖屏显示时提示「横过手机展示更清楚」
- 记住上次输入的内容，双语界面（跟随系统语言）
- `?text=一句话` 直接进入显示模式，可配合 iOS 快捷指令模拟「语音唤起」
- PWA：添加到主屏幕后全屏运行，离线可用

相对 iOS 版的取舍：不做摇一摇（改为双击屏幕）、不做触感反馈、不做 Siri 意图
（用快捷指令 + `?text=` 替代）。

## 目录结构

```text
plugin.json        micro.blog 插件清单（title / description / version）
static/bigtext/    可直接发布的完整应用（源码即产物，无构建步骤）
  index.html       唯一入口，编辑页 / 显示页都在这一页内
  styles.css       样式（Ferrari 风格：黑底 + 法拉利红点缀）
  app.js           交互逻辑：字号自适应、双击闪烁、Wake Lock、双语
  service-worker.js  离线缓存（network-first，联网时自动更新）
  manifest.webmanifest
  icons/           PWA 图标（取自 big-text 的 App Icon）
```

## 本地预览

```sh
python3 -m http.server 8765 --directory static
# 打开 http://localhost:8765/bigtext/
```

注意：必须通过 `/bigtext/` 子路径访问，模拟 Micro.blog 部署路径。

## 发布到 Micro.blog

1. 把本仓库推送到 GitHub。
2. 在 Micro.blog 的 Plug-ins 页面从 GitHub 安装本仓库。
3. 访问 `https://你的域名/bigtext/` 使用；`static/` 下的文件会原样发布。

所有资源都是相对路径，放在任何子路径下都能工作，无需服务器配置。
改了代码需要更新时：推送到 GitHub 后在 Micro.blog 里重新拉取插件即可；
如果页面行为没变，先把浏览器缓存/旧版 Service Worker 注销再试。

## 与 iOS 版的关系

iOS 原版见 [big-text](../big-text/) 仓库（SwiftUI，未上架）。
本插件覆盖其 v1.2 的全部核心交互，是绕开 Apple Developer 年费与审核的
发布途径。
