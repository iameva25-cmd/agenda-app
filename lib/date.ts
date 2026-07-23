export function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateString(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function getMondayOfWeek(date: Date) {
  const day = date.getDay(); // 0 = Minggu, 1 = Senin, ... 6 = Sabtu
  const diffToMonday = day === 0 ? -6 : 1 - day;
  return addDays(date, diffToMonday);
}

// Semua tanggal yang perlu ditampilkan di grid kalender bulan (refDate),
// dari Senin minggu pertama sampai Minggu minggu terakhir - termasuk
// tanggal "bocoran" dari bulan sebelum/sesudahnya biar grid selalu genap
// kelipatan 7 (5-6 baris minggu).
export function getMonthGridDates(refDate: Date): Date[] {
  const firstOfMonth = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
  const lastOfMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0);
  const gridStart = getMondayOfWeek(firstOfMonth);
  const gridEnd = addDays(getMondayOfWeek(lastOfMonth), 6);

  const dates: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) {
    dates.push(d);
  }
  return dates;
}
