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

// Versi pastel/lembut dari warna yang sama (dipakai di blok kalender kanan,
// yang teksnya lumayan padat sehingga warna solid -500 terlalu menyilaukan).
// Pola bg-X-100/text-X-700 ini sama dengan yang sudah dipakai untuk badge
// priority di priority-picker.tsx.
export const CATEGORY_COLOR_SOFT_CLASSES: Record<string, { bg: string; text: string }> = {
  sky: { bg: "bg-sky-100 dark:bg-sky-950/40", text: "text-sky-700 dark:text-sky-300" },
  orange: { bg: "bg-orange-100 dark:bg-orange-950/40", text: "text-orange-700 dark:text-orange-300" },
  green: { bg: "bg-green-100 dark:bg-green-950/40", text: "text-green-700 dark:text-green-300" },
  purple: { bg: "bg-purple-100 dark:bg-purple-950/40", text: "text-purple-700 dark:text-purple-300" },
  pink: { bg: "bg-pink-100 dark:bg-pink-950/40", text: "text-pink-700 dark:text-pink-300" },
  red: { bg: "bg-red-100 dark:bg-red-950/40", text: "text-red-700 dark:text-red-300" },
  yellow: { bg: "bg-yellow-100 dark:bg-yellow-950/40", text: "text-yellow-700 dark:text-yellow-300" },
  teal: { bg: "bg-teal-100 dark:bg-teal-950/40", text: "text-teal-700 dark:text-teal-300" },
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
