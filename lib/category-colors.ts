export const CATEGORY_COLORS = [
  "sky",
  "orange",
  "green",
  "purple",
  "pink",
  "red",
  "yellow",
  "teal",
] as const;

// Warna final sebuah channel: pakai warnanya sendiri kalau di-set eksplisit,
// kalau tidak (null/kosong) warisi warna context induknya.
export function resolveChannelColor(
  channelColor: string | null | undefined,
  contextColor: string,
): string {
  return channelColor ?? contextColor;
}

export const CATEGORY_COLOR_CLASSES: Record<string, { swatch: string; text: string }> = {
  sky: { swatch: "bg-sky-500", text: "text-sky-600 dark:text-sky-400" },
  orange: { swatch: "bg-orange-500", text: "text-orange-600 dark:text-orange-400" },
  green: { swatch: "bg-green-500", text: "text-green-600 dark:text-green-400" },
  purple: { swatch: "bg-purple-500", text: "text-purple-600 dark:text-purple-400" },
  pink: { swatch: "bg-pink-500", text: "text-pink-600 dark:text-pink-400" },
  red: { swatch: "bg-red-500", text: "text-red-600 dark:text-red-400" },
  yellow: { swatch: "bg-yellow-500", text: "text-yellow-600 dark:text-yellow-400" },
  teal: { swatch: "bg-teal-500", text: "text-teal-600 dark:text-teal-400" },
};

// Warna asli (hex) untuk dipakai di chart (recharts butuh warna CSS asli,
// bukan className Tailwind) — dicocokkan dengan shade -500 di atas.
export const CATEGORY_COLOR_HEX: Record<string, string> = {
  sky: "#0ea5e9",
  orange: "#f97316",
  green: "#22c55e",
  purple: "#a855f7",
  pink: "#ec4899",
  red: "#ef4444",
  yellow: "#eab308",
  teal: "#14b8a6",
};
