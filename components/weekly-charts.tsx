"use client";

import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, YAxis } from "recharts";
import { CATEGORY_COLOR_HEX } from "@/lib/category-colors";
import { useTranslation } from "@/lib/i18n/context";

const UNKNOWN_HEX = "#a1a1aa";

// Largest-remainder method: membulatkan tiap fraction ke persen bulat, tapi
// jaga total tetap persis 100% (bukan 99%/101% seperti pembulatan independen
// per slice).
function roundPercentagesTo100(fractions: number[]): number[] {
  const raw = fractions.map((f) => f * 100);
  const floors = raw.map((r) => Math.floor(r));
  const remainder = 100 - floors.reduce((sum, f) => sum + f, 0);

  const order = floors
    .map((_, i) => i)
    .sort((a, b) => raw[b] - Math.floor(raw[b]) - (raw[a] - Math.floor(raw[a])));

  const result = [...floors];
  for (let k = 0; k < remainder; k++) {
    result[order[k]] += 1;
  }
  return result;
}

export function DailyProductivityChart({ data }: { data: { label: string; hours: number }[] }) {
  return (
    <div className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <YAxis hide domain={[0, 6]} />
          <Bar dataKey="hours" radius={[4, 4, 0, 0]} fill="#0ea5e9" barSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TimeByChannelChart({
  data,
}: {
  data: { label: string; color: string; totalSeconds: number }[];
}) {
  const { t } = useTranslation();
  const total = data.reduce((sum, d) => sum + d.totalSeconds, 0);
  const percentages =
    total === 0 ? [] : roundPercentagesTo100(data.map((d) => d.totalSeconds / total));

  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="h-24 w-24 rounded-full border-[10px] border-muted" />
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-muted" />
          {t("unknown")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="h-24 w-24">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="totalSeconds"
              nameKey="label"
              innerRadius={28}
              outerRadius={44}
              paddingAngle={2}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={CATEGORY_COLOR_HEX[d.color] ?? UNKNOWN_HEX} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col items-center gap-1">
        {data.map((d, i) => (
          <p key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: CATEGORY_COLOR_HEX[d.color] ?? UNKNOWN_HEX }}
            />
            {d.label === "unknown" ? t("unknown") : d.label} ({percentages[i]}%)
          </p>
        ))}
      </div>
    </div>
  );
}
