"use client";

import { useEffect, useState } from "react";
import type { CategoryConfig } from "@/lib/types";
import { hexToRgba, getContrastingTextColor } from "@/lib/colors";
import CategoryBadge from "./CategoryBadge";

interface EntryFormProps {
  categories: CategoryConfig[];
  slotLimit: number;
  spreadsheetUrl: string;
  onSuccess: () => void;
}

function todayLocal(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function EntryForm({
  categories,
  slotLimit,
  spreadsheetUrl,
  onSuccess,
}: EntryFormProps) {
  const [date, setDate] = useState(todayLocal());
  const [source, setSource] = useState("");
  const [category, setCategory] = useState(categories[0]?.code ?? "");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (!categories.some((c) => c.code === category)) {
      setCategory(categories[0]?.code ?? "");
    }
  }, [categories, category]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!source.trim() || !category || !Number.isFinite(amt) || amt <= 0) return;

    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, source: source.trim(), category, amount: amt }),
      });
      const data = await res.json();

      if (res.ok) {
        setFeedback({ ok: true, msg: "Added!" });
        setSource("");
        setAmount("");
        setDate(todayLocal());
        onSuccess();
        setTimeout(() => setFeedback(null), 3000);
      } else if (res.status === 409 && data.error === "DAY_SLOT_FULL") {
        setFeedback({ ok: false, msg: `This date is full (${slotLimit}/${slotLimit}).` });
      } else {
        setFeedback({ ok: false, msg: data.message ?? data.error ?? "Error" });
      }
    } catch {
      setFeedback({ ok: false, msg: "Network error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-medium text-gray-500">Add Entry</h2>
        <a
          href={spreadsheetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 underline underline-offset-2"
        >
          Open Spreadsheet
        </a>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-4 overflow-hidden"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-400 font-medium">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full min-w-0 appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 h-11 text-gray-900 text-sm focus:outline-none focus:border-gray-400 transition-colors [color-scheme:light]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-400 font-medium">Where</label>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="e.g. Starbucks"
            required
            autoComplete="off"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 h-11 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-400 font-medium">Category</label>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => {
              const isSelected = category === cat.code;
              return (
                <button
                  key={cat.code}
                  type="button"
                  onClick={() => setCategory(cat.code)}
                  className="flex items-center gap-1.5 pl-2 pr-3 py-2 rounded-xl border text-sm font-medium transition-all"
                  style={
                    isSelected
                      ? {
                          backgroundColor: hexToRgba(cat.colorHex, 0.4),
                          color: getContrastingTextColor(cat.colorHex),
                          borderColor: cat.colorHex,
                        }
                      : { backgroundColor: "white", color: "#9ca3af", borderColor: "#e5e7eb" }
                  }
                >
                  <CategoryBadge code={cat.code} colorHex={cat.colorHex} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-400 font-medium">Amount ($)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            required
            inputMode="decimal"
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="font-semibold rounded-xl py-3 text-sm text-white active:scale-95 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
          style={
            feedback
              ? {
                  background: feedback.ok
                    ? "linear-gradient(90deg, #10b981, #34d399, #6ee7b7, #34d399, #10b981)"
                    : "linear-gradient(90deg, #ef4444, #f87171, #fca5a5, #f87171, #ef4444)",
                  backgroundSize: "300% 100%",
                  animation: "btn-shimmer 1.8s linear infinite",
                }
              : { background: "#1f2937" }
          }
        >
          {loading ? "Saving..." : feedback ? feedback.msg : "Add"}
        </button>
      </form>
    </div>
  );
}
