"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useSWR from "swr";
import BudgetSummary from "@/components/BudgetSummary";
import CategoryBreakdown from "@/components/CategoryBreakdown";
import EntryForm from "@/components/EntryForm";
import type { MonthlySummary } from "@/lib/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("fetch error");
    return r.json();
  });

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/signin");
    }
  }, [status, router]);

  const {
    data: summary,
    error,
    isLoading,
    mutate,
  } = useSWR<MonthlySummary>(
    status === "authenticated" ? "/api/summary" : null,
    fetcher
  );

  if (status === "loading" || status === "unauthenticated") {
    return <LoadingScreen />;
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-safe">
      <div className="max-w-md mx-auto px-4 pt-6 pb-10 flex flex-col gap-4">

        {/* Month label */}
        {summary && (
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            {summary.month}
          </p>
        )}

        {/* Budget Summary */}
        {isLoading ? (
          <SummarySkeleton />
        ) : error ? (
          <ErrorCard onRetry={() => mutate()} />
        ) : summary ? (
          <BudgetSummary
            budget={summary.budget}
            used={summary.used}
            left={summary.left}
          />
        ) : null}

        {/* Category Breakdown */}
        {summary && summary.categories.some((c) => c.total > 0) && (
          <CategoryBreakdown categories={summary.categories} used={summary.used} />
        )}

        {/* Entry Form */}
        <EntryForm onSuccess={() => mutate()} />
      </div>
    </main>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
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

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 items-center text-center">
      <p className="text-gray-500 text-sm">Couldn&apos;t load budget data.</p>
      <button
        onClick={onRetry}
        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full px-4 py-2 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}
