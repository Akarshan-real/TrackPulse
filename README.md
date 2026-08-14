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
- 📦 **One-Click Exports**:
  - `playlist_data.json` array with exact `{ id, title, duration }` types.
  - `playlist_duration.txt` report with total duration & video count summary.
  - Direct **Copy JSON** clipboard tool.
- 🔍 **Real-Time Video Filter**: Search titles and durations instantly within the browser.
- 🛡️ **Privacy & Terms Compliant**: Full in-app Privacy Policy and Terms of Service modals.
- 🎨 **Creator Credit**: Built by [Akarshan](https://www.akarshan.me).

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.17+ or v20+)
- npm / yarn / pnpm

### 1. Installation
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

### 3. Production Build
```bash
npm run build
npm start
```

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+ (App Router)](https://nextjs.org/)
- **UI & Icons**: React 19, [Lucide Icons](https://lucide.dev/)
- **Typography**: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) & JetBrains Mono
- **Styling**: Vanilla CSS Design System with custom dark palette tokens

---

## 👤 Author

- **Akarshan** — [Portfolio](https://www.akarshan.me)
