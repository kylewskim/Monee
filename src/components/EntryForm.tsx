"use client";

import { useState } from "react";
import { CATEGORY_LETTERS, CATEGORIES, type CategoryLetter } from "@/lib/types";
import CategoryBadge from "./CategoryBadge";

interface EntryFormProps {
  onSuccess: () => void;
}

function todayLocal(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function EntryForm({ onSuccess }: EntryFormProps) {
  const [date, setDate] = useState(todayLocal());
  const [source, setSource] = useState("");
  const [category, setCategory] = useState<CategoryLetter>("F");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!source.trim() || isNaN(amt) || amt <= 0) return;

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
        setTimeout(() => setFeedback(null), 2500);
      } else {
        setFeedback({ ok: false, msg: data.error ?? "Error" });
      }
    } catch {
      setFeedback({ ok: false, msg: "Network error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-4"
    >
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
        Add Entry
      </h2>

      {/* Date + Source row */}
      <div className="flex gap-2">
        <div className="flex flex-col gap-1.5 w-36 flex-shrink-0">
          <label className="text-xs text-gray-400">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-gray-400 transition-colors [color-scheme:light]"
          />
        </div>
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-xs text-gray-400">Where</label>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="e.g. Starbucks"
            required
            autoComplete="off"
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm placeholder:text-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>
      </div>

      {/* Category */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-400">Category</label>
        <div className="flex gap-2">
          {CATEGORY_LETTERS.map((letter) => {
            const cat = CATEGORIES[letter];
            const isSelected = category === letter;
            return (
              <button
                key={letter}
                type="button"
                onClick={() => setCategory(letter)}
                title={cat.name}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-semibold transition-all ${
                  isSelected
                    ? `${cat.bgColor} ${cat.textColor} ${cat.borderColor}`
                    : "bg-gray-50 border-gray-200 text-gray-400"
                }`}
              >
                <CategoryBadge letter={letter} size="md" />
                <span className="text-[10px]">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Amount + Submit row */}
      <div className="flex gap-2 items-end">
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-xs text-gray-400">Amount ($)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            required
            inputMode="decimal"
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm placeholder:text-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white font-semibold rounded-xl px-6 py-2.5 text-sm active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "..." : "Add"}
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <p className={`text-sm text-center font-medium ${feedback.ok ? "text-green-600" : "text-red-500"}`}>
          {feedback.msg}
        </p>
      )}
    </form>
  );
}
