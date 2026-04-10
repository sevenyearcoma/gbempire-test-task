"use client";

type ProductData = {
  name: string;
  quantity: number;
  revenue: number;
};

export default function TopProductsChart({ data }: { data: ProductData[] }) {
  const top = data.slice(0, 8);
  const max = top[0]?.quantity ?? 1;

  return (
    <div className="bg-[#131b2e] p-6 rounded-xl">
      <h2 className="text-lg font-bold text-[#dae2fd] mb-6">Товары</h2>
      <div className="space-y-5">
        {top.map((product) => {
          const widthPct = Math.round((product.quantity / max) * 100);
          return (
            <div key={product.name} className="space-y-2">
              <div className="flex justify-between gap-4 text-xs font-semibold text-slate-400">
                <span className="truncate max-w-[70%]">{product.name}</span>
                <span>{product.revenue.toLocaleString("ru-RU")} ₸</span>
              </div>
              <div className="h-2.5 w-full bg-[#222a3d] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
