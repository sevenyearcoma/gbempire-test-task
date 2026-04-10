import os
import requests
import json
from dotenv import load_dotenv

load_dotenv(".env.local")
load_dotenv()

RETAILCRM_DOMAIN = os.getenv("RETAILCRM_PERSONAL_DOMAIN")
RETAILCRM_API_KEY = os.getenv("RETAILCRM_API_KEY")

missing_env = [
    name
    for name, value in {
        "RETAILCRM_PERSONAL_DOMAIN": RETAILCRM_DOMAIN,
        "RETAILCRM_API_KEY": RETAILCRM_API_KEY,
    }.items()
    if not value
]

if missing_env:
    raise RuntimeError(f"Missing required env vars: {', '.join(missing_env)}")

with open('mock_orders.json', 'r', encoding='utf-8') as file:
    orders_data = json.load(file)

for order in orders_data:
    if "phone" in order:
        clean_phone = ''.join(filter(str.isdigit, order["phone"]))
        order["externalId"] = f"mock_{clean_phone}"
    else:
        order["externalId"] = f"mock_no_phone_{orders_data.index(order)}"

url = f"{RETAILCRM_DOMAIN.rstrip('/')}/api/v5/orders/upload"
payload = {
    "apiKey": RETAILCRM_API_KEY,
    "orders": json.dumps(orders_data)
}

response = requests.post(url, data=payload)
print(response.json())
