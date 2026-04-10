import Link from "next/link";
import ReportProblemGraph from "@/components/ReportProblemGraph";

const promptGroups = [
  "Понять, в какой момент вообще должны уходить Telegram-уведомления и что именно проверяет код.",
  "Разобраться, почему ручной insert в Supabase ничего не дал и где в цепочке не срабатывает триггер.",
  "Привести Python-скрипты и env variables к одной схеме, чтобы local и Vercel не жили отдельно друг от друга.",
  "Сделать нормальный pipeline для импорта mock orders прямо в dashboard, без ручной возни со скриптами.",
  "Перед деплоем пройтись по безопасности и закрыть очевидные открытые места.",
];

const milestones = [
  {
    title: "Архитектура",
    text: "Сначала я просто разобрал, как уже связаны Next.js, Supabase, RetailCRM и Telegram, чтобы не городить поверх этого ещё одну случайную схему.",
    tone: "bg-[#fff4d6] border-[#f5c451] text-[#5e4300] dark:bg-[#2e2716] dark:border-[#8f7333] dark:text-[#ffe39a]",
  },
  {
    title: "Диагностика webhook",
    text: "Потом нашёл, где именно всё ломается: между insert в orders, вызовом notification endpoint и самой отправкой в Telegram.",
    tone: "bg-[#ffe3dc] border-[#ff8f7b] text-[#6d2012] dark:bg-[#321d1a] dark:border-[#b66658] dark:text-[#ffc8bc]",
  },
  {
    title: "Нормализация env и скриптов",
    text: "После этого выровнял скрипты и server-side конфигурацию под один набор env variables, чтобы local и Vercel вели себя одинаково.",
    tone: "bg-[#dcf6ff] border-[#61c8ea] text-[#0d4660] dark:bg-[#162c34] dark:border-[#4c90a7] dark:text-[#b7ebff]",
  },
  {
    title: "Импорт прямо из dashboard",
    text: "Основную автоматизацию перенёс из ручных скриптов прямо в dashboard: JSON upload -> RetailCRM -> sync в Supabase -> уведомления через webhook.",
    tone: "bg-[#ddf7e6] border-[#6fc28d] text-[#144b28] dark:bg-[#162b20] dark:border-[#4d8a63] dark:text-[#b8efca]",
  },
];

const accentCards = [
  {
    title: "Почему отчёт внутри проекта",
    text: "Если честно, мне просто показалось, что это будет прикольно. Понимаю, что это тестовое, но здесь я сознательно дал себе немного свободы и сделал отчёт частью самого продукта.",
    tone: "bg-[#fff2f7] border-[#ff8ab6] text-[#6d1638] dark:bg-[#311b25] dark:border-[#a95f79] dark:text-[#ffc3d8]",
  },
  {
    title: "Если нужен более строгий формат",
    text: "Если нужен более строгий вариант, это без проблем можно свернуть в PDF или обычный README. Здесь я просто выбрал более живую форму, потому что мне хотелось показать ход работы чуть нагляднее.",
    tone: "bg-[#eef0ff] border-[#8b92ff] text-[#252a6a] dark:bg-[#1f2340] dark:border-[#666cb9] dark:text-[#c5c9ff]",
  },
  {
    title: "Что получилось в финале",
    text: "В итоге получился не просто экран с заказами, а рабочий набор: upload pipeline, sync в Supabase, Telegram-уведомления и базовая защита перед выкладкой.",
    tone: "bg-[#e8fff7] border-[#46d8a3] text-[#0f4d38] dark:bg-[#142a23] dark:border-[#3e9a79] dark:text-[#b7f3dd]",
  },
];

