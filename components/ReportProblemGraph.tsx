"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  Node,
  Edge,
  NodeMouseHandler,
} from "reactflow";
import "reactflow/dist/style.css";

type IssueDetail = {
  id: string;
  title: string;
  summary: string;
  problems: string[];
  solution: string[];
  impact: string;
  accent: string;
  panel: string;
};

const issueDetails: IssueDetail[] = [
  {
    id: "supabase-trigger",
    title: "Сначала я не так понял роль Supabase",
    summary: "Поначалу казалось, что ручной insert в orders сам по себе должен запускать Telegram-уведомление.",
    problems: [
      "Уведомления не были привязаны к вставке строки напрямую.",
      "Endpoint ждал HTTP POST, а не сам слушал таблицу.",
      "Ручной тест через Table Editor не вызывал Next.js route.",
    ],
    solution: [
      "Разобрал route уведомлений и увидел, что он вообще работает только по webhook POST.",
      "Собрал нормальную схему с Supabase Database Webhook на INSERT orders.",
      "Оставил именно webhook-цепочку как основной production-путь для Telegram.",
    ],
    impact: "В итоге уведомления приходят не только после локального скрипта, но и после любой внешней записи в orders через настроенный Supabase webhook.",
    accent: "#ff8f7b",
    panel: "border-[#ffb4a3] bg-[#fff0eb] text-[#6d2012]",
  },
  {
    id: "env-drift",
    title: "У конфигурации было два разных языка",
    summary: "Локальные скрипты и Next.js ждали разные имена переменных, поэтому синхронизация вела себя неровно.",
    problems: [
      "Python-скрипты ждали SUPABASE_URL и SUPABASE_KEY.",
      "Проект уже жил на NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY.",
      "dotenv по умолчанию не читал .env.local.",
    ],
    solution: [
      "Перевёл скрипты на актуальные имена env variables.",
      "Добавил явную загрузку .env.local в Python.",
      "Убрал fallback на anon key в server-side Supabase client, чтобы не ловить скрытые проблемы с RLS.",
    ],
    impact: "Теперь local и Vercel живут на одной конфигурации, а ошибки проявляются сразу, а не боком позже.",
    accent: "#f3bb45",
    panel: "border-[#f5d173] bg-[#fff7df] text-[#5d4300]",
  },
  {
    id: "telegram-delivery",
    title: "С Telegram пришлось разбираться отдельно",
    summary: "Vercel route мог возвращать 200 OK, но это ещё не значило, что сообщение реально дошло в Telegram Bot API.",
    problems: [
      "Скрипт сначала считал успехом любой 200 от Vercel route.",
      "Нужно было отделить авторизацию webhook от реальной отправки в Telegram.",
      "В production токен бота не совпадал с локальным рабочим токеном.",
    ],
    solution: [
      "Добавил подробный вывод response body для webhook.",
      "Проверил chat_id напрямую из telegram_users и отправил тест через Telegram API.",
      "Так и локализовал проблему до Vercel env с TELEGRAM_BOT_TOKEN.",
    ],
    impact: "После этого отладка стала намного проще: видно sent и failed, и сразу понятно, где именно ломается цепочка.",
    accent: "#61c8ea",
    panel: "border-[#9edcf2] bg-[#eefaff] text-[#0d4660]",
  },
  {
    id: "pipeline-automation",
    title: "Ручной upload и sync были просто неудобны",
    summary: "До финальной версии загрузка mock orders и sync жили в отдельных Python-скриптах.",
    problems: [
      "Pipeline зависел от локального запуска.",
      "Нельзя было красиво показать процесс прямо в dashboard.",
      "Был риск дублей и неочевидного порядка действий: upload -> sync -> notification.",
    ],
    solution: [
      "Перенёс pipeline в Next.js route /api/orders/pipeline.",
      "Добавил UI-блок в dashboard для загрузки JSON и запуска процесса.",
      "Сделал дедупликацию внутри файла и пропуск уже существующих заказов в RetailCRM.",
    ],
    impact: "В итоге оператор загружает JSON прямо из интерфейса и сразу видит, что именно произошло после импорта.",
    accent: "#46d8a3",
    panel: "border-[#9ee8ca] bg-[#effff8] text-[#0f4d38]",
  },
  {
    id: "security-hardening",
    title: "Перед деплоем пришлось притормозить и закрыть дыры",
    summary: "Dashboard и import route были слишком открыты для production-среды.",
    problems: [
      "PII заказов была доступна без дополнительного барьера.",
      "Pipeline route мог бы использоваться любым POST-запросом.",
      "Telegram webhook принимал /start без дополнительной проверки secret token.",
    ],
    solution: [
      "Добавил Basic Auth на dashboard через proxy.ts.",
      "Закрыл pipeline route через x-pipeline-secret.",
      "Добавил optional TELEGRAM_WEBHOOK_SECRET для Telegram webhook.",
    ],
    impact: "Перед выкладкой приложение стало заметно спокойнее с точки зрения безопасности: ключевые административные и интеграционные точки теперь контролируются секретами.",
    accent: "#8b92ff",
    panel: "border-[#c5c8ff] bg-[#f3f4ff] text-[#252a6a]",
  },
];

