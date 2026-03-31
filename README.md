# AI PDF Super Toolkit — Automated Revenue Engine

> **Goal:** $1 → $1,000/month with an automated content & sales funnel.

---

## Architecture

```
AI Script Generator (Python)
        │
        ▼
  posts.csv / Google Sheet
        │
        ▼
 Make.com / Zapier Workflow ──► TikTok / Instagram Reels / YouTube Shorts
        │
        ▼
New Follower / Keyword Comment
        │
        ▼
  Auto DM → Gumroad Link → Sale 💰
        │
        ▼
 Email Follow-up Sequence (Mailchimp)
```

---

## Quick Start

### 1. Frontend (Next.js)

```bash
cp .env.example .env          # fill in NEXT_PUBLIC_GUMROAD_URL
npm install
npm run dev                   # http://localhost:3000
```

### 2. Python Content Generator

```bash
cd scripts
pip install -r requirements.txt

# Template mode (no API key needed)
python content_generator.py --count 30 --output posts.csv

# AI-powered mode
OPENAI_API_KEY=sk-... python content_generator.py --count 30 --openai --output posts.csv
```

The script outputs a `posts.csv` with columns:
`id, platform, caption, hook, cta, hashtags, scheduled_time, status, gumroad_link`

### 3. Make.com / Zapier Auto-Post Workflow

Import `automation/make_workflow.json` into Make.com, then set the
following scenario variables:

| Variable | Description |
|---|---|
| `GENERATOR_WEBHOOK_URL` | Endpoint that runs `content_generator.py` |
| `GOOGLE_SHEET_ID` | Google Sheet used as content queue |
| `TIKTOK_SCHEDULE_WEBHOOK` | Your TikTok auto-poster webhook |
| `INSTAGRAM_SCHEDULE_WEBHOOK` | Your Instagram auto-poster webhook |
| `YOUTUBE_SCHEDULE_WEBHOOK` | Your YouTube auto-poster webhook |

The workflow runs every day at 06:00, generates 30 posts, appends them to
the Google Sheet, and schedules each to the matching platform.

### 4. Auto DM Funnel

Configuration: `automation/dm_funnel.json`

Triggers on:
- New TikTok / Instagram follower
- Keyword comment (`AI`, `link`, `tool`, `how`, `where`, `free`)

Action: sends a personalised DM containing your Gumroad product URL
within 30 seconds.

Set `GUMROAD_PRODUCT_URL` and `MAILCHIMP_LIST_ID` in the config or as
environment variables in your Make.com / Zapier scenario.

### 5. Email Follow-up Sequence

Templates in `automation/email_templates/`:

| File | When to Send |
|---|---|
| `welcome_sequence_1.txt` | Immediately after Gumroad purchase |
| `welcome_sequence_2.txt` | Day 3 — viral content workflow tips |

Upload these to Mailchimp / ConvertKit as an automation sequence.

---

## Revenue Math

| Step | Numbers |
|---|---|
| Ad spend | $1/day |
| Clicks | ~10/day |
| Conversion | ~10% |
| Sales | 1/day × $9 = $9/day |
| **Monthly** | **~$270 organic + $270 paid = $540–$750/month** |

Scale: reinvest 20% of revenue into ads → $1K/month is achievable.

---

## Environment Variables

```env
# Next.js frontend
NEXT_PUBLIC_GUMROAD_URL=https://gumroad.com/l/your-product

# Python script (optional — falls back to templates)
OPENAI_API_KEY=sk-...

# Automation
GUMROAD_PRODUCT_URL=https://gumroad.com/l/your-product
MAILCHIMP_LIST_ID=your_list_id
```

---

## Daily 5-Minute Checklist

- [ ] Run `python scripts/content_generator.py` (or let the cron do it)
- [ ] Check Gumroad dashboard for new sales
- [ ] Review Make.com run history — fix any failed posts
- [ ] Reply to top comments organically
- [ ] Monitor ad spend vs. clicks in TikTok / Meta Ads Manager