export default function ReportPage() {
  const stageClass =
    "snap-start min-h-screen flex items-center py-8";

  return (
    <main className="mx-auto h-screen max-w-7xl snap-y snap-mandatory overflow-y-auto scroll-smooth px-6">
      <section className={stageClass}>
        <div className="w-full overflow-hidden rounded-xl border border-[var(--hero-border)] bg-[var(--hero-bg)] p-8 text-foreground shadow-[0_10px_28px_rgba(14,18,28,.05)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Короткий отчёт</p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Как я собирал этот dashboard и по ходу приводил его в порядок
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--on-surface-variant)]">
                По сути задача была такая: заказы идут из RetailCRM, попадают в Supabase,
                отображаются в dashboard и при нужных условиях улетают в Telegram. Отчёт я сделал
                прямо внутри проекта просто потому, что мне это показалось удачной и живой формой
                подачи. Я понимаю, что это тестовое задание, так что если нужен более спокойный
                формат, всё это легко превращается в PDF или обычный текстовый отчёт.
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-[0_16px_30px_rgba(14,18,28,.14)] transition-transform hover:-translate-y-0.5"
            >
              Вернуться к dashboard
            </Link>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {accentCards.map((card) => (
              <div key={card.title} className={`rounded-xl border p-6 ${card.tone}`}>
                <p className="text-xs font-bold uppercase tracking-widest opacity-75">Заметка</p>
                <h2 className="mt-3 text-xl font-bold">{card.title}</h2>
                <p className="mt-3 text-sm leading-7 opacity-90">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={stageClass}>
        <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.88fr)]">
          <div className="rounded-xl border border-[#67c7e2] bg-[#f3fbff] p-6 text-[#102632] dark:bg-[#17252d] dark:border-[#3e7b90] dark:text-[#d5eff9]">
            <p className="text-xs font-bold uppercase tracking-widest text-[#21617b] dark:text-[#8fd8f3]">Подход</p>
            <h2 className="mt-2 text-3xl font-bold">Как я это делал</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {milestones.map((item) => (
                <div key={item.title} className={`rounded-xl border p-5 ${item.tone}`}>
                  <h3 className="text-base font-bold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#d8a74f] bg-[#fffaf0] p-6 text-[#2f2413] dark:bg-[#2b2417] dark:border-[#8e6c33] dark:text-[#f5e7c5]">
            <p className="text-xs font-bold uppercase tracking-widest text-[#8a621d] dark:text-[#f2c46b]">Промпты</p>
            <h2 className="mt-2 text-3xl font-bold">Какими запросами я пользовался</h2>
            <ul className="mt-6 space-y-3">
              {promptGroups.map((prompt, index) => (
                <li key={prompt} className="rounded-xl border border-[#edd6a4] bg-white px-4 py-4 text-sm leading-7 shadow-[0_8px_24px_rgba(160,122,48,.08)] dark:bg-[#181d26] dark:border-[#4f4839] dark:shadow-none">
                  <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#2f2413] text-xs font-bold text-white dark:bg-[#f2c46b] dark:text-[#2b2417]">
                    {index + 1}
                  </span>
                  {prompt}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className={stageClass}>
        <div className="w-full">
          <ReportProblemGraph />
        </div>
      </section>

      <section className={stageClass}>
        <div className="w-full rounded-xl border border-[#d8d3f5] bg-[#fcfbff] p-6 dark:bg-[#181d26] dark:border-[#37465c]">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-[#f0bfd3] bg-[#fff4f8] p-5 text-[#4d2432] dark:bg-[#2b1a21] dark:border-[#7e4c5e] dark:text-[#ffd2e0]">
              <p className="text-xs font-bold uppercase tracking-widest text-[#9b5670] dark:text-[#ff9cbc]">Итог</p>
              <p className="mt-3 text-sm leading-7">
                В финале это уже выглядит как цельная штука, а не как набор разрозненных файлов:
                import, sync, analytics, webhook notifications и базовая защита собраны в одном месте.
              </p>
            </div>

            <div className="rounded-xl border border-[#bde5d7] bg-[#f3fff8] p-5 text-[#174332] dark:bg-[#15241e] dark:border-[#486f60] dark:text-[#caf2de]">
              <p className="text-xs font-bold uppercase tracking-widest text-[#2c7a5d] dark:text-[#7edbb6]">Что мне хотелось показать</p>
              <p className="mt-3 text-sm leading-7">
                Мне хотелось показать не только финальный экран, но и сам ход работы: где я
                запутался, что проверял, как принимал решения и как постепенно собирал всё в одну
                понятную систему.
              </p>
            </div>

            <div className="rounded-xl border border-[#bcd2ef] bg-[#f4f9ff] p-5 text-[#163553] dark:bg-[#15202d] dark:border-[#456181] dark:text-[#cde6ff]">
              <p className="text-xs font-bold uppercase tracking-widest text-[#2c5f98] dark:text-[#8bc0ff]">Что можно сделать дальше</p>
              <p className="mt-3 text-sm leading-7">
                Дальше я бы добавил журнал импортов, историю неудачных отправок в Telegram и
                отдельный небольшой лог по webhook-событиям, чтобы это было удобнее поддерживать.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
