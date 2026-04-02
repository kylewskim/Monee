"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORY_COLOR_PALETTE } from "@/lib/types";

interface SetupFormProps {
  onSuccess: () => void;
  timeZone: string | null;
}

interface SetupCategoryInput {
  name: string;
  colorHex: string;
}

const NAME_PATTERN = /^[A-Za-z][A-Za-z ]*$/;
const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const PALETTE_COLORS = CATEGORY_COLOR_PALETTE.map((color) => color.toUpperCase());
const COLOR_BUTTON_SIZE = 44;
const SWATCH_SIZE = 32;
const SWATCH_GAP = 8;

function normalizeHex(hex: string): string {
  return hex.trim().toUpperCase();
}

function validateCategories(raw: SetupCategoryInput[]): string | null {
  const categories = raw
    .map((c) => ({ name: c.name.trim(), colorHex: normalizeHex(c.colorHex) }))
    .filter((c) => c.name.length > 0);

  if (categories.length < 1) return "Add at least one category.";
  if (categories.length > 8) return "You can add up to 8 categories.";

  const initials = new Set<string>();
  const usedColors = new Set<string>();

  for (const category of categories) {
    if (!NAME_PATTERN.test(category.name)) {
      return "Category names must be English letters and spaces only.";
    }
    if (!HEX_PATTERN.test(category.colorHex)) {
      return "Each category color must be a valid hex color.";
    }
    if (!PALETTE_COLORS.includes(category.colorHex)) {
      return "Category color must be selected from the preset palette.";
    }

    const initial = category.name[0].toUpperCase();
    if (initials.has(initial)) {
      return "Category first letters must be unique.";
    }
    initials.add(initial);

    if (usedColors.has(category.colorHex)) {
      return "Category colors must be unique.";
    }
    usedColors.add(category.colorHex);
  }

  return null;
}

function createDefaultCategory(index: number): SetupCategoryInput {
  return {
    name: "",
    colorHex: CATEGORY_COLOR_PALETTE[index % CATEGORY_COLOR_PALETTE.length],
  };
}

