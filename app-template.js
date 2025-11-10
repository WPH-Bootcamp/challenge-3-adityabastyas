// ============================================
// HABIT TRACKER CLI - CHALLENGE 3
// ============================================
// NAMA: [Aditya Bastyas Mulya]
// KELAS: [Batch Rep]
// TANGGAL: [4 November 2025]
// ============================================

// TODO: Import module yang diperlukan
// HINT: readline, fs, path
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// TODO: Definisikan konstanta
// HINT: DATA_FILE, REMINDER_INTERVAL, DAYS_IN_WEEK
const DATA_FILE = path.join(__dirname, 'habits-data.json');
const REMINDER_INTERVAL = 10000;
const DAYS_IN_WEEK = 7;

// TODO: Setup readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// ============================================
// USER PROFILE OBJECT
// ============================================
// TODO: Buat object userProfile dengan properties:
// - name
// - joinDate
// - totalHabits
// - completedThisWeek
// TODO: Tambahkan method updateStats(habits)
// TODO: Tambahkan method getDaysJoined()

const userProfile = {
  name: 'Aditya Bastyas Mulya',
  joinDate: new Date().toISOString(),
  totalHabits: 0,
  completedThisWeek: 0,

  // updateStats menerima array habits dan menghitung statistik dasar
  updateStats(habits = []) {
    this.totalHabits = habits.length;
    // completedThisWeek: hitung completions di 7 hari terakhir (hari ini termasuk)
    const today = new Date();
    const last7 = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      last7.push(formatDate(d));
    }
    this.completedThisWeek = habits.reduce((acc, h) => {
      const count = (h.completions ?? []).filter((d) =>
        last7.includes(d)
      ).length;
      return acc + (count > 0 ? 1 : 0);
    }, 0);
  },

  getDaysJoined() {
    const joined = new Date(this.joinDate);
    const now = new Date();
    const diffMs = now - joined;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  },
};

// ============================================
// HABIT CLASS
// ============================================
// TODO: Buat class Habit dengan:
// - Constructor yang menerima name dan targetFrequency
// - Method markComplete()
// - Method getThisWeekCompletions()
// - Method isCompletedThisWeek()
// - Method getProgressPercentage()
// - Method getStatus()

function formatDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function todayDateString() {
  return formatDate(new Date());
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}
function weeksInMonth(year, monthIndex) {
  const dim = daysInMonth(year, monthIndex);
  return Math.ceil(dim / 7);
}

class Habit {
  constructor({
    id = null,
    name = 'Unnamed',
    targetPerWeek = 7,
    completions = [],
    createdAt = null,
    note = '',
  } = {}) {
    this.id = id ?? Date.now().toString();
    this.name = name;
    this.targetPerWeek = targetPerWeek ?? 7; // nullish coalescing usage
    this.completions = completions ?? []; // ensure array
    this.createdAt = createdAt ?? new Date().toISOString();
    this.note = note ?? '';
  }

  // markComplete: tandai hari tertentu (default hari ini)
  markComplete(dateStr = todayDateString()) {
    if (!this.completions.includes(dateStr)) {
      this.completions.push(dateStr);
    }
  }

  // getThisWeekCompletions: ambil completions untuk 7 hari terakhir
  getThisWeekCompletions(referenceDate = new Date()) {
    const dates = [];
    const ref = new Date(referenceDate);
    for (let i = 0; i < 7; i++) {
      const d = new Date(ref);
      d.setDate(ref.getDate() - i);
      dates.push(formatDate(d));
    }
    return this.completions.filter((ds) => dates.includes(ds));
  }

  isCompletedThisWeek(referenceDate = new Date()) {
    return this.getThisWeekCompletions(referenceDate).length > 0;
  }

  // getProgressPercentage: untuk bulan berjalan (mengonversi weekly target -> monthly target)
  getProgressPercentage(year, monthIndex) {
    const compsInMonth = this.completions.filter((ds) => {
      const [y, m] = ds.split('-').map((s) => parseInt(s, 10));
      return y === year && m - 1 === monthIndex;
    }).length;
    const weeks = weeksInMonth(year, monthIndex);
    const monthlyTarget = this.targetPerWeek * weeks;
    const pct =
      monthlyTarget === 0
        ? compsInMonth > 0
          ? 100
          : 0
        : Math.min(100, Math.round((compsInMonth / monthlyTarget) * 100));
    return { comps: compsInMonth, monthlyTarget, pct };
  }

