"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, UploadCloud, XCircle } from "lucide-react";

type PipelineSummary = {
  received: number;
  uniqueInput: number;
  skippedDuplicateInput: number;
  skippedExistingRetailCrm: number;
  uploadedToRetailCrm: number;
  retailCrmOrdersFetched: number;
  supabaseUpserted: number;
  supabaseInsertedEstimate: number;
  supabaseUpdatedEstimate: number;
};

type PipelineResponse =
  | { ok: true; summary: PipelineSummary }
  | { error: string };

const statsLabels: Record<keyof PipelineSummary, string> = {
  received: "В файле",
  uniqueInput: "Уникальных",
  skippedDuplicateInput: "Дубли в файле",
  skippedExistingRetailCrm: "Уже были в RetailCRM",
  uploadedToRetailCrm: "Загружено в RetailCRM",
  retailCrmOrdersFetched: "Получено из RetailCRM",
  supabaseUpserted: "Записано в Supabase",
  supabaseInsertedEstimate: "Новых в Supabase",
  supabaseUpdatedEstimate: "Обновлено в Supabase",
};

function getOrderCount(value: unknown) {
  if (Array.isArray(value)) return value.length;
  if (
    value &&
    typeof value === "object" &&
    Array.isArray((value as { orders?: unknown }).orders)
  ) {
    return (value as { orders: unknown[] }).orders.length;
  }
  return null;
}

export default function OrdersPipelineUploader() {
  const router = useRouter();
  const [fileName, setFileName] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [pipelineSecret, setPipelineSecret] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<PipelineSummary | null>(null);

  const parsedCount = useMemo(() => {
    if (!jsonText.trim()) return null;

    try {
      return getOrderCount(JSON.parse(jsonText));
    } catch {
      return null;
    }
  }, [jsonText]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    setSummary(null);

    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setJsonText(await file.text());
  }

  async function runPipeline() {
    setError("");
    setSummary(null);

    let payload: unknown;
    try {
      payload = JSON.parse(jsonText);
    } catch {
      setError("JSON не читается. Проверь файл и попробуй снова.");
      return;
    }

    if (getOrderCount(payload) === null) {
      setError("Нужен JSON-массив заказов или объект вида { orders: [] }.");
      return;
    }

    setIsUploading(true);

    try {
      const response = await fetch("/api/orders/pipeline", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-pipeline-secret": pipelineSecret,
        },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as PipelineResponse;

      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Pipeline failed");
      }

      setSummary(data.summary);
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Pipeline failed");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="bg-[#131b2e] rounded-xl overflow-hidden">
      <div className="p-5 border-b border-[#46455420] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Выгрузка заказов
          </p>
          <h2 className="text-xl font-bold text-[#dae2fd] mt-1">Mock orders JSON</h2>
          <p className="text-sm text-slate-400 mt-2 max-w-3xl">
            JSON уходит в RetailCRM без повторной загрузки дублей, затем заказы синхронизируются
            в Supabase. Telegram отправляет Supabase webhook при новых INSERT.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="password"
            value={pipelineSecret}
            onChange={(event) => setPipelineSecret(event.target.value)}
            placeholder="Секрет выгрузки"
            className="min-w-56 rounded-lg bg-[#222a3d] px-4 py-3 text-sm text-[#dae2fd] outline-none placeholder:text-slate-500 focus:ring-1 focus:ring-primary"
          />
          <label className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg bg-[#222a3d] hover:bg-[#2d3449] px-4 py-3 text-sm font-semibold text-[#dae2fd] transition-colors">
            <UploadCloud className="size-4" />
            Выбрать JSON
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>
          <button
            type="button"
            onClick={runPipeline}
            disabled={!jsonText || !pipelineSecret || isUploading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-[#d7d7ff] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            Запустить pipeline
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-[#222a3d] px-3 py-1 text-slate-300">
            {fileName || "Файл не выбран"}
          </span>
          {parsedCount !== null && (
            <span className="rounded-full bg-[#4edea3]/10 px-3 py-1 text-[#4edea3]">
              Заказов в JSON: {parsedCount}
            </span>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-[#ffb4ab]/30 bg-[#ffb4ab]/10 p-4 text-sm text-[#ffb4ab]">
            <XCircle className="size-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {(Object.keys(statsLabels) as Array<keyof PipelineSummary>).map((key) => (
              <div key={key} className="rounded-lg bg-[#171f33] p-4">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">
                  {statsLabels[key]}
                </p>
                <p className="mt-2 text-2xl font-bold text-[#dae2fd]">{summary[key]}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
