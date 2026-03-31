Security + Stability + Scalability = Real SaaSNODE_ENV=production
PORT=5000

MONGO_URI=your_secure_db_url
OPENAI_KEY=your_key
STRIPE_KEY=your_key

JWT_SECRET=super_long_random_secret_123!@#
JWT_REFRESH_SECRET=another_super_secret

RATE_LIMIT=100
Bio Link → WhatsApp Click → AI Chatbot → Smart Reply → Offer → Payment Link → Sale 💰cd Ai-pdf-super-toolkit- && cp .env.example .env && npm install

## WhatsApp Integration

### Contact Details
- **Phone**: 03408060167 (Pakistan) / +923408060167 (E.164)
- **Contact Link**: https://wa.me/923408060167
- **Message Link**: https://wa.me/message/3A7MFOQTRE2ZL1/

### Setup

1. Copy the example environment file and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

2. Set the following WhatsApp variables in `.env`:
   ```env
   WHATSAPP_TOKEN=<Meta access token>
   PHONE_NUMBER_ID=<Meta phone number ID>
   WHATSAPP_VERIFY_TOKEN=nisar_verify
   OPENAI_API_KEY=<OpenAI key>
   ```

3. Install dependencies and start the server:
   ```bash
   npm install
   npm run server
   ```

### Webhook Configuration

Register your webhook in the **Meta for Developers** dashboard:

| Field | Value |
|-------|-------|
| Callback URL | `https://your-domain.com/api/whatsapp/webhook` |
| Verify Token | Value of `WHATSAPP_VERIFY_TOKEN` in your `.env` |
| Subscribed Fields | `messages` |

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/whatsapp/contact` | Returns WhatsApp contact and message links |
| `GET` | `/api/whatsapp/webhook` | Webhook verification (used by Meta) |
| `POST` | `/api/whatsapp/webhook` | Receive incoming WhatsApp messages |
| `POST` | `/api/whatsapp/send` | Send a WhatsApp message (queued) |

#### GET `/api/whatsapp/contact`

```json
{
  "phone": "923408060167",
  "contactLink": "https://wa.me/923408060167",
  "messageLink": "https://wa.me/message/3A7MFOQTRE2ZL1/"
}
```

Optional query param `?text=Hello` pre-fills the message in the contact link.

#### POST `/api/whatsapp/send`

Request body:
```json
{ "to": "923408060167", "message": "Hello from the toolkit!" }
```

Response:
```json
{ "status": "queued", "queueId": "msg_1234567890_abcdef" }
```