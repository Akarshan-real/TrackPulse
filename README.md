# ⚡ TrackPulse — YouTube Playlist Metadata Studio

A modern, high-performance web application to extract video titles, individual duration timestamps, and compute total playlist runtimes into structured JSON and TXT exports.

Built with a curated aesthetic inspired by the **Nintendo 2001 Console Chrome Palette** (`#10131a` carbon navy, `#7a8aba` periwinkle accents, `#f68d1f` signal orange actions, and `#ecab37` amber utility badges).

---

## ✨ Features

- 🔗 **Universal YouTube Playlist Compatibility**:
  - `https://www.youtube.com/playlist?list=...`
  - `https://www.youtube.com/watch?v=...&list=...`
  - Direct Playlist IDs (e.g. `PLwjK_iyK4LLBVM18VZ7JKW-q88FAtnr8_`)
- ⏱️ **Total Runtime Calculation**: Sums video durations and formats them into human-readable hours, minutes, and seconds.
- 🔁 **Multi-Page Pagination**: Supports long playlists (100+, 200+, 500+ videos) with automatic token continuation.
- ⚡ **12-Hour Local Persisted Cache**: Built-in Redux Toolkit + Redux Persist cache to protect against YouTube rate limiting.
- 📦 **One-Click Exports**:
  - `playlist_data.json` array with exact `{ id, title, duration }` types.
  - `playlist_duration.txt` report with total duration & video count summary.
  - Direct **Copy JSON** clipboard tool.
- 🔍 **Real-Time Video Filter**: Search titles and durations instantly within the browser.
- 🌊 **Smooth Interactions**: Powered by Lenis smooth scrolling and Framer Motion micro-interactions & skeleton loaders.
- 🛡️ **Privacy & Terms Compliant**: Full in-app Privacy Policy and Terms of Service modals.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+ (App Router)](https://nextjs.org/)
- **State & Cache**: Redux Toolkit, Redux Persist (12h TTL)
- **UI & Motion**: React 19, [Lucide Icons](https://lucide.dev/), [Framer Motion](https://www.framer.com/motion/), [Lenis](https://lenis.darkroom.engineering/)
- **Typography**: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) & JetBrains Mono
- **Styling**: Vanilla CSS Design System with custom dark palette tokens

---

## 👤 Author

- **Akarshan** — [Portfolio](https://www.akarshan.me)
