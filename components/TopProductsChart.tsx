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
    <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-[0_10px_28px_rgba(14,18,28,.05)]">
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Top Items</p>
        <h2 className="mt-1 text-lg font-bold text-foreground">Товары</h2>
      </div>
      <div className="space-y-5">
        {top.map((product) => {
          const widthPct = Math.round((product.quantity / max) * 100);
          return (
            <div key={product.name} className="space-y-2">
              <div className="flex justify-between gap-4 text-xs font-semibold text-slate-500">
                <span className="truncate max-w-[70%]">{product.name}</span>
                <span>{product.revenue.toLocaleString("ru-RU")} ₸</span>
              </div>
              <div className="h-2.5 w-full bg-[var(--surface-container-high)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--chart-2)]"
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
