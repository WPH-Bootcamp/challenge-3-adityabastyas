// ============================================
// HABIT TRACKER CLI - CHALLENGE 3
// ============================================
// NAMA: Aditya Bastyas
// KELAS: Front-End Developer
// TANGGAL: 10 November 2025
// ============================================

// Import module bawaan Node.js
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Konstanta
const DATA_FILE = path.join(__dirname, 'habits-data.json');
const REMINDER_INTERVAL = 10000; // 10 detik
const DAYS_IN_WEEK = 7;

// Setup readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// ============================================
// USER PROFILE OBJECT
// ============================================
const userProfile = {
  name: 'Adit',
  joinDate: new Date(),
  totalHabits: 0,
  completedThisWeek: 0,

  updateStats(habits) {
    this.totalHabits = habits.length;
    this.completedThisWeek = habits.filter((h) =>
      h.isCompletedThisWeek()
    ).length;
  },

  getDaysJoined() {
    const diff = new Date() - this.joinDate;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  },
};

// ============================================
// HABIT CLASS
// ============================================
class Habit {
  constructor(name, targetFrequency) {
    this.id = Date.now();
    this.name = name;
    this.targetFrequency = targetFrequency;
    this.completions = [];
    this.createdAt = new Date();
  }

  markComplete() {
    const today = new Date().toDateString();
    if (!this.completions.includes(today)) {
      this.completions.push(today);
      console.log(` "${this.name}" ditandai selesai hari ini.`);
    } else {
      console.log(`  "${this.name}" sudah ditandai selesai hari ini.`);
    }
  }

  getThisWeekCompletions() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Minggu

    return this.completions.filter((date) => {
      const d = new Date(date);
      return d >= startOfWeek;
    }).length;
  }

  isCompletedThisWeek() {
    return this.getThisWeekCompletions() >= this.targetFrequency;
  }

  getProgressPercentage() {
    return Math.min(
      Math.round((this.getThisWeekCompletions() / this.targetFrequency) * 100),
      100
    );
  }

  getStatus() {
    return this.isCompletedThisWeek() ? 'Selesai' : 'Aktif';
  }
}

// ============================================
// HABIT TRACKER CLASS
// ============================================
class HabitTracker {
  constructor() {
    this.habits = [];
    this.reminder = null;
    this.loadFromFile();
  }

  addHabit(name, frequency) {
    this.habits.push(new Habit(name, frequency));
    console.log(`✨ Habit baru "${name}" berhasil ditambahkan!`);
    this.saveToFile();
  }

  completeHabit(index) {
    const habit = this.habits[index - 1] ?? null;
    if (habit) {
      habit.markComplete();
      this.saveToFile();
    } else {
      console.log('❌ Habit tidak ditemukan.');
    }
  }

  deleteHabit(index) {
    if (this.habits[index - 1]) {
      const removed = this.habits.splice(index - 1, 1);
      console.log(` Habit "${removed[0].name}" telah dihapus.`);
      this.saveToFile();
    } else {
      console.log(' Habit tidak ditemukan.');
    }
  }

  displayProfile() {
    userProfile.updateStats(this.habits);
    console.log(`
==================================================
👤 PROFIL PENGGUNA
==================================================
Nama: ${userProfile.name}
Bergabung: ${userProfile.joinDate.toDateString()}
Total Hari: ${userProfile.getDaysJoined()} hari
Total Kebiasaan: ${userProfile.totalHabits}
Selesai Minggu Ini: ${userProfile.completedThisWeek}
==================================================`);
  }

  displayHabits(filter = 'all') {
    let habitsToShow = this.habits;

    if (filter === 'active')
      habitsToShow = this.habits.filter((h) => !h.isCompletedThisWeek());
    if (filter === 'done')
      habitsToShow = this.habits.filter((h) => h.isCompletedThisWeek());

    if (habitsToShow.length === 0) {
      console.log('⚠️ Tidak ada kebiasaan untuk ditampilkan.');
      return;
    }

    habitsToShow.forEach((habit, i) => {
      const progress = habit.getProgressPercentage();
      const bar = '█'.repeat(progress / 10) + '░'.repeat(10 - progress / 10);
      console.log(`
${i + 1}. [${habit.getStatus()}] ${habit.name}
   Target: ${habit.targetFrequency}x/minggu
   Progress: ${habit.getThisWeekCompletions()}/${
        habit.targetFrequency
      } (${progress}%)
   Progress Bar: ${bar} ${progress}%`);
    });
  }

