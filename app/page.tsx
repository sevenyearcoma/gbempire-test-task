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
      <main className="min-h-screen bg-[#0b1326] flex items-center justify-center p-6">
        <p className="text-[#ffb4ab] text-sm">Ошибка загрузки данных: {error?.message}</p>
      </main>
    );
  }

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total_sum || 0), 0);
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

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
      revenue: items.reduce((sum, order) => sum + (order.total_sum || 0), 0),
    }))
    .sort((a, b) => b.orders - a.orders);

  const sourceChartData = Object.entries(bySource)
    .map(([name, items]) => ({ name, value: items.length }))
    .sort((a, b) => b.value - a.value);

  const statusChartData = Object.entries(byStatus)
    .map(([name, items]) => ({ name, value: items.length }))
    .sort((a, b) => b.value - a.value);

  return (
    <main className="mx-auto max-w-7xl p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-[#dae2fd]">Заказы</h1>

      <StatsCards
        totalOrders={totalOrders}
        totalRevenue={totalRevenue}
        topCity={topCity}
        topSource={topSource}
        avgOrder={avgOrder}
        totalItems={totalItems}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <ByCityChart data={cityChartData} />
        </div>
        <div className="lg:col-span-4">
          <BySourceChart data={sourceChartData} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ByStatusChart data={statusChartData} />
        {topProducts.length > 0 && <TopProductsChart data={topProducts} />}
      </div>

      <OrdersTable orders={orders} />
    </main>
  );
}
