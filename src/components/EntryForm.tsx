"use client";

import { useState } from "react";
import { CATEGORY_LETTERS, CATEGORIES, type CategoryLetter } from "@/lib/types";
import CategoryBadge from "./CategoryBadge";

interface EntryFormProps {
  onSuccess: () => void;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
    <div className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 px-1">
        Add Entry
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-4"
      >
        {/* Date + Where row */}
        <div className="flex gap-2">
          <div className="flex flex-col gap-1.5 w-36 flex-shrink-0">
            <label className="text-xs text-gray-400">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 h-11 text-gray-900 text-sm focus:outline-none focus:border-gray-400 transition-colors [color-scheme:light]"
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
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 h-11 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>
        </div>

        {/* Category */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-400">Category</label>
          <div className="flex gap-2 flex-wrap">
            {CATEGORY_LETTERS.map((letter) => {
              const cat = CATEGORIES[letter];
              const isSelected = category === letter;
              return (
                <button
                  key={letter}
                  type="button"
                  onClick={() => setCategory(letter)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm font-medium transition-all"
                  style={
                    isSelected
                      ? { backgroundColor: hexToRgba(cat.color, 0.4), color: cat.textColor, borderColor: cat.color }
                      : { backgroundColor: "white", color: "#9ca3af", borderColor: "#e5e7eb" }
                  }
                >
                  <CategoryBadge letter={letter} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-1.5">
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
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="bg-gray-900 text-white font-semibold rounded-full py-3 text-sm active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : "Add"}
        </button>

        {/* Feedback */}
        {feedback && (
          <p
            className={`text-sm text-center font-medium ${
              feedback.ok ? "text-green-600" : "text-red-500"
            }`}
          >
            {feedback.msg}
          </p>
        )}
      </form>
    </div>
  );
}