  displayHabitsWithWhile() {
    console.log('\n📘 Demo While Loop:');
    let i = 0;
    while (i < this.habits.length) {
      console.log(`- ${this.habits[i].name}`);
      i++;
    }
  }

  displayHabitsWithFor() {
    console.log('\n📗 Demo For Loop:');
    for (let i = 0; i < this.habits.length; i++) {
      console.log(`- ${this.habits[i].name}`);
    }
  }

  displayStats() {
    const total = this.habits.length ?? 0;
    const done = this.habits.filter((h) => h.isCompletedThisWeek()).length ?? 0;
    const active = total - done;

    console.log(`
==================================================
 STATISTIK
==================================================
Total Habits: ${total}
Selesai: ${done}
Aktif: ${active}
==================================================`);
  }

  startReminder() {
    this.stopReminder();
    this.reminder = setInterval(() => this.showReminder(), REMINDER_INTERVAL);
  }

  showReminder() {
    const active = this.habits.filter((h) => !h.isCompletedThisWeek());
    if (active.length > 0) {
      const randomHabit = active[Math.floor(Math.random() * active.length)];
      console.log(`
==================================================
REMINDER: Jangan lupa "${randomHabit.name}"!
==================================================`);
    }
  }

  stopReminder() {
    if (this.reminder) clearInterval(this.reminder);
  }

  saveToFile() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(this.habits, null, 2));
  }

  loadFromFile() {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      this.habits = data.map((h) => Object.assign(new Habit(), h));
    }
  }

  clearAllData() {
    this.habits = [];
    this.saveToFile();
    console.log('🧹 Semua data telah dihapus.');
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function askQuestion(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function displayMenu() {
  console.log(`
==================================================
HABIT TRACKER - MAIN MENU
==================================================
1. Lihat Profil
2. Lihat Semua Kebiasaan
3. Lihat Kebiasaan Aktif
4. Lihat Kebiasaan Selesai
5. Tambah Kebiasaan Baru
6. Tandai Kebiasaan Selesai
7. Hapus Kebiasaan
8. Lihat Statistik
9. Demo Loop (while/for)
0. Keluar
==================================================`);
}

// ============================================
// HANDLE MENU
// ============================================
async function handleMenu(tracker) {
  tracker.startReminder();

  while (true) {
    displayMenu();
    const choice = await askQuestion('Pilih menu: ');

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
        tracker.displayHabits('done');
        break;
      case '5': {
        const name = await askQuestion('Masukkan nama kebiasaan: ');
        const freq = await askQuestion('Target per minggu: ');
        tracker.addHabit(name, parseInt(freq));
        break;
      }
      case '6': {
        tracker.displayHabits();
        const idx = await askQuestion('Pilih nomor kebiasaan: ');
        tracker.completeHabit(parseInt(idx));
        break;
      }
      case '7': {
        tracker.displayHabits();
        const idx = await askQuestion('Nomor habit yang ingin dihapus: ');
        tracker.deleteHabit(parseInt(idx));
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
        tracker.stopReminder();
        console.log('Terima kasih sudah menggunakan Habit Tracker!');
        rl.close();
        return;
      default:
        console.log(' Pilihan tidak valid.');
    }
  }
}

// ============================================
// MAIN FUNCTION
// ============================================
async function main() {
  console.log(`
==================================================
 SELAMAT DATANG DI HABIT TRACKER CLI
==================================================`);
  const tracker = new HabitTracker();
  await handleMenu(tracker);
}

// Jalankan main()
main().catch((err) => console.error('Terjadi error:', err));
