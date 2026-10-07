# Big Text 大字 · micro.blog 静态页插件

一个极简的全屏大字工具：输入文字，Big Text 会根据当前屏幕空间自动把内容放到尽可能大，适合隔着距离给别人看。

以 micro.blog plugin 的形式发布，安装后访问：

`https://你的域名/bigtext/`

同时也是一个可安装、可离线使用的 PWA。

## 功能

- 输入任意长度的文字，不做产品层面的字符数硬截断；编辑页只显示当前字符数
- 全屏显示，并根据当前可用空间自动寻找尽可能大的字号
- 手机、iPad、横竖屏、Split View 等尺寸变化后自动重新 fitting
- 显示页预留动态安全边距，避免文字贴边或进入刘海 / Home Indicator 区域
- 输入内容可一键清除
- 软件键盘打开时压缩编辑布局，让 Show 更容易保持在可见区域；点击 Show 会直接进入显示页并收起键盘
- 单击显示页呼出「返回 / 闪烁」，双击直接切换闪烁提醒
- 显示期间请求屏幕常亮（浏览器支持 Wake Lock API 时）
- 记住上次输入的内容，界面跟随系统语言
- `?text=文字` 可直接进入显示模式；读取后会从地址栏移除 `text` 参数
- 6 个高对比显示主题 + 随机主题
- PWA：添加到主屏幕后可独立运行，离线可用

## 主题

编辑页底部的色块是主题选择器，选择会保存在浏览器本地，编辑页和显示页同步换肤。

| 主题 | 效果 |
|---|---|
| Classic / 经典黑白 | 黑底白字，红色强调 |
| Paper / 反色 | 白底黑字，适合明亮环境 |
| Lime / 青柠 | 深色背景 + 黄绿色高亮 |
| Jade / 翡翠 | 深色背景 + 青绿色 |
| Amber / 琥珀 | 深色背景 + 暖琥珀色 |
| Cobalt / 钴蓝 | 高纯度蓝底 + 白字 |
| Random / 随机 | 每次进入显示页随机选择，并避免连续重复 |

这些颜色是面向屏幕显示独立调校的 RGB 配色。命名用于描述视觉方向，不代表或声称对应 Pantone 官方数字色库或编号。

实现约束：

- 每个主题由 `styles.css` 中 `:root[data-theme="…"]` 的 CSS 变量定义
- JS 只负责切换 `data-theme` 和浏览器 `theme-color / color-scheme`
- 字号 fitting 只由显示区域几何尺寸决定，主题变化不改变布局算法
- 改动离线资源后同步提升 `service-worker.js` 的 `CACHE_NAME`

## Responsive 行为

Big Text 使用当前可见 viewport 而不是固定设备尺寸来布局：

- 显示页通过容器尺寸、Visual Viewport 和方向变化重新计算字号
- iPad 和更宽屏幕会获得更宽、更高的输入区域
- 软件键盘出现时编辑页自动进入紧凑模式
- 主题色块保留较小的视觉尺寸，但提供更大的触摸区域

## 目录结构

```text
plugin.json          micro.blog 插件清单
static/bigtext/      可直接发布的完整应用（源码即产物，无构建步骤）
  index.html         编辑页 / 显示页 / 主题选择器
  styles.css         响应式布局与主题 token
  app.js             字号 fitting、交互、主题、Wake Lock、双语与 viewport 处理
  service-worker.js  离线缓存
  manifest.webmanifest
  icons/             PWA 图标
```

## 本地预览

```sh
python3 -m http.server 8765 --directory static
# 打开 http://localhost:8765/bigtext/
```

必须通过 `/bigtext/` 子路径访问，以模拟 micro.blog 的部署路径。

## 发布到 micro.blog

1. 把本仓库推送到 GitHub。
2. 在 micro.blog 的 Plug-ins 页面安装本仓库。
3. 访问 `https://你的域名/bigtext/`。

所有资源使用相对路径，因此可以随插件一起发布到子路径。更新代码后如果页面仍表现为旧版本，先确认 micro.blog 已重新拉取插件；Service Worker 的缓存版本也应随资源变更一起更新。
