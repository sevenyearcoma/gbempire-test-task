export const dynamic = "force-dynamic";

import { getSupabase, Order, OrderItem, parseItems } from "@/lib/supabase";
import StatsCards from "@/components/StatsCards";
import ByCityChart from "@/components/ByCityChart";
import BySourceChart from "@/components/BySourceChart";
import ByStatusChart from "@/components/ByStatusChart";
import OrdersTable from "@/components/OrdersTable";
import TopProductsChart from "@/components/TopProductsChart";

function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = String(item[key] || "Неизвестно");
    (acc[k] = acc[k] || []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

export default async function Home() {
  const { data: orders, error } = await getSupabase()
    .from("orders")
    .select("*")
    .returns<Order[]>();

  if (error || !orders) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">Ошибка загрузки данных: {error?.message}</p>
      </main>
    );
  }

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_sum || 0), 0);
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Aggregate items across all orders
  const productMap = new Map<string, { quantity: number; revenue: number }>();
  let totalItems = 0;

  for (const order of orders) {
    const items: OrderItem[] = parseItems(order.items as string | OrderItem[]);
    for (const item of items) {
      const name = item.offer?.displayName ?? item.offer?.name ?? "Неизвестно";
      const qty = item.quantity ?? 1;
      const price = item.initialPrice ?? item.prices?.[0]?.price ?? 0;
      totalItems += qty;
      const existing = productMap.get(name) ?? { quantity: 0, revenue: 0 };
      productMap.set(name, {
        quantity: existing.quantity + qty,
        revenue: existing.revenue + price * qty,
      });
    }
  }

  const topProducts = Array.from(productMap.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.quantity - a.quantity);

  const byCity = groupBy(orders, "city");
  const bySource = groupBy(orders, "utm_source");
  const byStatus = groupBy(orders, "status");

  const topCity = Object.entries(byCity).sort((a, b) => b[1].length - a[1].length)[0]?.[0] ?? "—";
  const topSource = Object.entries(bySource).sort((a, b) => b[1].length - a[1].length)[0]?.[0] ?? "—";

  const cityChartData = Object.entries(byCity)
    .map(([city, items]) => ({
      city,
      orders: items.length,
      revenue: items.reduce((s, o) => s + (o.total_sum || 0), 0),
    }))
    .sort((a, b) => b.orders - a.orders);

  const sourceChartData = Object.entries(bySource)
    .map(([name, items]) => ({ name, value: items.length }))
    .sort((a, b) => b.value - a.value);

  const statusChartData = Object.entries(byStatus)
    .map(([name, items]) => ({ name, value: items.length }))
    .sort((a, b) => b.value - a.value);

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Дашборд заказов</h1>
          <p className="text-sm text-gray-500 mt-1">Данные из RetailCRM → Supabase</p>
        </div>

        <StatsCards
          totalOrders={totalOrders}
          totalRevenue={totalRevenue}
          topCity={topCity}
          topSource={topSource}
          avgOrder={avgOrder}
          totalItems={totalItems}
        />

        <ByCityChart data={cityChartData} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BySourceChart data={sourceChartData} />
          <ByStatusChart data={statusChartData} />
        </div>

        {topProducts.length > 0 && <TopProductsChart data={topProducts} />}

        <OrdersTable orders={orders} />
      </div>
    </main>
  );
}
