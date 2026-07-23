export type Locale = "en" | "id";

// English text is the canonical key; only the Indonesian translation is stored here.
const dictionary: Record<string, string> = {
  // Landing page
  "Log in": "Masuk",
  "Sign up": "Daftar",
  "All commitments. All contexts. One place.": "Semua komitmen. Semua konteks. Satu tempat.",
  "Plan your day with": "Susun harimu dengan",
  intent: "niat",
  not: "bukan",
  rush: "buru-buru",
  "Plan today's tasks, schedule them into daily time slots, and let unfinished tasks carry over to tomorrow automatically. You stay in full control of your schedule.":
    "Rencanakan task hari ini, atur ke slot waktu di kalender harian, dan biarkan task yang belum selesai lanjut otomatis ke besok. Kamu yang pegang kendali penuh atas jadwalmu.",
  "Start Planning Today": "Mulai Rencanakan Hari Ini",
  "Already have an account? Log in": "Sudah punya akun? Masuk",
  "Konteks - built for daily discipline, not deadline chasing.":
    "Konteks - dibangun untuk disiplin harian, bukan kejar deadline.",
  "Konteks: agenda planner, tasks, and priorities - track commitments, follow-ups, and weekly reviews in one place.":
    "Konteks: planner agenda, task, dan prioritas - ingatkan komitmen, follow-up, dan weekly review dalam satu tempat.",

  // Auth pages
  "Invalid email or password.": "Email atau password salah.",
  "Log In": "Masuk",
  Email: "Email",
  Password: "Password",
  "Processing...": "Memproses...",
  "Don't have an account?": "Belum punya akun?",
  "Failed to sign up. Please try again.": "Gagal mendaftar. Coba lagi.",
  "Create Account": "Buat Akun",
  Name: "Nama",
  "Sign Up": "Daftar",
  "Already have an account?": "Sudah punya akun?",

  // Sidebar nav
  "Hide sidebar": "Sembunyikan sidebar",
  "Show sidebar": "Tampilkan sidebar",
  Home: "Beranda",
  Today: "Hari Ini",
  Day: "Hari",
  "Daily planning": "Rencana harian",
  "Daily shutdown": "Penutupan harian",
  "Daily highlights": "Sorotan harian",
  Week: "Minggu",
  "Weekly planning": "Rencana mingguan",
  "Weekly review": "Ulasan mingguan",
  Month: "Bulan",
  "Monthly view": "Tampilan bulanan",
  Insights: "Wawasan",
  Analytics: "Analitik",
  "Hi, {name}": "Halo, {name}",
  "Log Out": "Keluar",
  "Switch to light mode": "Aktifkan mode terang",
  "Switch to dark mode": "Aktifkan mode gelap",

  // Shared
  "Coming soon": "Segera hadir",
  "Add task": "Tambah task",
  Filter: "Filter",
  "No tasks for today yet": "Belum ada task untuk hari ini",
  "Tasks you add will show up here.": "Task yang kamu tambahkan akan muncul di sini.",
  "Mark as done": "Tandai selesai",
  Edit: "Edit",
  Delete: "Hapus",
  Save: "Simpan",
  Cancel: "Batal",
  Create: "Buat",
  "Manage channels": "Kelola channel",
  Unassigned: "Belum ditugaskan",
  "+ category": "+ kategori",
  "Assign to channel:": "Tugaskan ke channel:",
  "Search...": "Cari...",

  // /today, /today/planning
  "📅 Today": "📅 Hari Ini",
  "☰ Filter": "☰ Filter",
  "What do you want to get done today?": "Apa yang ingin kamu selesaikan hari ini?",
  "Add tasks you want to work on today.": "Tambahkan task yang ingin kamu kerjakan hari ini.",
  "Shutdown time": "Waktu penutupan",
  "What time would you like to wrap up work by?": "Jam berapa kamu ingin selesai kerja hari ini?",
  "Coming soon (Google Calendar sync is on hold)":
    "Segera hadir (Google Calendar sync masih ditunda)",
  "📅 Add to calendar": "📅 Tambah ke kalender",
  "No previous step": "Tidak ada langkah sebelumnya",
  Next: "Selanjutnya",
  "What are the most high-impact things you could do today?":
    "Apa hal paling berdampak yang bisa kamu kerjakan hari ini?",

  // /today/highlights
  "Daily Highlights": "Sorotan Harian",
  "Pick 1-3 tasks that matter most for you to get done today.":
    "Pilih 1-3 task paling penting untuk kamu selesaikan hari ini.",
  Start: "Mulai",
  "Today's highlights ({count}/{max})": "Sorotan hari ini ({count}/{max})",
  "No highlights picked yet. Click the star icon on a task below.":
    "Belum ada sorotan dipilih. Klik ikon bintang pada task di bawah.",
  "All tasks today ({count})": "Semua task hari ini ({count})",
  "No tasks for today yet.": "Belum ada task untuk hari ini.",
  "Maximum {max} highlights per day": "Maksimal {max} sorotan per hari",
  "Remove from highlights": "Hapus dari sorotan",
  "Mark as highlight": "Jadikan sorotan",

  // /today/shutdown
  "Daily Shutdown": "Penutupan Harian",
  "Wrap up your day with a summary of tasks done and not done today, along with the progress percentage.":
    "Tutup harimu dengan lihat ringkasan task yang sudah selesai dan belum hari ini, lengkap dengan progress percentage-nya.",
  "No tasks today": "Belum ada task hari ini",
  "{done} of {total} tasks done": "{done} dari {total} task selesai",
  "Total time tracked today: {time}": "Total waktu yang di-track hari ini: {time}",
  "Done ({count})": "Selesai ({count})",
  "No tasks done today yet.": "Belum ada task yang selesai hari ini.",
  "Not done ({count})": "Belum selesai ({count})",
  "All tasks today are done.": "Semua task hari ini sudah selesai.",

  // /home, /week/planning, /week/review, /analytics, /settings/channels
  Calendars: "Kalender",
  "📅 This week": "📅 Minggu Ini",
  "📅 Last week": "📅 Minggu Lalu",
  "Weekly objectives": "Objektif mingguan",
  "Set your objectives for the week.": "Atur objektif kamu untuk minggu ini.",
  "This week": "Minggu ini",
  "Your objectives for this week": "Objektif kamu untuk minggu ini",
  "Write an objective...": "Tulis objective...",
  "+ Add objective": "+ Tambah objective",
  "No objectives for this week.": "Belum ada objective untuk minggu ini.",
  "What got done": "Apa yang sudah dikerjakan",
  "How you spent your time this week in": "Bagaimana kamu menghabiskan waktu minggu ini secara",
  total: "total",
  "Daily productivity": "Produktivitas harian",
  "How you spent your time": "Bagaimana kamu menghabiskan waktu",
  "Hours worked per category, per week.": "Jam kerja per kategori, per minggu.",
  "Hours worked per day": "Jam kerja per hari",
  "Hours worked per category": "Jam kerja per kategori",
  Mon: "Sen",
  Tue: "Sel",
  Wed: "Rab",
  Thu: "Kam",
  Fri: "Jum",
  Sat: "Sab",
  Sun: "Min",
  "Contexts & Channels": "Context & Channel",
  "← Return to Home": "← Kembali ke Beranda",
  "Manage contexts (parent categories) and channels (sub-categories) to group your tasks.":
    "Atur context (kategori induk) dan channel (sub-kategori) untuk mengelompokkan task kamu.",

  // channels-manager
  "Follow context color": "Ikuti warna context",
  "Follow context color (default)": "Ikuti warna context (default)",
  "Context name (e.g. work)": "Nama context (misal: work)",
  "Channel name (e.g. marketing)": "Nama channel (misal: marketing)",
  Private: "Privat",
  "Create Context": "Buat Context",
  "Create Channel": "Buat Channel",
  "+ Create channel in {context}": "+ Buat channel di {context}",
  'Delete context "{name}"? {count} channel(s) inside it will also be deleted.':
    'Hapus context "{name}"? {count} channel di dalamnya ikut terhapus.',
  'Delete context "{name}"?': 'Hapus context "{name}"?',

  // add-task-popup / channel-picker / priority-picker
  "in the next week": "minggu depan",
  "in the next month": "bulan depan",
  "in the next quarter": "kuartal depan",
  "in the next year": "tahun depan",
  channel: "channel",
  "5 min": "5 menit",
  "10 min": "10 menit",
  "15 min": "15 menit",
  "20 min": "20 menit",
  "25 min": "25 menit",
  "30 min": "30 menit",
  "45 min": "45 menit",
  "1 hr": "1 jam",
  "Task description...": "Deskripsi task...",
  "Paste a URL": "Tempel URL",
  Someday: "Suatu saat",
  someday: "suatu saat",
  never: "tidak pernah",
  "Not supported — tasks in this app always need a fixed date":
    "Belum didukung — task di app ini selalu perlu tanggal pasti",
  "Schedule exact start date": "Jadwalkan tanggal mulai pasti",
  "Planned:": "Direncanakan:",
  "Assign to channel": "Tugaskan ke channel",
  "Not available yet — channel settings haven't been set up":
    "Belum tersedia — pengaturan channel belum dibuat",
  Urgent: "Mendesak",
  Priority: "Prioritas",
  Normal: "Normal",
  "Low Priority": "Prioritas Rendah",
  "Daily Priority": "Prioritas Harian",

  // task card / task detail modal
  "{count} subtasks": "{count} subtask",
  Channel: "Channel",
  "Due date — coming soon": "Due date — segera hadir",
  Due: "Due",
  "+ Subtasks": "+ Subtask",
  "More menu — coming soon": "Menu lainnya — segera hadir",
  "Expand — coming soon": "Perbesar — segera hadir",
  Close: "Tutup",
  "Pause timer": "Jeda timer",
  "Start timer": "Mulai timer",
  Actual: "Aktual",
  Planned: "Direncanakan",
  "+ Add subtask": "+ Tambah subtask",
  "Notes...": "Catatan...",
  "Comment...": "Komentar...",
  "Attach file — coming soon": "Lampirkan file — segera hadir",
  "You created this task · {time}": "Kamu membuat task ini · {time}",
  "just now": "baru saja",
  "{n}m ago": "{n}m lalu",
  "{n}h ago": "{n}j lalu",
  "{n}d ago": "{n}h lalu",
  "Unschedule": "Lepas dari jadwal",

  // task-reminders
  "Starting soon: {title}": "Segera dimulai: {title}",
  "Scheduled for {time}": "Dijadwalkan jam {time}",
  "Enable reminder notifications": "Aktifkan notifikasi reminder",

  // month-calendar
  "No tasks on this date yet.": "Belum ada task di tanggal ini.",
};

export function translate(
  key: string,
  locale: Locale,
  params?: Record<string, string | number>,
): string {
  let str = locale === "id" ? (dictionary[key] ?? key) : key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.split(`{${k}}`).join(String(v));
    }
  }
  return str;
}
