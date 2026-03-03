"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useSWR from "swr";
import BudgetSummary from "@/components/BudgetSummary";
import CategoryBreakdown from "@/components/CategoryBreakdown";
import EntryForm from "@/components/EntryForm";
import type { MonthlySummary } from "@/lib/types";
import Image from "next/image";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("fetch error");
    return r.json();
  });

export default function DashboardPage() {
  const { data: session, status } = useSession();
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
    <main className="min-h-screen bg-black text-white pb-safe">
      <div className="max-w-md mx-auto px-4 pt-6 pb-10 flex flex-col gap-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Image src="/icons/icon.svg" alt="Monee" width={20} height={20} />
            </div>
            <span className="font-bold text-lg tracking-tight">Monee</span>
          </div>
          <div className="flex items-center gap-3">
            {summary && (
              <span className="text-xs text-zinc-500 font-medium">{summary.month}</span>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Sign out
            </button>
          </div>
        </header>

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
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="flex gap-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex-1 h-20 bg-zinc-900 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3 items-center text-center">
      <p className="text-zinc-400 text-sm">Couldn&apos;t load budget data.</p>
      <button
        onClick={onRetry}
        className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white rounded-full px-4 py-2 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}
