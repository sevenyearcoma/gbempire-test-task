"use client";

import { Cell, Pie, PieChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type StatusData = { name: string; value: number };

const CHART_VARS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export default function ByStatusChart({ data }: { data: StatusData[] }) {
  const chartConfig = Object.fromEntries(
    data.map((item, index) => [
      item.name,
      { label: item.name, color: CHART_VARS[index % CHART_VARS.length] },
    ])
  ) satisfies ChartConfig;

  return (
    <div className="bg-[#131b2e] p-6 rounded-xl">
      <h2 className="text-lg font-bold text-[#dae2fd] mb-6">Статусы</h2>
      <ChartContainer config={chartConfig} className="mx-auto max-h-64">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={90}>
            {data.map((item, index) => (
              <Cell key={item.name} fill={CHART_VARS[index % CHART_VARS.length]} />
            ))}
          </Pie>
          <ChartLegend
            content={<ChartLegendContent nameKey="name" />}
            className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
          />
        </PieChart>
      </ChartContainer>
    </div>
  );
}
