"use client";

import { useEffect, useMemo, useState } from "react";
import { HelpCircle, X } from "lucide-react";

type TourStep = {
  id: string;
  title: string;
  description: string;
};

type Position = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const TOUR_STORAGE_KEY = "dashboard-tour-completed";

const steps: TourStep[] = [
  {
    id: "json-upload",
    title: "Загрузка без секрета",
    description:
      "Файл можно выбрать и сразу отправить в pipeline. Дополнительный secret для загрузки и ручного добавления заказа больше не нужен.",
  },
  {
    id: "json-upload",
    title: "Загрузка JSON",
    description:
      "Здесь можно выбрать `mock_orders.json` из репозитория или свой файл такого же формата.",
  },
  {
    id: "run-pipeline",
    title: "Запуск pipeline",
    description:
      "Эта кнопка запускает весь поток: дедупликация, загрузка в RetailCRM и синхронизация в Supabase.",
  },
  {
    id: "manual-order",
    title: "Ручное добавление заказа",
    description:
      "Здесь можно собрать заказ вручную, добавить несколько товаров и отправить его в тот же pipeline.",
  },
  {
    id: "report-link",
    title: "Страница отчёта",
    description:
      "Тут лежит интерактивный отчёт: как строилось приложение, где были проблемы и как они решались.",
  },
  {
    id: "theme-toggle",
    title: "Переключатель темы",
    description:
      "Сверху справа можно переключать светлую и тёмную темы. Выбор сохраняется локально в браузере.",
  },
];

function getPosition(stepId: string): Position | null {
  const element = document.querySelector<HTMLElement>(`[data-tour="${stepId}"]`);
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

export default function AppTour() {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem(TOUR_STORAGE_KEY);
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState<Position | null>(null);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  useEffect(() => {
    if (!isOpen) return;

    function updatePosition() {
      const nextPosition = getPosition(step.id);
      setPosition(nextPosition);

      const element = document.querySelector<HTMLElement>(`[data-tour="${step.id}"]`);
      element?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, step.id]);

  const tooltipStyle = useMemo(() => {
    if (!position) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const top = Math.min(position.top + position.height + 16, window.innerHeight - 260);
    const left = Math.min(position.left, window.innerWidth - 360);

    return {
      top,
      left: Math.max(16, left),
    };
  }, [position]);

  function closeTour(markComplete: boolean) {
    if (markComplete) {
      localStorage.setItem(TOUR_STORAGE_KEY, "true");
    }
    setIsOpen(false);
  }

  function restartTour() {
    setCurrentStep(0);
    setIsOpen(true);
  }

  function nextStep() {
    if (isLastStep) {
      closeTour(true);
      return;
    }
    setCurrentStep((value) => value + 1);
  }

  function previousStep() {
    setCurrentStep((value) => Math.max(0, value - 1));
  }

  return (
    <>
      <div className="fixed right-4 top-20 z-50">
        <button
          type="button"
          onClick={restartTour}
          data-tour="tour-button"
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-2 text-sm font-medium text-[var(--panel-foreground)] shadow-[0_10px_26px_rgba(14,18,28,.10)] transition-transform hover:-translate-y-0.5"
        >
          <HelpCircle className="size-4" />
          Тур
        </button>
      </div>

      {isOpen && (
        <div className="pointer-events-none fixed inset-0 z-[70]">
          <div className="absolute inset-0 bg-black/35" />

          {position && (
            <div
              className="absolute rounded-xl border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,.16)] transition-all"
              style={{
                top: position.top - 8,
                left: position.left - 8,
                width: position.width + 16,
                height: position.height + 16,
              }}
            />
          )}

          <div
            className="pointer-events-auto absolute w-[min(340px,calc(100vw-32px))] rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 text-[var(--panel-foreground)] shadow-[0_24px_48px_rgba(0,0,0,.22)]"
            style={tooltipStyle}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Шаг {currentStep + 1} из {steps.length}
                </p>
                <h3 className="mt-1 text-lg font-bold">{step.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => closeTour(true)}
                className="rounded-lg border border-[var(--panel-border)] p-2 text-slate-500 transition-colors hover:bg-[var(--surface-container-low)]"
                aria-label="Закрыть тур"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="mt-3 text-sm leading-7 text-[var(--on-surface-variant)]">
              {step.description}
            </p>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={previousStep}
                disabled={currentStep === 0}
                className="rounded-lg border border-[var(--panel-border)] px-4 py-2 text-sm font-semibold transition-colors hover:bg-[var(--surface-container-low)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Назад
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => closeTour(true)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-[var(--on-surface-variant)] transition-colors hover:bg-[var(--surface-container-low)]"
                >
                  Пропустить
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:opacity-90"
                >
                  {isLastStep ? "Готово" : "Дальше"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
