# AI PDF Super Toolkit 🚀

> **100+ AI-powered PDF tools** — available as an Android app and a Web PWA.  
> Part of the **Nexus Ultra Platforms** ecosystem by [Muhammad Nisar](https://github.com/nisarllc206-sys).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

---

## ✨ What is this?

AI PDF Super Toolkit is a full-stack SaaS platform that gives users access to over **100 PDF tools** — from basic operations like merge, split, and compress, to AI-powered features like document chat, summarisation, and e-signature — all inside a single dark-themed Material 3 app.

### Highlights

| Feature | Details |
|---|---|
| 📱 Android App | Kotlin + Jetpack Compose, Material 3 |
| 🌐 Web PWA | Next.js 14, installable on any device |
| 🤖 AI Chat | Ask questions about any PDF via Claude Sonnet |
| ✍️ e-Signature | Draw, type, or upload — legally bind documents |
| 🗜️ Compress | Reduce file size without visible quality loss |
| 🔁 Convert | PDF ↔ Word, Excel, JPG, and more |
| 📝 AI Summarise | Bullet, executive, simple, or detailed — 40+ languages |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Android | Kotlin, Jetpack Compose |
| Web frontend | Next.js 14, Tailwind CSS, TypeScript |
| Backend API | NestJS, Prisma |
| AI | Claude Sonnet (Anthropic) |
| Database | PostgreSQL, Redis |
| Infrastructure | Docker, Kubernetes, Vercel Edge Network |

---

## 🚀 Getting Started (Web App)

### Prerequisites

- **Node.js 18+** — [download here](https://nodejs.org/)
- **npm 9+** (comes with Node.js)
- A terminal (Command Prompt, PowerShell, or any Unix shell)

### 1 — Clone the repository

```bash
git clone https://github.com/nisarllc206-sys/Ai-pdf-super-toolkit-.git
cd Ai-pdf-super-toolkit-
```

### 2 — Install dependencies

```bash
npm install
```

### 3 — Set up environment variables

Copy the included `env` template file and fill in your own values:

```bash
cp env .env.local
```

Open `.env.local` in any text editor and replace the placeholder values (see [Environment Variables](#-environment-variables) below).

### 4 — Start the development server

```bash
npm run dev
```

The app will be available at **http://localhost:3000** 🎉

---

## 🔑 Environment Variables

| Variable | Description | Required |
|---|---|---|
| `PORT` | Port the server listens on (default: `5000`) | No |
| `OPENAI_API_KEY` | Your OpenAI / Claude API key | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key for payments | Yes |
| `WHATSAPP_TOKEN` | WhatsApp Cloud API token | No |
| `PHONE_NUMBER_ID` | WhatsApp phone number ID | No |
| `VERIFY_TOKEN` | Webhook verification token | No |

> ⚠️ **Never commit real API keys.** The `.gitignore` already excludes `.env*` files.

---

## 🏗️ Deployment

### Deploy to Vercel (recommended — free tier available)

1. Push your code to GitHub.
2. Go to [vercel.com](https://vercel.com) and click **"New Project"**.
3. Import this repository.
4. Add all environment variables from the table above in the **Environment Variables** section.
5. Click **Deploy**. Your app goes live in ~1 minute. ✅

### Deploy with Docker

```bash
# Build the image
docker build -t ai-pdf-toolkit .

# Run the container
docker run -p 3000:3000 --env-file .env.local ai-pdf-toolkit
```

---

## 📁 Project Structure

```
Ai-pdf-super-toolkit-/
├── page.tsx                    # Main Next.js page
├── tailwind.config.ts          # Tailwind CSS configuration
├── package.json                # Node.js dependencies & scripts
├── Ai pdf toolkit landing.HTML # Standalone landing page
├── read.me                     # Project scaffolding notes
├── env                         # Example environment variables
├── LICENSE                     # MIT License
└── .gitignore
```

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** this repository.
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m "Add your feature"`
4. Push to your fork: `git push origin feature/your-feature-name`
5. Open a **Pull Request** against `main`.

Please keep PRs focused and include a clear description of what changed and why.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🔗 Links

- 🌐 Web App: [pdftoolkit.nexusultra.com](https://pdftoolkit.nexusultra.com)
- 📦 GitHub: [nisarllc206-sys/Ai-pdf-super-toolkit-](https://github.com/nisarllc206-sys/Ai-pdf-super-toolkit-)
- ☁️ Infrastructure: [nisarllc206-sys/Cloudflaire.-Com](https://github.com/nisarllc206-sys/Cloudflaire.-Com)

---

<p align="center">Made with ❤️ by Muhammad Nisar · Nexus Ultra Platforms</p>