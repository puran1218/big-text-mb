# Releasing Big Text

Use this checklist for a Micro.blog community release.

## 1. Final device test

Test the release candidate from a real Micro.blog installation, not only a local browser.

Minimum matrix:

- iPhone portrait: type, Clear, Show, Back
- iPhone portrait → landscape → portrait while showing text
- iPad portrait with software keyboard open: the input box and caret remain visible before and during typing; tap Show without manually dismissing the keyboard
- iPhone portrait: focus an empty textarea, type, clear, dismiss and reopen the keyboard without the editor jumping out of view
- Portrait display: the landscape suggestion disappears after about 2.5 seconds, and does not reappear until entering the display again or rotating back from landscape
- iPad landscape
- iPad Split View or a narrow resized browser window
- long text well beyond 200 characters
- each display theme
- double-tap Flash and single-tap controls
- `?text=...` launch
- offline launch after the page has been loaded once

## 2. Check release metadata

- Confirm `plugin.json` title and description are user-facing and concise.
- Increment `plugin.json.version` for every public release.
- Use patch versions for fixes, minor versions for features, and major versions for breaking changes.
- Move the matching entry in `CHANGELOG.md` from **Unreleased** to the release date.

## 3. Check offline cache changes

If any published file under `static/bigtext/` changed, increment `CACHE_NAME` in:

```text
static/bigtext/service-worker.js
```

This ensures installed PWAs do not remain on an older application shell.

## 4. Pull into Micro.blog

After pushing or merging the release candidate:

1. Open the installed plug-in in Micro.blog.
2. Use **Pull from GitHub**.
3. Rebuild/publish the blog.
4. Verify `/bigtext/` from the public site on real devices.

If the old UI still appears, fully close the installed PWA/browser tab and open it again before deeper debugging.

## 5. Community release

Before submitting broadly:

- Choose and add an explicit open-source license if redistribution/reuse should be permitted.
- Make sure the public GitHub repository README reflects the current release.
- Confirm there are no development-only URLs, private data, or credentials.
- Confirm the default experience works without configuration.

Submit the public repository to the Micro.blog Plug-in Directory:

https://micro.blog/account/plugins/register

Repository:

https://github.com/puran1218/big-text-mb

## 6. After publication

For later updates:

1. Make the code change.
2. Update tests/manual checks as needed.
3. Increment the Service Worker cache name when static app files change.
4. Increment `plugin.json.version`.
5. Update `CHANGELOG.md`.
6. Merge to the published branch.
7. Test with **Pull from GitHub** on your own blog before announcing the update.
