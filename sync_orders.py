import os
import requests
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

RETAILCRM_DOMAIN = os.getenv("RETAILCRM_PERSONAL_DOMAIN")
RETAILCRM_API_KEY = os.getenv("RETAILCRM_API_KEY")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

RETAILCRM_WEBHOOK_SECRET = os.getenv("RETAILCRM_WEBHOOK_SECRET")
NOTIFICATIONS_WEBHOOK_URL = os.getenv("NOTIFICATIONS_WEBHOOK_URL")
VERCEL_URL = os.getenv("VERCEL_URL")
MIN_ORDER_TOTAL = 50_000

if not NOTIFICATIONS_WEBHOOK_URL and VERCEL_URL:
    domain = VERCEL_URL if VERCEL_URL.startswith(("http://", "https://")) else f"https://{VERCEL_URL}"
    NOTIFICATIONS_WEBHOOK_URL = f"{domain.rstrip('/')}/api/notifications/retailcrm-order"

missing_env = [
    name
    for name, value in {
        "RETAILCRM_PERSONAL_DOMAIN": RETAILCRM_DOMAIN,
        "RETAILCRM_API_KEY": RETAILCRM_API_KEY,
        "NEXT_PUBLIC_SUPABASE_URL": SUPABASE_URL,
        "SUPABASE_SERVICE_ROLE_KEY": SUPABASE_KEY,
    }.items()
    if not value
]

if missing_env:
    raise RuntimeError(f"Missing required env vars: {', '.join(missing_env)}")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_retailcrm_orders():
    """Получает все заказы из RetailCRM с поддержкой пагинации."""
    url = f"{RETAILCRM_DOMAIN.rstrip('/')}/api/v5/orders"
    all_orders = []
    page = 1
    limit = 20  # максимум поддерживаемый RetailCRM

    while True:
        params = {
            "apiKey": RETAILCRM_API_KEY,
            "limit": limit,
            "page": page,
        }

        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
        except requests.exceptions.RequestException as e:
            print(f"Ошибка при запросе к RetailCRM (страница {page}): {e}")
            break

        if not data.get("success"):
            print(f"Ошибка API RetailCRM: {data.get('errorMsg')}")
            break

        orders = data.get("orders", [])
        all_orders.extend(orders)

        pagination = data.get("pagination", {})
        total_pages = pagination.get("totalPageCount", 1)
        print(f"Загружена страница {page}/{total_pages} ({len(orders)} заказов)")

        if page >= total_pages:
            break

        page += 1

    return all_orders


def transform_order(order):
    """Трансформирует заказ из формата RetailCRM в формат для Supabase."""
    delivery = order.get("delivery")
    if not isinstance(delivery, dict):
        delivery = {}
    delivery_address = delivery.get("address", {})
    if not isinstance(delivery_address, dict):
        delivery_address = {}

    custom_fields = order.get("customFields")
    if not isinstance(custom_fields, dict):
        custom_fields = {}

    return {
        "retailcrm_id": order.get("id"),
        "first_name": order.get("firstName", ""),
        "last_name": order.get("lastName", ""),
        "phone": order.get("phone", ""),
        "email": order.get("email", ""),
        "status": order.get("status", ""),
        "total_sum": order.get("totalSumm", 0),
        "order_type": order.get("orderType", ""),
        "order_method": order.get("orderMethod", ""),
        "city": delivery_address.get("city", ""),
        "delivery_address": delivery_address.get("text", ""),
        "utm_source": custom_fields.get("utm_source", ""),
        "items": order.get("items", []),
    }


def get_existing_order_ids(retailcrm_ids):
    if not retailcrm_ids:
        return set()

    try:
        response = (
            supabase.table("orders")
            .select("retailcrm_id")
            .in_("retailcrm_id", retailcrm_ids)
            .execute()
        )
    except Exception as e:
        print(f"Не удалось проверить существующие заказы в Supabase: {e}")
        return set()

    return {row.get("retailcrm_id") for row in response.data or []}


def notify_large_new_orders(rows, existing_order_ids):
    if not NOTIFICATIONS_WEBHOOK_URL:
        print("NOTIFICATIONS_WEBHOOK_URL/VERCEL_URL не задан, Telegram webhook пропущен.")
        return

    if not RETAILCRM_WEBHOOK_SECRET:
        print("RETAILCRM_WEBHOOK_SECRET не задан, Telegram webhook пропущен.")
        return

    headers = {
        "content-type": "application/json",
        "x-webhook-secret": RETAILCRM_WEBHOOK_SECRET,
    }

    notified = 0
    for row in rows:
        retailcrm_id = row.get("retailcrm_id")
        total = row.get("total_sum") or 0

        if retailcrm_id in existing_order_ids or total <= MIN_ORDER_TOTAL:
            continue

        payload = {
            "type": "INSERT",
            "table": "orders",
            "record": row,
        }

        try:
            response = requests.post(
                NOTIFICATIONS_WEBHOOK_URL,
                json=payload,
                headers=headers,
                timeout=20,
            )
            response.raise_for_status()
            notified += 1
        except requests.exceptions.RequestException as e:
            print(f"Не удалось отправить Telegram webhook для заказа #{retailcrm_id}: {e}")

    print(f"Telegram webhook отправлен для новых крупных заказов: {notified}")


def sync_orders_to_supabase(orders):
    """Сохраняет/обновляет заказы в Supabase. Дубликаты исключаются через upsert по retailcrm_id."""
    if not orders:
        print("Нет заказов для выгрузки.")
        return

    rows = [transform_order(order) for order in orders]
    retailcrm_ids = [row["retailcrm_id"] for row in rows if row.get("retailcrm_id") is not None]
    existing_order_ids = get_existing_order_ids(retailcrm_ids)

    try:
        response = (
            supabase.table("orders")
            .upsert(rows, on_conflict="retailcrm_id")
            .execute()
        )
        notify_large_new_orders(rows, existing_order_ids)
        print(f"Успешно обработано заказов (добавлено/обновлено): {len(response.data)}")
    except Exception as e:
        print(f"Ошибка при записи в Supabase: {e}")


if __name__ == "__main__":
    print("Начинаем выгрузку заказов из RetailCRM...")

    orders = get_retailcrm_orders()
    print(f"Всего получено заказов: {len(orders)}")

    if orders:
        sync_orders_to_supabase(orders)

    print("Процесс завершен.")
