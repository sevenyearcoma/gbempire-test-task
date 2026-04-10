# RetailCRM Telegram notifications

Endpoint:

```text
POST /api/notifications/retailcrm-order
```

It sends a Telegram message when the incoming order total is greater than
`50,000 ₸`.

## Environment variables

Set these variables in Vercel or in `.env.local` for local testing:

```env
TELEGRAM_BOT_TOKEN=123456789:telegram-bot-token
RETAILCRM_WEBHOOK_SECRET=long-random-secret
SUPABASE_SERVICE_ROLE_KEY=service-role-key
```

Keep these variables server-only. Do not prefix them with `NEXT_PUBLIC_`.

## Auth

The webhook must send one of these headers:

```http
Authorization: Bearer long-random-secret
```

or:

```http
x-webhook-secret: long-random-secret
```

## Payload formats

The endpoint accepts a Supabase Database Webhook payload:

```json
{
  "type": "INSERT",
  "table": "orders",
  "record": {
    "retailcrm_id": 10001,
    "first_name": "Иван",
    "last_name": "Иванов",
    "phone": "+77000000000",
    "email": "client@example.com",
    "status": "new",
    "total_sum": 65000,
    "city": "Алматы",
    "delivery_address": "Абая 10"
  }
}
```

It also accepts direct RetailCRM-style payloads where the order is in `order`,
`data`, or the JSON root.

## Recommended setup

Use one of these approaches:

1. RetailCRM webhook directly to:
   `https://your-domain.com/api/notifications/retailcrm-order`
2. Supabase Database Webhook on `orders` insert to the same URL.

The Supabase webhook is a good fit if the existing RetailCRM sync already writes
orders into the `orders` table used by this dashboard.
