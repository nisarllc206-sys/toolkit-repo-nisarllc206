# Firebase Setup Guide

## Step 1: Create Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter a project name (e.g., "ai-creator-saas")
4. Disable Google Analytics (optional)
5. Click "Create project"

---

## Step 2: Enable Firestore

1. In Firebase Console, go to **Build → Firestore Database**
2. Click "Create database"
3. Select **Start in production mode**
4. Choose your region (e.g., `us-central`)
5. Click "Done"

---

## Step 3: Create Service Account

1. Go to **Project Settings → Service accounts**
2. Click **Generate new private key**
3. Download the JSON file

From the downloaded JSON, copy these values to `.env`:
```
FIREBASE_PROJECT_ID=<project_id from JSON>
FIREBASE_CLIENT_EMAIL=<client_email from JSON>
FIREBASE_PRIVATE_KEY=<private_key from JSON>
```

⚠️ The private key contains newlines. In `.env`, keep it as-is with `\n` characters.

---

## Step 4: Firestore Security Rules

In Firebase Console → Firestore → Rules, set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Posts belong to users
    match /posts/{postId} {
      allow read, write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
    }

    // Tools are publicly readable
    match /tools/{toolId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }

    // WordPress sites belong to users
    match /wordpress_sites/{siteId} {
      allow read, write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
    }
  }
}
```

---

## Step 5: Create Firestore Indexes

Go to **Firestore → Indexes → Composite** and create:

| Collection | Field 1 | Direction 1 | Field 2 | Direction 2 |
|------------|---------|-------------|---------|-------------|
| posts | userId | ASC | createdAt | DESC |
| posts | status | ASC | scheduledAt | ASC |
| subscriptions | userId | ASC | createdAt | DESC |
| scheduled_social_posts | status | ASC | scheduleTime | ASC |
| notification_queue | status | ASC | createdAt | ASC |
| tools | isFree | ASC | usageCount | DESC |

---

## Step 6: Seed Initial Data

After configuring credentials:
```bash
cd database/migrations
node 001_initial_schema.js
```

This creates default tools and content templates.
