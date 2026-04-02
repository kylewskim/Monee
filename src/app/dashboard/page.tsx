"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";
import BudgetSummary from "@/components/BudgetSummary";
import CategoryBreakdown from "@/components/CategoryBreakdown";
import EntryForm from "@/components/EntryForm";
import SetupForm from "@/components/SetupForm";
import type { BootstrapResponse, MonthlySummary } from "@/lib/types";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.message ?? data.error ?? "fetch error");
    throw error;
  }
  return data;
};

const MONTH_NAMES: Record<string, string> = {
  Jan: "January",
  Feb: "February",
  Mar: "March",
  Apr: "April",
  May: "May",
  Jun: "June",
  Jul: "July",
  Aug: "August",
  Sep: "September",
  Oct: "October",
  Nov: "November",
  Dec: "December",
};

const MONTH_ABBRS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatMonth(tabName: string): string {
  const match = tabName.match(/^([A-Za-z]{3})(\d{4})$/);
  if (!match) return tabName;
  return `${MONTH_NAMES[match[1]] ?? match[1]} ${match[2]}`;
}

function getMonthOptions(): string[] {
  const options: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push(`${MONTH_ABBRS[d.getMonth()]}${d.getFullYear()}`);
  }
  return options;
}

function ChevronRight() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ChevronUp() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 15l-6-6-6 6" />
    </svg>
  );
}

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const [timeZone, setTimeZone] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimeZone(browserTimeZone || "UTC");
  }, []);

  const {
    data: bootstrap,
    error: bootstrapError,
    isLoading: bootstrapLoading,
    mutate: mutateBootstrap,
  } = useSWR<BootstrapResponse>(
    status === "authenticated" && timeZone
      ? `/api/bootstrap?tz=${encodeURIComponent(timeZone)}`
      : null,
    fetcher,
    { refreshInterval: 60_000 }
  );

  const summaryKey =
    status === "authenticated" && bootstrap?.status === "ready" && timeZone
      ? selectedMonth
        ? `/api/summary?month=${encodeURIComponent(selectedMonth)}&tz=${encodeURIComponent(timeZone)}`
        : `/api/summary?tz=${encodeURIComponent(timeZone)}`
      : null;

  const {
    data: summary,
    error: summaryError,
    isLoading: summaryLoading,
    mutate: mutateSummary,
  } = useSWR<MonthlySummary>(summaryKey, fetcher, {
    refreshInterval: selectedMonth ? 0 : 60_000,
  });

  if (status === "loading" || status === "unauthenticated" || !timeZone || bootstrapLoading) {
    return <LoadingScreen />;
  }

  if (bootstrapError) {
    return <ErrorCard message="Couldn't bootstrap your sheet." onRetry={() => mutateBootstrap()} />;
  }

  if (!bootstrap) {
    return <ErrorCard message="Missing bootstrap state." onRetry={() => mutateBootstrap()} />;
  }

  if (bootstrap.status === "needs_setup") {
    return (
      <main className="min-h-screen bg-gray-50 text-gray-900 pb-safe">
        <div className="max-w-md mx-auto px-4 pt-safe pb-10">
          <SetupForm onSuccess={() => mutateBootstrap()} timeZone={timeZone} />
        </div>
      </main>
    );
  }

  const displayMonth = selectedMonth ?? summary?.month ?? bootstrap.currentMonth;
  const hasBreakdown = summary?.categories.some((c) => c.total > 0);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 pb-safe">
      <div className="max-w-md mx-auto px-4 pt-safe pb-10 flex flex-col gap-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <div className="relative">
              <button
                onClick={() => setShowMonthPicker(!showMonthPicker)}
                className="flex items-center gap-1 text-sm font-medium text-gray-500"
              >
                {displayMonth ? formatMonth(displayMonth) : "\u00a0"}
                <ChevronRight />
              </button>
              {showMonthPicker && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-sm z-20 py-1 min-w-36 overflow-hidden">
                  {getMonthOptions().map((month) => (
                    <button
                      key={month}
                      onClick={() => {
                        setSelectedMonth(month);
                        setShowMonthPicker(false);
                        setShowBreakdown(true);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        (selectedMonth ?? summary?.month ?? bootstrap.currentMonth) === month
                          ? "text-gray-900 font-medium bg-gray-50"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {formatMonth(month)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {hasBreakdown && (
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="flex items-center gap-1 text-xs font-medium text-gray-400"
              >
                {showBreakdown ? "Hide" : "Show"} breakdown
                {showBreakdown ? <ChevronUp /> : <ChevronDown />}
              </button>
            )}
          </div>

          {summaryLoading ? (
            <SummarySkeleton />
          ) : summaryError ? (
            <ErrorCard message="Couldn't load budget data." onRetry={() => mutateSummary()} />
          ) : summary ? (
            <BudgetSummary budget={summary.budget} used={summary.used} left={summary.left} />
          ) : null}
        </div>

        {hasBreakdown && summary && (
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              showBreakdown ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <CategoryBreakdown categories={summary.categories} used={summary.used} />
          </div>
        )}

        <div className="mt-4">
          <EntryForm
            categories={bootstrap.config.categories}
            slotLimit={bootstrap.config.slotLimit}
            spreadsheetUrl={bootstrap.spreadsheetUrl}
            onSuccess={() => mutateSummary()}
          />
        </div>
      </div>
    </main>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="flex gap-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex-1 h-20 bg-gray-200 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}

function ErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 items-center text-center">
      <p className="text-gray-500 text-sm">{message}</p>
      <button
        onClick={onRetry}
        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full px-4 py-2 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}