const issueMap = Object.fromEntries(issueDetails.map((item) => [item.id, item]));

function issueNodeStyle(accent: string, background: string, color: string) {
  return {
    background,
    color,
    border: `1px solid ${accent}`,
    borderRadius: 8,
    width: 190,
    padding: 13,
    whiteSpace: "pre-line" as const,
    boxShadow: "0 14px 36px rgba(18,22,33,.10)",
    fontWeight: 600,
  };
}

function baseEdge(source: string, target: string, stroke: string): Edge {
  return {
    id: `${source}-${target}`,
    source,
    target,
    type: "smoothstep",
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: stroke,
    },
    style: {
      stroke,
      strokeWidth: 1.6,
    },
  };
}

export default function ReportProblemGraph() {
  const [selectedId, setSelectedId] = useState<string>("supabase-trigger");
  const [isDark, setIsDark] = useState(false);
  const selectedIssue = issueMap[selectedId];

  useEffect(() => {
    const updateTheme = () => setIsDark(document.documentElement.classList.contains("dark"));
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const nodes = useMemo<Node[]>(() => [
    {
      id: "goal",
      position: { x: 40, y: 210 },
      data: { label: "Собрать рабочий dashboard\nRetailCRM -> Supabase -> Telegram" },
      style: {
        background: isDark ? "#1b2230" : "#1f1720",
        color: isDark ? "#eef2f7" : "#fffdf7",
        border: isDark ? "1px solid rgba(117,136,161,.24)" : "1px solid rgba(255,255,255,.18)",
        borderRadius: 8,
        width: 250,
        padding: 16,
        whiteSpace: "pre-line",
        fontWeight: 700,
        boxShadow: isDark ? "0 18px 40px rgba(0,0,0,.28)" : "0 18px 40px rgba(31,23,32,.24)",
      },
    },
    {
      id: "supabase-trigger",
      position: { x: 350, y: 40 },
      data: { label: "Supabase\nне триггерил\nсам по себе" },
      style: issueNodeStyle("#ff8f7b", isDark ? "#301f22" : "#fff1ec", isDark ? "#ffd1c7" : "#5f1f13"),
    },
    {
      id: "env-drift",
      position: { x: 350, y: 190 },
      data: { label: "Разъехались\nenv variables" },
      style: issueNodeStyle("#f3bb45", isDark ? "#31291b" : "#fff7df", isDark ? "#ffe39a" : "#604500"),
    },
    {
      id: "telegram-delivery",
      position: { x: 350, y: 340 },
      data: { label: "Telegram\nне доставлял\nсообщения" },
      style: issueNodeStyle("#61c8ea", isDark ? "#182b33" : "#eefaff", isDark ? "#c5edfb" : "#0d4660"),
    },
    {
      id: "pipeline-automation",
      position: { x: 690, y: 120 },
      data: { label: "Pipeline был\nручным и хрупким" },
      style: issueNodeStyle("#46d8a3", isDark ? "#162821" : "#effff8", isDark ? "#c4f5df" : "#0f4d38"),
    },
    {
      id: "security-hardening",
      position: { x: 690, y: 300 },
      data: { label: "Перед деплоем\nне хватало\nзащиты" },
      style: issueNodeStyle("#8b92ff", isDark ? "#232742" : "#f3f4ff", isDark ? "#d7daff" : "#252a6a"),
    },
  ], [isDark]);

  const edges = useMemo<Edge[]>(() => [
    baseEdge("goal", "supabase-trigger", "#ff8f7b"),
    baseEdge("goal", "env-drift", "#f3bb45"),
    baseEdge("goal", "telegram-delivery", "#61c8ea"),
    baseEdge("env-drift", "pipeline-automation", "#46d8a3"),
    baseEdge("telegram-delivery", "security-hardening", "#8b92ff"),
    baseEdge("pipeline-automation", "security-hardening", "#8b92ff"),
  ], []);

  const selectedNodes = useMemo(
    () =>
      nodes.map((node) => {
        const issue = issueMap[node.id];
        return {
          ...node,
          style:
            node.id === selectedId && issue
              ? {
                  ...node.style,
                  boxShadow: `0 0 0 3px ${issue.accent}40, 0 22px 50px rgba(20,24,35,.18)`,
                }
              : node.style,
        };
      }),
    [nodes, selectedId]
  );

  const onNodeClick = useCallback<NodeMouseHandler>(
    (_, node) => {
      if (issueMap[node.id]) setSelectedId(node.id);
    },
    []
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Граф проблем</p>
          <h2 className="mt-1 text-3xl font-bold text-foreground">Ключевые проблемы и решения</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--on-surface-variant)]">
            Здесь оставлены только основные узлы. По клику можно посмотреть, что именно ломалось,
            как я это разбирал и чем в итоге закрыл проблему.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm font-semibold text-[var(--panel-foreground)] shadow-[0_10px_24px_rgba(31,23,32,.10)] transition-transform hover:-translate-y-0.5"
        >
          Вернуться к dashboard
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.85fr)]">
        <div className="h-[640px] overflow-hidden rounded-xl border border-[var(--panel-border)] bg-[var(--panel)]">
          <ReactFlow
            nodes={selectedNodes}
            edges={edges}
            onNodeClick={onNodeClick}
            fitView
            minZoom={0.7}
            maxZoom={1.4}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable
          >
            <MiniMap
              pannable
              zoomable
              maskColor={isDark ? "rgba(15,20,28,.72)" : "rgba(255,247,233,.72)"}
              nodeColor="#8b92ff"
              style={{ background: isDark ? "#161d26" : "#fffdfa", border: isDark ? "1px solid rgba(117,136,161,.24)" : "1px solid rgba(31,23,32,.12)" }}
            />
            <Controls
              showInteractive={false}
              style={{ background: isDark ? "#161d26" : "#fffdfa", border: isDark ? "1px solid rgba(117,136,161,.24)" : "1px solid rgba(31,23,32,.12)" }}
            />
            <Background color={isDark ? "#2a3749" : "#eadfcb"} gap={20} />
          </ReactFlow>
        </div>

        <aside className={`rounded-xl border p-6 ${selectedIssue.panel}`}>
          <p className="text-xs font-bold uppercase tracking-widest opacity-70">Выбранная проблема</p>
          <h3 className="mt-2 text-2xl font-bold">{selectedIssue.title}</h3>
          <p className="mt-3 text-sm leading-7 opacity-90">{selectedIssue.summary}</p>

          <div className="mt-6 space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-70">Что мешало</p>
              <ul className="mt-3 space-y-3 text-sm">
                {selectedIssue.problems.map((problem) => (
                  <li key={problem} className="rounded-lg border border-black/8 bg-white/70 px-4 py-3 leading-6 shadow-[0_8px_22px_rgba(20,24,35,.05)]">
                    {problem}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-70">Как решал</p>
              <ul className="mt-3 space-y-3 text-sm">
                {selectedIssue.solution.map((item) => (
                  <li key={item} className="rounded-lg border border-black/8 bg-white/70 px-4 py-3 leading-6 shadow-[0_8px_22px_rgba(20,24,35,.05)]">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-black/10 bg-white/75 p-4 shadow-[0_10px_28px_rgba(20,24,35,.06)]">
              <p className="text-xs font-bold uppercase tracking-widest opacity-70">Итог</p>
              <p className="mt-2 text-sm leading-7">{selectedIssue.impact}</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