  getStatus(year, monthIndex) {
    const { comps, monthlyTarget } = this.getProgressPercentage(
      year,
      monthIndex
    );
    return comps >= monthlyTarget ? 'Selesai' : 'Aktif';
  }
}

// ============================================
// HABIT TRACKER CLASS
// ============================================
// TODO: Buat class HabitTracker dengan:
// - Constructor
// - Method addHabit(name, frequency)
// - Method completeHabit(habitIndex)
// - Method deleteHabit(habitIndex)
// - Method displayProfile()
// - Method displayHabits(filter)
// - Method displayHabitsWithWhile()
// - Method displayHabitsWithFor()
// - Method displayStats()
// - Method startReminder()
// - Method showReminder()
// - Method stopReminder()
// - Method saveToFile()
// - Method loadFromFile()
// - Method clearAllData()

function progressBar(percent, length = 20) {
  const filled = Math.round((percent / 100) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

class HabitTracker {
  constructor({ profile = userProfile, habits = [] } = {}) {
    this.profile = profile;
    this.habits = (habits ?? []).map((h) => new Habit(h)); // nullish coalescing
    this.reminderId = null;
  }

  addHabit(name, targetPerWeek = 7, note = '') {
    const h = new Habit({ name, targetPerWeek, note });
    this.habits.push(h);
    this.saveToFile();
    return h;
  }

  completeHabit(index, dateStr = todayDateString()) {
    const habit = this.habits[index];
    if (!habit) return false;
    habit.markComplete(dateStr);
    this.saveToFile();
    return true;
  }

  deleteHabit(index) {
    if (index < 0 || index >= this.habits.length) return null;
    const removed = this.habits.splice(index, 1)[0];
    this.saveToFile();
    return removed;
  }

  displayProfile() {
    console.log('\n=== PROFIL PENGGUNA ===');
    console.log(`Nama: ${this.profile.name}`);
    console.log(
      `Bergabung sejak: ${new Date(this.profile.joinDate).toLocaleString()}`
    );
    this.profile.updateStats(this.habits);
    console.log(`Jumlah kebiasaan: ${this.profile.totalHabits}`);
    console.log(
      `Selesai dalam 7 hari terakhir (jumlah habit yang punya completions): ${this.profile.completedThisWeek}`
    );
    console.log(`Hari sejak bergabung: ${this.profile.getDaysJoined()}`);
  }

  displayHabits(filter = 'all') {
    console.log('\n=== DAFTAR KEBIASAAN ===');
    if (this.habits.length === 0) {
      console.log('Belum ada kebiasaan. Tambah dengan menu 5.');
      return;
    }
    const now = new Date();
    const y = now.getFullYear();
    const mi = now.getMonth();
    // filter: 'all' | 'active' | 'finished'
    let list = this.habits;
    if (filter === 'active') {
      list = list.filter((h) => h.getStatus(y, mi) === 'Aktif');
    } else if (filter === 'finished') {
      list = list.filter((h) => h.getStatus(y, mi) === 'Selesai');
    }

    list.forEach((h, idx) => {
      const { comps, monthlyTarget, pct } = h.getProgressPercentage(y, mi);
      const status = h.getStatus(y, mi);
      console.log(`${idx + 1}. [${status}] ${h.name}`);
      console.log(
        `   Target/minggu: ${h.targetPerWeek} | Target/bulan(approx): ${monthlyTarget}`
      );
      console.log(`   Progress: ${comps}/${monthlyTarget} (${pct}%)`);
      console.log(`   ${progressBar(pct)} ${pct}%`);
      if (h.note) console.log(`   Catatan: ${h.note}`);
    });
  }

  displayHabitsWithWhile() {
    console.log('\n=== DISPLAY WITH WHILE ===');
    let i = 0;
    while (i < this.habits.length) {
      console.log(`- ${this.habits[i].name}`);
      i++;
    }
  }

  displayHabitsWithFor() {
    console.log('\n=== DISPLAY WITH FOR ===');
    for (let i = 0; i < this.habits.length; i++) {
      console.log(
        `${i + 1}. ${this.habits[i].name} (target/minggu: ${
          this.habits[i].targetPerWeek
        })`
      );
    }
  }

  displayStats() {
    console.log('\n=== STATISTIK BULAN INI ===');
    if (this.habits.length === 0) {
      console.log('Belum ada statistik karena belum ada kebiasaan.');
      return;
    }
    const now = new Date();
    const y = now.getFullYear();
    const mi = now.getMonth();

    // map untuk membuat ringkasan stats
    const stats = this.habits.map((h) => {
      const { comps, monthlyTarget, pct } = h.getProgressPercentage(y, mi);
      return { name: h.name, comps, monthlyTarget, pct };
    });

    // rata-rata
    const avg = Math.round(
      stats.reduce((acc, s) => acc + s.pct, 0) / stats.length
    );
    console.log(`Rata-rata progress: ${avg}%`);

    // top dan bottom menggunakan sort (salinan)
    const sortedDesc = [...stats].sort((a, b) => b.pct - a.pct);
    console.log('\nTop 3:');
    sortedDesc.slice(0, 3).forEach((s, i) => {
      console.log(
        `${i + 1}. ${s.name} - ${s.pct}% (${s.comps}/${s.monthlyTarget})`
      );
    });

    console.log('\nBottom 3:');
    sortedDesc
      .slice(-3)
      .reverse()
      .forEach((s, i) => {
        console.log(
          `${i + 1}. ${s.name} - ${s.pct}% (${s.comps}/${s.monthlyTarget})`
        );
      });
  }

  showReminder() {
    // Reminder menampilkan kebiasaan yang belum selesai hari ini
    const notDone = this.habits.filter(
      (h) => !h.completions.includes(todayDateString())
    );
    if (notDone.length === 0) {
      console.log('\n[REMINDER] Semua kebiasaan hari ini sudah selesai. ');
      return;
    }
    console.log('\n==================================================');
    console.log('REMINDER: Kebiasaan yang belum selesai hari ini:');
    // gunakan forEach untuk menampilkan
    notDone.slice(0, 5).forEach((h) => {
      console.log(` - ${h.name} (target/minggu: ${h.targetPerWeek})`);
    });
    console.log('==================================================');
  }

  startReminder() {
    if (this.reminderId) return;
    this.reminderId = setInterval(() => {
      this.showReminder();
    }, REMINDER_INTERVAL);
  }

  stopReminder() {
    if (this.reminderId) {
      clearInterval(this.reminderId);
      this.reminderId = null;
    }
  }

  saveToFile() {
    try {
      const payload = {
        profile: {
          name: this.profile.name,
          joinDate: this.profile.joinDate,
        },
        habits: this.habits.map((h) => ({
          id: h.id,
          name: h.name,
          targetPerWeek: h.targetPerWeek,
          completions: h.completions,
          createdAt: h.createdAt,
          note: h.note,
        })),
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf8');
    } catch (err) {
      console.error('Gagal menyimpan data:', err.message);
    }
  }

  loadFromFile() {
    try {
      if (!fs.existsSync(DATA_FILE)) {
        // seed default jika belum ada file
        this.seedDefaults();
        this.saveToFile();
        return;
      }
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed?.profile) {
        this.profile.name = parsed.profile.name ?? this.profile.name;
        this.profile.joinDate =
          parsed.profile.joinDate ?? this.profile.joinDate;
      }
      this.habits = (parsed?.habits ?? []).map((h) => new Habit(h));
    } catch (err) {
      console.error('Gagal memuat data:', err.message);
    }
  }

  clearAllData() {
    this.habits = [];
    this.saveToFile();
  }

  seedDefaults() {
    // sesuai dengan permintaan - beberapa dikategorikan sebagai habits terpisah
    this.habits = [
      new Habit({
        name: 'Baca Buku 30 menit',
        targetPerWeek: 7,
        note: 'Baca minimal 30 menit/hari',
      }),
      new Habit({
        name: 'Olahraga Pingpong (Sabtu & Minggu)',
        targetPerWeek: 2,
        note: 'Weekend only',
      }),
      new Habit({
        name: 'Jalan Pagi 30 menit (Senin-Jumat)',
        targetPerWeek: 5,
        note: 'Hari kerja',
      }),
      new Habit({
        name: 'Tidur 22:00 - Bangun 03:30',
        targetPerWeek: 7,
        note: 'Rutinitas tidur',
      }),
      new Habit({
        name: 'Berangkat kerja 08:30 (Senin-Jumat)',
        targetPerWeek: 5,
        note: 'Hari kerja',
      }),
      new Habit({
        name: 'Makan Pagi 06:30',
        targetPerWeek: 7,
        note: 'Sarapan',
      }),
      new Habit({
        name: 'Makan Siang 12:00',
        targetPerWeek: 7,
        note: 'Istirahat makan siang',
      }),
      new Habit({
        name: 'Makan Malam 19:30',
        targetPerWeek: 7,
        note: 'Makan malam sehat',
      }),
    ];
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================
// TODO: Buat function askQuestion(question)
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (ans) => resolve(ans.trim()));
  });
}