export default function SetupForm({ onSuccess, timeZone }: SetupFormProps) {
  const [budget, setBudget] = useState("1000");
  const [categories, setCategories] = useState<SetupCategoryInput[]>([
    { name: "Food", colorHex: CATEGORY_COLOR_PALETTE[0] },
    { name: "Subscription", colorHex: CATEGORY_COLOR_PALETTE[1] },
    { name: "Personal", colorHex: CATEGORY_COLOR_PALETTE[2] },
  ]);
  const [openPickerIndex, setOpenPickerIndex] = useState<number | null>(null);
  const pickerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validationError = useMemo(() => validateCategories(categories), [categories]);

  useEffect(() => {
    if (openPickerIndex != null && openPickerIndex >= categories.length) {
      setOpenPickerIndex(null);
    }
  }, [categories.length, openPickerIndex]);

  useEffect(() => {
    if (openPickerIndex == null) return;
    const activePickerIndex = openPickerIndex;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      const currentPicker = pickerRefs.current[activePickerIndex];
      if (!target || !currentPicker) {
        setOpenPickerIndex(null);
        return;
      }
      if (!currentPicker.contains(target)) {
        setOpenPickerIndex(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenPickerIndex(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openPickerIndex]);

  function updateCategoryName(index: number, value: string) {
    setCategories((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], name: value };
      return next;
    });
  }

  function updateCategoryColor(index: number, value: string) {
    setCategories((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], colorHex: normalizeHex(value) };
      return next;
    });
  }

  function addCategory() {
    setCategories((prev) => {
      if (prev.length >= 8) return prev;
      const usedColors = new Set(prev.map((c) => normalizeHex(c.colorHex)));
      const nextColor =
        PALETTE_COLORS.find((color) => !usedColors.has(color)) ??
        CATEGORY_COLOR_PALETTE[prev.length % CATEGORY_COLOR_PALETTE.length];
      return [...prev, { ...createDefaultCategory(prev.length), colorHex: nextColor }];
    });
  }

  function removeCategory(index: number) {
    setCategories((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
    setOpenPickerIndex((prev) => (prev === index ? null : prev));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedBudget = Number(budget);
    if (!Number.isFinite(parsedBudget) || parsedBudget <= 0) {
      setError("Budget must be greater than 0.");
      return;
    }

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      budget: parsedBudget,
      timeZone,
      categories: categories
        .map((c) => ({ name: c.name.trim(), colorHex: normalizeHex(c.colorHex) }))
        .filter((c) => c.name.length > 0),
    };

    setLoading(true);
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Setup failed");
        return;
      }
      onSuccess();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Welcome to Monee</h2>
        <p className="text-sm text-gray-500 mt-1">
          Set your budget, categories, and colors. This can be updated in a future release.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4 mt-1">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-400 font-medium">Monthly Budget ($)</label>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            min="0"
            step="0.01"
            required
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 h-11 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-400 font-medium">Categories (max 8)</label>
          <div className="flex flex-col gap-2">
            {categories.map((value, idx) => (
              <div
                key={idx}
                className={`relative flex flex-col gap-2 ${openPickerIndex === idx ? "z-30" : "z-0"}`}
              >
                <div className="flex gap-2 items-start">
                  <input
                    type="text"
                    value={value.name}
                    onChange={(e) => updateCategoryName(idx, e.target.value)}
                    placeholder={`Category ${idx + 1}`}
                    className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-xl px-4 h-11 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                  />
                  <div
                    ref={(el) => {
                      pickerRefs.current[idx] = el;
                    }}
                    className="relative flex-shrink-0"
                    style={{ width: COLOR_BUTTON_SIZE, height: COLOR_BUTTON_SIZE }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenPickerIndex((prev) => (prev === idx ? null : idx))}
                      className="block rounded-xl border border-gray-300 transition-colors"
                      style={{
                        backgroundColor: value.colorHex,
                        width: COLOR_BUTTON_SIZE,
                        height: COLOR_BUTTON_SIZE,
                        minWidth: COLOR_BUTTON_SIZE,
                        minHeight: COLOR_BUTTON_SIZE,
                        padding: 0,
                        display: "block",
                        position: "relative",
                      }}
                      aria-label={`Category ${idx + 1} color`}
                      aria-expanded={openPickerIndex === idx}
                    />

                    {openPickerIndex === idx && (
                      <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-30 p-2 bg-white border border-gray-200 rounded-xl shadow-lg">
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: `repeat(4, ${SWATCH_SIZE}px)`,
                            gap: SWATCH_GAP,
                          }}
                        >
                          {PALETTE_COLORS.map((color) => {
                            const selected = normalizeHex(value.colorHex) === color;
                            const usedByOther = categories.some(
                              (cat, catIndex) =>
                                catIndex !== idx &&
                                cat.name.trim().length > 0 &&
                                normalizeHex(cat.colorHex) === color
                            );

                            return (
                              <button
                                key={color}
                                type="button"
                                onClick={() => {
                                  updateCategoryColor(idx, color);
                                  setOpenPickerIndex(null);
                                }}
                                disabled={usedByOther}
                                className={`rounded-lg border-2 ${
                                  selected ? "border-gray-900" : "border-gray-300"
                                } ${usedByOther ? "opacity-30 cursor-not-allowed" : ""}`}
                                style={{
                                  backgroundColor: color,
                                  width: SWATCH_SIZE,
                                  height: SWATCH_SIZE,
                                  minWidth: SWATCH_SIZE,
                                  minHeight: SWATCH_SIZE,
                                  padding: 0,
                                  display: "block",
                                  position: "relative",
                                  boxSizing: "border-box",
                                }}
                                title={color}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCategory(idx)}
                    disabled={categories.length <= 1}
                    className="px-3 rounded-xl border border-gray-200 text-sm text-gray-500 disabled:opacity-40 h-11"
                  >
                    Remove
                  </button>
                </div>

              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addCategory}
            disabled={categories.length >= 8}
            className="self-start text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-40"
          >
            Add category
          </button>
        </div>

        {(error || validationError) && (
          <p className="text-sm text-red-500">{error ?? validationError}</p>
        )}

        <button
          type="submit"
          disabled={loading || Boolean(validationError)}
          className="font-semibold rounded-xl py-3 text-sm text-white bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating..." : "Create My Monee Sheet"}
        </button>
      </form>
    </div>
  );
}
