# Firestore Schema Documentation

## Collections

### `users`
Stores user accounts and profile information.

| Field | Type | Description |
|-------|------|-------------|
| email | string | Unique user email (lowercase) |
| password | string | Bcrypt hashed password |
| name | string | Display name |
| role | string | `free` \| `pro` \| `enterprise` \| `admin` |
| stripeCustomerId | string \| null | Stripe customer ID |
| subscription | map | `{ plan, status }` |
| createdAt | string | ISO timestamp |
| updatedAt | string | ISO timestamp |

### `posts`
Stores all content posts created by users.

| Field | Type | Description |
|-------|------|-------------|
| userId | string | Reference to users document |
| title | string | Post title |
| content | string | Post content (HTML or markdown) |
| status | string | `draft` \| `published` \| `scheduled` |
| platforms | array | `['wordpress', 'facebook', 'instagram']` |
| wordpressSiteId | string \| null | WordPress site ID |
| scheduledAt | string \| null | ISO timestamp for scheduled publishing |
| publishedAt | string \| null | ISO timestamp when published |
| metadata | map | SEO data, publish results, etc. |
| createdAt | string | ISO timestamp |
| updatedAt | string | ISO timestamp |

### `tools`
AI tools directory entries.

| Field | Type | Description |
|-------|------|-------------|
| name | string | Tool name |
| description | string | Tool description |
| category | string | `Writing` \| `Image` \| `Video` \| `Audio` \| `Marketing` \| `SEO` \| `Code` |
| url | string | Tool website URL |
| isFree | boolean | Whether free tier is available |
| rating | number | Average rating (0-5) |
| ratingCount | number | Number of ratings |
| usageCount | number | Number of views/clicks |
| tags | array | Search tags |
| createdAt | string | ISO timestamp |

### `subscriptions`
Stripe subscription tracking.

| Field | Type | Description |
|-------|------|-------------|
| userId | string | Reference to users document |
| stripeSubscriptionId | string | Stripe subscription ID |
| plan | string | `free` \| `pro` \| `enterprise` |
| status | string | Stripe subscription status |
| currentPeriodStart | string | ISO timestamp |
| currentPeriodEnd | string | ISO timestamp |
| cancelAtPeriodEnd | boolean | Whether cancellation is pending |
| createdAt | string | ISO timestamp |
| updatedAt | string | ISO timestamp |

### `wordpress_sites`
Connected WordPress site configurations.

| Field | Type | Description |
|-------|------|-------------|
| userId | string | Reference to users document |
| siteUrl | string | WordPress site URL |
| username | string | WordPress username |
| applicationPassword | string | WordPress Application Password |
| name | string | Friendly site name |
| createdAt | string | ISO timestamp |

### `scheduled_social_posts`
Queue for scheduled social media posts.

| Field | Type | Description |
|-------|------|-------------|
| platform | string | `facebook` \| `instagram` |
| content | map | Platform-specific content payload |
| scheduleTime | string | ISO timestamp to publish |
| status | string | `pending` \| `published` \| `failed` |
| publishedAt | string \| null | ISO timestamp when published |
| result | map \| null | API response from platform |
| error | string \| null | Error message if failed |
| createdAt | string | ISO timestamp |

### `notification_queue`
Queue for outgoing notifications (email, WhatsApp).

| Field | Type | Description |
|-------|------|-------------|
| channel | string | `email` \| `whatsapp` |
| type | string | `welcome` \| `post_published` \| `subscription` \| `custom` |
| to | string | Recipient email or phone number |
| message | string | Message body (WhatsApp) |
| subject | string | Email subject |
| html | string | Email HTML body |
| data | map | Template variables |
| status | string | `pending` \| `sent` \| `failed` |
| sentAt | string \| null | ISO timestamp when sent |
| error | string \| null | Error message if failed |
| createdAt | string | ISO timestamp |

## Indexes Required

Create composite indexes in Firebase Console for:

1. `posts` — `userId` ASC + `createdAt` DESC
2. `posts` — `status` ASC + `scheduledAt` ASC (for scheduler)
3. `subscriptions` — `userId` ASC + `createdAt` DESC
4. `scheduled_social_posts` — `status` ASC + `scheduleTime` ASC
5. `notification_queue` — `status` ASC + `createdAt` ASC
6. `tools` — `category` ASC + `usageCount` DESC
7. `tools` — `isFree` ASC + `usageCount` DESC
