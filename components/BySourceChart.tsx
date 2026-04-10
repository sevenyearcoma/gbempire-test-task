"use client";

type SourceData = { name: string; value: number };

const SOURCE_COLORS = [
  { dot: "bg-primary" },
  { dot: "bg-[#4edea3]" },
  { dot: "bg-[#b9c8de]" },
  { dot: "bg-[#8083ff]" },
  { dot: "bg-slate-500" },
];

export default function BySourceChart({ data }: { data: SourceData[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-6 h-full shadow-[0_10px_28px_rgba(14,18,28,.05)]">
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Acquisition</p>
        <h2 className="mt-1 text-lg font-bold text-foreground">Источники</h2>
      </div>
      <div className="space-y-3">
        {data.slice(0, 5).map((item, index) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          const { dot } = SOURCE_COLORS[index % SOURCE_COLORS.length];
          return (
            <div key={item.name} className="flex justify-between items-center p-3 bg-[var(--surface-bright)] rounded-lg border border-[var(--panel-border)]">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-2 h-2 rounded-full ${dot}`} />
                <span className="text-sm font-medium text-foreground truncate">{item.name || "Неизвестно"}</span>
              </div>
              <span className="text-sm font-bold text-foreground pl-3">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
