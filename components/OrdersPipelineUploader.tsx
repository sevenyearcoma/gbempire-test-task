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

type ManualOrderForm = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  city: string;
  deliveryAddress: string;
  utmSource: string;
  items: ManualOrderItem[];
};

type ManualOrderItem = {
  productName: string;
  quantity: string;
  initialPrice: string;
};

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

function getInitialManualOrder(): ManualOrderForm {
  return {
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    city: "",
    deliveryAddress: "",
    utmSource: "",
    items: [getInitialManualOrderItem()],
  };
}

function getInitialManualOrderItem(): ManualOrderItem {
  return {
    productName: "",
    quantity: "1",
    initialPrice: "",
  };
}

export default function OrdersPipelineUploader() {
  const router = useRouter();
  const [fileName, setFileName] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [pipelineSecret, setPipelineSecret] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<PipelineSummary | null>(null);
  const [manualOrder, setManualOrder] = useState<ManualOrderForm>(getInitialManualOrder);

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

  function handleManualOrderChange<K extends keyof ManualOrderForm>(
    key: K,
    value: ManualOrderForm[K]
  ) {
    setManualOrder((current) => ({ ...current, [key]: value }));
  }

  function handleManualOrderItemChange(
    index: number,
    key: keyof ManualOrderItem,
    value: string
  ) {
    setManualOrder((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      ),
    }));
  }

  function addManualOrderItem() {
    setManualOrder((current) => ({
      ...current,
      items: [...current.items, getInitialManualOrderItem()],
    }));
  }

  function removeManualOrderItem(index: number) {
    setManualOrder((current) => ({
      ...current,
      items:
        current.items.length === 1
          ? current.items
          : current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function sendPipelinePayload(payload: unknown) {
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
      await sendPipelinePayload(payload);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Pipeline failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function createManualOrder() {
    setError("");
    setSummary(null);

    if (!pipelineSecret) {
      setError("Нужен секрет выгрузки.");
      return;
    }

    if (
      !manualOrder.firstName.trim() ||
      !manualOrder.phone.trim()
    ) {
      setError("Для ручного заказа нужны минимум имя и телефон.");
      return;
    }

    const items = manualOrder.items
      .map((item) => ({
        productName: item.productName.trim(),
        quantity: Number(item.quantity),
        initialPrice: Number(item.initialPrice),
      }))
      .filter((item) => item.productName);

    if (items.length === 0) {
      setError("Добавь хотя бы один товар.");
      return;
    }

    if (items.some((item) => !Number.isFinite(item.quantity) || item.quantity <= 0)) {
      setError("Количество у каждого товара должно быть больше нуля.");
      return;
    }

    if (items.some((item) => !Number.isFinite(item.initialPrice) || item.initialPrice <= 0)) {
      setError("Цена у каждого товара должна быть больше нуля.");
      return;
    }

    const payload = [
      {
        firstName: manualOrder.firstName.trim(),
        lastName: manualOrder.lastName.trim(),
        phone: manualOrder.phone.trim(),
        email: manualOrder.email.trim(),
        orderType: "eshop-individual",
        orderMethod: "shopping-cart",
        status: "new",
        items,
        delivery: {
          address: {
            city: manualOrder.city.trim(),
            text: manualOrder.deliveryAddress.trim(),
          },
        },
        customFields: {
          utm_source: manualOrder.utmSource.trim(),
        },
      },
    ];

    setIsCreating(true);

    try {
      await sendPipelinePayload(payload);
      setManualOrder(getInitialManualOrder());
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Pipeline failed");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <section className="rounded-xl overflow-hidden border border-[var(--panel-border)] bg-[var(--panel)] shadow-[0_10px_28px_rgba(14,18,28,.05)]">
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--panel-border)] p-5 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Выгрузка заказов
          </p>
          <h2 className="mt-1 text-xl font-bold text-foreground">Mock orders JSON и ручной ввод</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
            Можно загрузить JSON-файл или собрать один заказ вручную. Оба сценария идут в
            один и тот же pipeline: дедупликация, RetailCRM upload и sync в Supabase.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="password"
            value={pipelineSecret}
            onChange={(event) => setPipelineSecret(event.target.value)}
            data-tour="pipeline-secret"
            placeholder="Секрет выгрузки"
            className="min-w-56 rounded-lg border border-[var(--panel-border)] bg-[var(--surface-bright)] px-4 py-3 text-sm text-foreground outline-none placeholder:text-slate-500 focus:ring-1 focus:ring-primary"
          />
          <label
            data-tour="json-upload"
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--panel-border)] bg-[var(--surface-bright)] px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-[var(--surface-container-low)]"
          >
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
            data-tour="run-pipeline"
            disabled={!jsonText || !pipelineSecret || isUploading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            Запустить pipeline
          </button>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full border border-[var(--panel-border)] bg-[var(--surface-container-low)] px-3 py-1 text-[var(--on-surface-variant)]">
            {fileName || "Файл не выбран"}
          </span>
          {parsedCount !== null && (
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-600 dark:text-emerald-400">
              Заказов в JSON: {parsedCount}
            </span>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-600 dark:text-rose-300">
            <XCircle className="size-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {summary && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {(Object.keys(statsLabels) as Array<keyof PipelineSummary>).map((key) => (
              <div
                key={key}
                className="rounded-lg border border-[var(--panel-border)] bg-[var(--surface-bright)] p-4 shadow-[0_8px_24px_rgba(14,18,28,.04)]"
              >
                <p className="text-[10px] uppercase tracking-widest text-slate-500">
                  {statsLabels[key]}
                </p>
                <p className="mt-2 text-2xl font-bold text-foreground">{summary[key]}</p>
              </div>
            ))}
          </div>
        )}

        <div
          data-tour="manual-order"
          className="rounded-xl border border-[var(--panel-border)] bg-[var(--surface-bright)] p-5"
        >
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Ручное добавление
            </p>
            <h3 className="mt-1 text-lg font-bold text-foreground">Новый заказ из формы</h3>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
              Форма собирает один заказ по тому же шаблону, что и пример JSON. Если заказ уже
              был в RetailCRM, pipeline его повторно не загрузит.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Имя</span>
              <input
                value={manualOrder.firstName}
                onChange={(event) => handleManualOrderChange("firstName", event.target.value)}
                className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-foreground outline-none placeholder:text-slate-500 focus:ring-1 focus:ring-primary"
                placeholder="Andrei"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Фамилия</span>
              <input
                value={manualOrder.lastName}
                onChange={(event) => handleManualOrderChange("lastName", event.target.value)}
                className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-foreground outline-none placeholder:text-slate-500 focus:ring-1 focus:ring-primary"
                placeholder="Kuzmin"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Телефон</span>
              <input
                value={manualOrder.phone}
                onChange={(event) => handleManualOrderChange("phone", event.target.value)}
                className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-foreground outline-none placeholder:text-slate-500 focus:ring-1 focus:ring-primary"
                placeholder="+7 700 000 00 00"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Email</span>
              <input
                value={manualOrder.email}
                onChange={(event) => handleManualOrderChange("email", event.target.value)}
                className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-foreground outline-none placeholder:text-slate-500 focus:ring-1 focus:ring-primary"
                placeholder="mail@example.com"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Город</span>
              <input
                value={manualOrder.city}
                onChange={(event) => handleManualOrderChange("city", event.target.value)}
                className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-foreground outline-none placeholder:text-slate-500 focus:ring-1 focus:ring-primary"
                placeholder="Алматы"
              />
            </label>
            <label className="space-y-2 text-sm md:col-span-2 xl:col-span-1">
              <span className="font-medium text-foreground">Адрес доставки</span>
              <input
                value={manualOrder.deliveryAddress}
                onChange={(event) => handleManualOrderChange("deliveryAddress", event.target.value)}
                className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-foreground outline-none placeholder:text-slate-500 focus:ring-1 focus:ring-primary"
                placeholder="ул. Абая, 10"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">UTM source</span>
              <input
                value={manualOrder.utmSource}
                onChange={(event) => handleManualOrderChange("utmSource", event.target.value)}
                className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-foreground outline-none placeholder:text-slate-500 focus:ring-1 focus:ring-primary"
                placeholder="instagram"
              />
            </label>
          </div>

          <div className="mt-5 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Товары</p>
                <p className="mt-1 text-sm text-slate-600">
                  Можно добавить несколько позиций в один заказ.
                </p>
              </div>
              <button
                type="button"
                onClick={addManualOrderItem}
                className="inline-flex items-center justify-center rounded-lg border border-[var(--panel-border)] bg-[var(--surface-bright)] px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-[var(--surface-container-low)]"
              >
                Добавить позицию
              </button>
            </div>

            <div className="space-y-3">
              {manualOrder.items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 gap-3 rounded-lg border border-[var(--panel-border)] bg-[var(--surface-bright)] p-4 md:grid-cols-[minmax(0,1.8fr)_120px_140px_auto]"
                >
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-foreground">Товар {index + 1}</span>
                    <input
                      value={item.productName}
                      onChange={(event) =>
                        handleManualOrderItemChange(index, "productName", event.target.value)
                      }
                      className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-foreground outline-none placeholder:text-slate-500 focus:ring-1 focus:ring-primary"
                      placeholder="Утягивающий комбидресс Nova Slim"
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-foreground">Количество</span>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) =>
                        handleManualOrderItemChange(index, "quantity", event.target.value)
                      }
                      className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-foreground outline-none placeholder:text-slate-500 focus:ring-1 focus:ring-primary"
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-foreground">Цена</span>
                    <input
                      type="number"
                      min="1"
                      value={item.initialPrice}
                      onChange={(event) =>
                        handleManualOrderItemChange(index, "initialPrice", event.target.value)
                      }
                      className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-foreground outline-none placeholder:text-slate-500 focus:ring-1 focus:ring-primary"
                      placeholder="65000"
                    />
                  </label>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeManualOrderItem(index)}
                      disabled={manualOrder.items.length === 1}
                      className="w-full rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={createManualOrder}
              disabled={!pipelineSecret || isCreating}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              Добавить заказ
            </button>
            <button
              type="button"
              onClick={() => setManualOrder(getInitialManualOrder())}
              className="inline-flex items-center justify-center rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-[var(--surface-container-low)]"
            >
              Очистить форму
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
