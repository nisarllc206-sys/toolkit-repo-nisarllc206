"""
AI Viral Content Generator
Generates 30 viral social-media posts per day and saves them to a CSV file.

Usage:
    python content_generator.py [--count 30] [--output posts.csv]

Environment variables (optional, falls back to template-only mode when absent):
    OPENAI_API_KEY  — OpenAI API key for GPT-powered captions
"""

import argparse
import csv
import os
import random
import textwrap
from datetime import datetime, timedelta

# ---------------------------------------------------------------------------
# Viral-post templates (used when no OpenAI key is present)
# ---------------------------------------------------------------------------
GUMROAD_PRODUCT_URL = os.getenv("GUMROAD_PRODUCT_URL", "https://gumroad.com/l/your-product")

HOOKS = [
    "I generated this in 10 seconds with AI 🤯",
    "Stop wasting hours on {topic} — AI does it instantly",
    "Nobody talks about this AI trick for {topic}",
    "This AI tool changed how I do {topic} forever",
    "POV: You discover AI for {topic} for the first time",
    "The {topic} hack every creator needs to know 🔥",
    "If you're not using AI for {topic} you're falling behind",
    "Watch me automate {topic} with AI in under 60 seconds",
    "3 AI prompts that will 10x your {topic} output",
    "I asked AI to write my {topic} content — here's what happened",
]

TOPICS = [
    "PDF editing",
    "content creation",
    "social media posts",
    "email marketing",
    "document summarisation",
    "video scripts",
    "business automation",
    "lead generation",
    "AI tools",
    "digital products",
]

CTAS = [
    "🔗 Link in bio to try the free AI toolkit",
    "💬 Comment 'AI' and I'll DM you the tool",
    "🛒 Grab it now — link in bio",
    "📩 DM me 'FREE' for instant access",
    "👇 Drop a 🔥 if you want the tutorial",
]

HASHTAG_POOLS = [
    "#AItools #ContentCreator #AutomationHacks",
    "#ViralContent #SmallBusiness #MakeMoneyOnline",
    "#TikTokCreator #ReelsViral #AIForBusiness",
    "#DigitalProducts #PassiveIncome #SideHustle",
    "#AIGenerated #ContentMarketing #CreatorEconomy",
]

PLATFORMS = ["TikTok", "Instagram Reels", "YouTube Shorts"]


def _template_post(index: int) -> dict:
    """Generate a single post from templates (no API needed)."""
    hook_template = HOOKS[index % len(HOOKS)]
    topic = TOPICS[index % len(TOPICS)]
    hook = hook_template.replace("{topic}", topic)
    cta = CTAS[index % len(CTAS)]
    hashtags = HASHTAG_POOLS[index % len(HASHTAG_POOLS)]
    platform = random.choice(PLATFORMS)

    caption = f"{hook}\n\n{cta}\n\n{hashtags}"
    # Schedule posts evenly across the day starting at 07:00
    post_time = (datetime.now().replace(hour=7, minute=0, second=0, microsecond=0)
                 + timedelta(minutes=30 * index))

    return {
        "id": index + 1,
        "platform": platform,
        "caption": caption,
        "hook": hook,
        "cta": cta,
        "hashtags": hashtags,
        "scheduled_time": post_time.strftime("%Y-%m-%d %H:%M"),
        "status": "scheduled",
        "gumroad_link": GUMROAD_PRODUCT_URL,
    }


def _openai_post(index: int, client, topic: str) -> dict:
    """Generate a single post using the OpenAI API."""
    prompt = textwrap.dedent(f"""
        Write a viral social-media caption for {PLATFORMS[index % len(PLATFORMS)]}.
        Topic: {topic}
        Requirements:
        - Start with a curiosity-driven hook (max 10 words)
        - 3-5 short punchy sentences
        - End with a call-to-action to click the link in bio
        - Include 3 relevant hashtags
        - Mention "AI" and "automated"
        Keep it under 150 words.
    """).strip()

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=200,
        temperature=0.9,
    )
    caption = response.choices[0].message.content.strip()
    platform = PLATFORMS[index % len(PLATFORMS)]
    post_time = (datetime.now().replace(hour=7, minute=0, second=0, microsecond=0)
                 + timedelta(minutes=30 * index))

    return {
        "id": index + 1,
        "platform": platform,
        "caption": caption,
        "hook": caption.split("\n")[0],
        "cta": GUMROAD_PRODUCT_URL,
        "hashtags": "",
        "scheduled_time": post_time.strftime("%Y-%m-%d %H:%M"),
        "status": "scheduled",
        "gumroad_link": GUMROAD_PRODUCT_URL,
    }


def generate_posts(count: int = 30, use_openai: bool = False) -> list[dict]:
    """Return a list of *count* viral post dictionaries."""
    posts = []
    client = None

    if use_openai:
        try:
            from openai import OpenAI  # type: ignore
            client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
        except Exception as exc:
            print(f"[WARNING] OpenAI unavailable ({exc}). Falling back to templates.")
            client = None

    for i in range(count):
        topic = TOPICS[i % len(TOPICS)]
        if client:
            try:
                post = _openai_post(i, client, topic)
            except Exception as exc:
                print(f"[WARNING] OpenAI call failed for post {i+1} ({exc}). Using template.")
                post = _template_post(i)
        else:
            post = _template_post(i)
        posts.append(post)

    return posts


def save_to_csv(posts: list[dict], output_path: str) -> None:
    """Write posts to a CSV file."""
    if not posts:
        return
    fieldnames = list(posts[0].keys())
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(posts)
    print(f"[OK] Saved {len(posts)} posts → {output_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="AI Viral Content Generator")
    parser.add_argument("--count", type=int, default=30,
                        help="Number of posts to generate (default: 30)")
    parser.add_argument("--output", default="posts.csv",
                        help="Output CSV file path (default: posts.csv)")
    parser.add_argument("--openai", action="store_true",
                        help="Use OpenAI API (requires OPENAI_API_KEY env var)")
    args = parser.parse_args()

    print(f"[INFO] Generating {args.count} viral posts…")
    posts = generate_posts(count=args.count, use_openai=args.openai)
    save_to_csv(posts, args.output)
    print("[DONE] Content generation complete.")
    print(f"       Posts scheduled from {posts[0]['scheduled_time']} "
          f"to {posts[-1]['scheduled_time']}")


if __name__ == "__main__":
    main()
