# Changelog

All notable user-visible changes to Big Text are recorded here.

## 1.1 — Unreleased

### Added

- One-tap Clear action
- Responsive iPad editor layout
- Keyboard-aware compact editor state
- Dynamic safe margins around displayed text
- PWA install metadata for utilities/productivity

### Changed

- Removed the 200-character hard limit
- Reworked text fitting to respond to container, Visual Viewport, and orientation changes
- Increased theme touch targets
- Renamed style-oriented themes to neutral color names: Lime, Jade, Amber, and Cobalt
- Updated Cobalt to a blue-and-white high-contrast palette
- Improved light/dark browser UI integration
- Rewrote project documentation for the standalone Micro.blog/PWA product

### Privacy and reliability

- Remove consumed `?text=` content from the visible URL
- Prevent the page from sending a query-bearing URL as a referrer to subresources
- Avoid storing query-bearing navigation URLs as Service Worker cache keys
- Removed an invalid maskable icon declaration until a dedicated maskable asset exists
