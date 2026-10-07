# Big Text 大字

**Big Text** turns any phone, tablet, or browser into a simple full-screen message board. Type something, tap **Show**, and the text automatically grows to the largest size that fits the current screen.

一个极简的全屏大字工具：输入文字，点击「显示」，Big Text 会根据当前可用屏幕空间自动放到尽可能大。

Big Text is distributed as a Micro.blog plug-in and also works as an installable, offline-capable PWA.

## Features

- No product-level character limit; the editor shows a live character count
- Automatically fits text to the available display area
- Re-fits after phone/tablet rotation, iPad Split View, and other viewport changes
- Keeps a dynamic safe margin around displayed text
- One-tap **Clear**
- Keyboard-aware editor layout on iPhone and iPad
- Single-tap display controls and double-tap flash
- Screen Wake Lock when supported by the browser
- Remembers the last typed text and selected theme locally
- Chinese or English UI based on the browser language
- Six high-contrast themes plus a random theme
- Installable PWA with offline support
- Optional `?text=...` deep link that opens directly in display mode

After installation, Big Text is available at:

```text
https://your-domain.example/bigtext/
```

## Install

### Micro.blog Plug-in Directory

Once published in the Micro.blog Plug-in Directory:

1. Open **Plug-ins** in Micro.blog.
2. Find **Big Text 大字**.
3. Choose your blog and install it.
4. Open `/bigtext/` on your blog.

### Install from GitHub

During development or before directory publication, install the public repository directly from Micro.blog's plug-in interface:

```text
https://github.com/puran1218/big-text-mb
```

When testing a newer commit from GitHub, use Micro.blog's **Pull from GitHub** action and rebuild the blog.

## Use

Type any text and tap **Show**. Big Text will fit the complete text into the current display area. More text means a smaller final font size; larger screens such as iPad can naturally show more.

On the display screen:

- tap once to show or hide **Back / Flash**
- double-tap to toggle flash
- rotate or resize the device and the text will re-fit automatically

To clear the saved text, use **Clear** in the editor.

### Deep link

You can open Big Text with pre-filled content:

```text
/bigtext/?text=Meet%20me%20here
```

The `text` parameter is removed from the address bar after the app reads it.

Do not use the URL form for sensitive content: the query string is part of the initial HTTP request and may be present in server or browser logs before Big Text removes it. Regular text typed into the editor is not sent to a Big Text backend.

## Themes

| Theme | Display |
|---|---|
| Classic / 经典黑白 | Black background, white text |
| Paper / 反色 | White background, dark text |
| Lime / 青柠 | Dark background, bright lime text |
| Jade / 翡翠 | Dark background, jade text |
| Amber / 琥珀 | Dark background, warm amber text |
| Cobalt / 钴蓝 | Cobalt blue background, white text |
| Random / 随机 | Chooses a different display theme when entering Show mode |

The palettes are screen-oriented RGB colors. Theme names describe the visual direction and do not claim to represent official Pantone digital colors or numbering.

## Privacy

Big Text has no analytics and no application backend.

- Text typed in the editor is stored in the browser's local storage so it can be restored next time.
- Theme preference is also stored locally.
- **Clear** removes the saved text.
- Deep-link text in `?text=` is removed from the visible URL after loading, and Big Text does not cache query-bearing navigation URLs in its Service Worker.
- The initial URL request itself is still visible to the hosting server, so URL deep links should not contain sensitive information.

## PWA and offline behavior

The plug-in ships a Web App Manifest and Service Worker. Static application assets are cached for offline use. Navigation responses are cached under the canonical `/bigtext/` app-shell URL rather than under URLs containing query strings.

## Development

There is no build step. Everything under `static/bigtext/` is published as-is.

```text
plugin.json
static/bigtext/
  index.html
  styles.css
  app.js
  service-worker.js
  manifest.webmanifest
  icons/
```

Run locally:

```sh
python3 -m http.server 8765 --directory static
```

Then open:

```text
http://localhost:8765/bigtext/
```

Use the `/bigtext/` path so local testing matches the Micro.blog deployment shape.

## Releasing

See [RELEASING.md](RELEASING.md) for the release checklist. User-visible changes are summarized in [CHANGELOG.md](CHANGELOG.md).

## License

A license has not been selected yet. Add one before publishing to the wider community if you want to explicitly grant reuse and redistribution rights.
