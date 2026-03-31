# API Documentation

Base URL: `http://localhost:5000/api` (development) | `https://your-domain.com/api` (production)

All authenticated endpoints require `Authorization: Bearer <token>` header.

---

## Authentication

### POST /api/auth/register
Create a new user account.

**Request:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepass123"
}
```

**Response 201:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "abc123",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "free"
  }
}
```

---

### POST /api/auth/login
Authenticate and receive a JWT token.

**Request:**
```json
{ "email": "jane@example.com", "password": "securepass123" }
```

**Response 200:**
```json
{ "token": "eyJhbGciOiJIUzI1NiJ9...", "user": { ... } }
```

---

### GET /api/auth/me
Get current authenticated user. 🔒 Auth required.

**Response 200:**
```json
{ "user": { "id": "abc123", "name": "Jane Doe", "email": "jane@example.com", "role": "free" } }
```

---

### POST /api/auth/logout
Invalidate session (client-side token removal). 🔒 Auth required.

**Response 200:** `{ "message": "Logged out successfully" }`

---

## Posts

### GET /api/posts
Get paginated list of user's posts. 🔒 Auth required.

**Query Params:** `page=1&limit=20`

**Response 200:**
```json
{
  "data": [
    {
      "id": "post123",
      "title": "My Blog Post",
      "status": "draft",
      "platforms": ["wordpress"],
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 45, "pages": 3 }
}
```

---

### POST /api/posts
Create a new post. 🔒 Auth required.

**Request:**
```json
{
  "title": "My Blog Post",
  "content": "<p>Content here...</p>",
  "status": "draft",
  "platforms": ["wordpress"],
  "scheduledAt": null
}
```

**Response 201:** `{ "post": { ... } }`

---

### GET /api/posts/:id
Get a specific post. 🔒 Auth required.

**Response 200:** `{ "post": { ... } }`

---

### PUT /api/posts/:id
Update a post. 🔒 Auth required.

**Request:** Any post fields to update.

**Response 200:** `{ "post": { ... } }`

---

### DELETE /api/posts/:id
Delete a post. 🔒 Auth required.

**Response 200:** `{ "message": "Post deleted" }`

---

### POST /api/posts/:id/publish
Publish post to all connected WordPress sites. 🔒 Auth required.

**Response 200:**
```json
{
  "message": "Post published",
  "results": [
    { "site": "https://mysite.com", "success": true, "wpId": 123, "url": "https://mysite.com/my-post" }
  ]
}
```

---

### POST /api/posts/:id/schedule
Schedule a post for future publishing. 🔒 Auth required.

**Request:** `{ "scheduledAt": "2024-02-01T10:00:00Z" }`

**Response 200:** `{ "post": { ... } }`

---

## Content Generation

### POST /api/content/generate
Generate AI content. 🔒 Auth required.

**Request:**
```json
{
  "prompt": "Write a blog post about sustainable energy",
  "type": "blog",
  "options": { "maxTokens": 2000, "temperature": 0.7 }
}
```

**Type options:** `blog` | `social` | `email` | `product`

**Response 200:**
```json
{
  "content": "# Sustainable Energy: The Future...",
  "usage": { "prompt_tokens": 45, "completion_tokens": 523, "total_tokens": 568 },
  "model": "gpt-4"
}
```

---

### POST /api/content/generate-image
Generate an image with DALL-E 3. 🔒 Auth required.

**Request:**
```json
{
  "prompt": "A futuristic city powered by renewable energy",
  "options": { "size": "1024x1024", "quality": "standard", "style": "vivid" }
}
```

**Response 200:**
```json
{
  "url": "https://oaidalleapiprodscus.blob.core.windows.net/...",
  "revisedPrompt": "..."
}
```

---

### POST /api/content/seo-optimize
Generate SEO metadata for content. 🔒 Auth required.

**Request:** `{ "content": "Your blog post content..." }`

**Response 200:**
```json
{
  "metadata": {
    "title": "SEO-Optimized Title (max 60 chars)",
    "description": "Meta description (max 160 chars)",
    "keywords": ["keyword1", "keyword2"],
    "slug": "url-friendly-slug"
  }
}
```

---

### GET /api/content/templates
Get available content templates. 🔒 Auth required.

**Response 200:**
```json
{
  "templates": [
    { "id": "1", "name": "Blog Post", "type": "blog", "prompt": "Write a blog post about: {topic}" }
  ]
}
```

---

### POST /api/content/templates/:id/use
Use a content template. 🔒 Auth required.

**Request:**
```json
{
  "variables": { "topic": "AI Content Marketing" },
  "options": { "maxTokens": 2000 }
}
```

---

## Tools Directory

### GET /api/tools
Get paginated list of AI tools (public).

**Query Params:** `category=Writing&isFree=true&page=1&limit=20`

**Response 200:**
```json
{
  "data": [
    { "id": "tool123", "name": "ChatGPT", "category": "Writing", "isFree": true, "rating": 4.9 }
  ],
  "pagination": { ... }
}
```

---

### GET /api/tools/:id
Get a specific tool (increments usage count).

---

### POST /api/tools/:id/rate
Rate a tool 1-5. 🔒 Auth required.

**Request:** `{ "rating": 4.5 }`

---

## Payments

### GET /api/payments/plans
Get available subscription plans.

**Response 200:** `{ "plans": [ ... ] }`

---

### POST /api/payments/checkout
Create a Stripe Checkout session. 🔒 Auth required.

**Request:**
```json
{
  "priceId": "price_xxx",
  "successUrl": "https://app.com/success",
  "cancelUrl": "https://app.com/cancel"
}
```

**Response 200:** `{ "sessionId": "cs_xxx", "url": "https://checkout.stripe.com/..." }`

---

### POST /api/payments/webhook
Stripe webhook endpoint (no auth, uses signature verification).

---

### GET /api/payments/subscription
Get current user's subscription. 🔒 Auth required.

---

### POST /api/payments/subscription/cancel
Cancel subscription at period end. 🔒 Auth required.

---

## WordPress

### GET /api/wordpress/sites
List connected WordPress sites. 🔒 Auth required.

---

### POST /api/wordpress/sites
Connect a new WordPress site. 🔒 Auth required.

**Request:**
```json
{
  "siteUrl": "https://mysite.com",
  "username": "admin",
  "applicationPassword": "xxxx xxxx xxxx xxxx",
  "name": "My Blog"
}
```

---

### DELETE /api/wordpress/sites/:id
Remove a WordPress site. 🔒 Auth required.

---

### POST /api/wordpress/publish
Publish directly to a WordPress site. 🔒 Auth required.

**Request:**
```json
{
  "siteId": "site123",
  "title": "Post Title",
  "content": "<p>HTML content</p>",
  "status": "publish",
  "categories": [1, 2],
  "tags": [5]
}
```

---

## Error Responses

All errors follow this format:
```json
{
  "error": "Human-readable error message",
  "statusCode": 400
}
```

**Common Status Codes:**
- `400` — Validation error
- `401` — Unauthorized / Token expired
- `403` — Forbidden (not your resource)
- `404` — Resource not found
- `409` — Conflict (e.g., email already exists)
- `429` — Rate limit exceeded
- `500` — Internal server error