// TODO: Buat function displayMenu()
function displayMenu() {
  console.log('\n==================================================');
  console.log('HABIT TRACKER - MENU UTAMA');
  console.log('==================================================');
  console.log('1. Lihat Profil');
  console.log('2. Lihat Semua Kebiasaan');
  console.log('3. Lihat Kebiasaan Aktif (bulan ini)');
  console.log('4. Lihat Kebiasaan Selesai (bulan ini)');
  console.log('5. Tambah Kebiasaan Baru');
  console.log('6. Tandai Kebiasaan Selesai (hari ini)');
  console.log('7. Hapus Kebiasaan');
  console.log('8. Lihat Statistik (bulan ini)');
  console.log('9. Demo Loop (while/for)');
  console.log('0. Keluar');
  console.log('==================================================');
}

// TODO: Buat async function handleMenu(tracker)

async function handleMenu(tracker) {
  let exit = false;
  while (!exit) {
    displayMenu();

    //   Hentikan reminder sementara supaya tidak mengganggu input user
    tracker.stopReminder();

    const choice = await askQuestion('Pilih menu (0-9): ');

    //   Aktifkan kembali reminder setelah user selesai input
    tracker.startReminder();

    switch (choice) {
      case '1':
        tracker.displayProfile();
        break;
      case '2':
        tracker.displayHabits('all');
        break;
      case '3':
        tracker.displayHabits('active');
        break;
      case '4':
        tracker.displayHabits('finished');
        break;
      case '5': {
        const name = await askQuestion('Nama kebiasaan baru: ');
        const targetRaw = await askQuestion(
          'Target per minggu (angka, default 7): '
        );
        const target = parseInt(targetRaw, 10) ?? 7; // nullish coalescing (usage)
        const note = await askQuestion('Catatan (opsional): ');
        const added = tracker.addHabit(name || 'Unnamed Habit', target, note);
        console.log(`Kebiasaan "${added.name}" berhasil ditambahkan.`);
        break;
      }
      case '6': {
        tracker.displayHabits('all');
        const idxRaw = await askQuestion(
          'Pilih nomor kebiasaan untuk ditandai selesai (hari ini): '
        );
        const idx = parseInt(idxRaw, 10) - 1;
        if (Number.isNaN(idx) || idx < 0 || idx >= tracker.habits.length) {
          console.log('Pilihan tidak valid.');
        } else {
          const ok = tracker.completeHabit(idx);
          if (ok)
            console.log(
              `"${tracker.habits[idx].name}" ditandai selesai untuk hari ini.`
            );
          else console.log('Gagal menandai selesai.');
        }
        break;
      }
      case '7': {
        tracker.displayHabits('all');
        const diRaw = await askQuestion(
          'Pilih nomor kebiasaan yang ingin dihapus: '
        );
        const di = parseInt(diRaw, 10) - 1;
        if (Number.isNaN(di) || di < 0 || di >= tracker.habits.length) {
          console.log('Pilihan tidak valid.');
        } else {
          const removed = tracker.deleteHabit(di);
          console.log(`Kebiasaan "${removed.name}" dihapus.`);
        }
        break;
      }
      case '8':
        tracker.displayStats();
        break;
      case '9':
        tracker.displayHabitsWithWhile();
        tracker.displayHabitsWithFor();
        break;
      case '0':
        console.log('Menyimpan data dan keluar. Sampai jumpa!');
        exit = true;
        break;
      default:
        console.log('Pilihan tidak dikenali. Silakan pilih 0-9.');
    }
  }
}

// ============================================
// MAIN FUNCTION
// ============================================
// TODO: Buat async function main()

async function main() {
  console.log('==================================================');
  console.log('HABIT TRACKER - CLI (Template Terisi)');
  console.log('==================================================');

  const tracker = new HabitTracker();
  tracker.loadFromFile();
  if (tracker.habits.length === 0) {
    tracker.seedDefaults();
    tracker.saveToFile();
  }

  // mulai reminder
  tracker.startReminder();

  // update profile stats initially
  tracker.profile.updateStats(tracker.habits);

  // handle menu (blocking until exit)
  await handleMenu(tracker);

  // stop reminder and close rl
  tracker.stopReminder();
  rl.close();
}

// TODO: Jalankan main() dengan error handling

main().catch((err) => {
  console.error('Terjadi error pada program:', err);
  rl.close();
});
