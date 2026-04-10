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
    <div className="bg-[#131b2e] p-6 rounded-xl h-full">
      <h2 className="text-lg font-bold text-[#dae2fd] mb-6">Источники</h2>
      <div className="space-y-3">
        {data.slice(0, 5).map((item, index) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          const { dot } = SOURCE_COLORS[index % SOURCE_COLORS.length];
          return (
            <div key={item.name} className="flex justify-between items-center p-3 bg-[#171f33] rounded-lg border border-[#46455420]">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-2 h-2 rounded-full ${dot}`} />
                <span className="text-sm font-medium text-[#dae2fd] truncate">{item.name || "Неизвестно"}</span>
              </div>
              <span className="text-sm font-bold text-[#dae2fd] pl-3">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
