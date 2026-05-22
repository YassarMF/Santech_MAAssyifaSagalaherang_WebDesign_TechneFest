/**
 * ═══════════════════════════════════════════════════════════════
 * EduVerse — Core Application Logic
 * ═══════════════════════════════════════════════════════════════
 * 
 * Handles:
 * - Local state management (localStorage cache + Firestore sync)
 * - Module/lesson data for the Data Analyst Track
 * - Streak calculation
 * - UI helpers (toast, XP animation, sidebar rendering)
 */

import {
  isFirebaseReady,
  getUserByUsername,
  createUser,
  getUserDoc,
  updateUserXP,
  addCompletedModule,
  addWeakness,
  updateStreak,
  updateUser
} from './firebase-config.js';


// ═══════════════════════════════════════════════════════════════
// LOCAL STORAGE CACHE
// ═══════════════════════════════════════════════════════════════

const STORAGE_KEY = 'eduverse_user';

export const AppState = {
  /**
   * Get cached user from localStorage
   */
  getUser() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data);
    } catch (e) {
      console.error("Error reading user cache:", e);
      return null;
    }
  },

  /**
   * Save user data to localStorage cache
   */
  saveUser(userData) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch (e) {
      console.error("Error saving user cache:", e);
    }
  },

  /**
   * Clear user data and redirect to login
   */
  logout() {
    localStorage.removeItem(STORAGE_KEY);
    const basePath = window.location.pathname.includes('/pages/') ? '../' : './';
    window.location.href = basePath + 'index.html';
  },

  /**
   * Protect page — redirect to login if not authenticated
   */
  requireAuth() {
    if (!this.getUser()) {
      const basePath = window.location.pathname.includes('/pages/') ? '../' : './';
      window.location.href = basePath + 'index.html';
      return false;
    }
    return true;
  },

  /**
   * Login or register user
   * @param {string} username 
   * @param {string} school 
   * @returns {Object} user data
   */
  async login(username, school) {
    if (!isFirebaseReady()) {
      // Fallback: local-only mode
      const localUser = {
        id: 'local_' + Date.now(),
        username: username.trim().toLowerCase(),
        displayName: username.trim(),
        school: school.trim(),
        xp: 0,
        streak: 1,
        lastLogin: new Date().toISOString(),
        completedModules: [],
        weaknesses: []
      };
      this.saveUser(localUser);
      return localUser;
    }

    // Check if user exists in Firestore
    let user = await getUserByUsername(username);

    if (user) {
      // Existing user — calculate streak
      const streak = this.calculateStreak(user.lastLogin, user.streak);
      user.streak = streak;
      
      // Update last login and streak in Firestore
      await updateStreak(user.id, streak);
      user.lastLogin = new Date().toISOString();
      
      this.saveUser(user);
      return user;
    } else {
      // New user — create in Firestore
      const newUser = await createUser(username, school);
      this.saveUser(newUser);
      return newUser;
    }
  },

  /**
   * Calculate streak based on last login
   */
  calculateStreak(lastLoginISO, currentStreak) {
    if (!lastLoginISO) return 1;

    const lastLogin = new Date(lastLoginISO);
    const today = new Date();

    // Reset time to midnight for comparison
    const lastDate = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Same day — keep current streak
      return currentStreak || 1;
    } else if (diffDays === 1) {
      // Consecutive day — increment streak
      return (currentStreak || 0) + 1;
    } else {
      // Streak broken — reset to 1
      return 1;
    }
  },

  /**
   * Add XP and sync to Firestore
   */
  async addXP(amount) {
    const user = this.getUser();
    if (!user) return;

    user.xp = (user.xp || 0) + amount;
    this.saveUser(user);

    if (isFirebaseReady() && user.id && !user.id.startsWith('local_')) {
      try {
        await updateUserXP(user.id, user.xp);
      } catch (e) {
        console.error("Failed to sync XP:", e);
      }
    }

    return user;
  },

  /**
   * Mark module as completed and sync
   */
  async completeModule(moduleId) {
    const user = this.getUser();
    if (!user) return;

    if (!user.completedModules) user.completedModules = [];
    if (!user.completedModules.includes(moduleId)) {
      user.completedModules.push(moduleId);
      this.saveUser(user);

      if (isFirebaseReady() && user.id && !user.id.startsWith('local_')) {
        try {
          await addCompletedModule(user.id, moduleId);
        } catch (e) {
          console.error("Failed to sync completed module:", e);
        }
      }
    }
  },

  /**
   * Record a weakness topic and sync
   */
  async recordWeakness(topic) {
    const user = this.getUser();
    if (!user) return;

    if (!user.weaknesses) user.weaknesses = [];
    if (!user.weaknesses.includes(topic)) {
      user.weaknesses.push(topic);
      this.saveUser(user);

      if (isFirebaseReady() && user.id && !user.id.startsWith('local_')) {
        try {
          await addWeakness(user.id, topic);
        } catch (e) {
          console.error("Failed to sync weakness:", e);
        }
      }
    }
  },

  /**
   * Refresh user data from Firestore
   */
  async refreshFromFirestore() {
    const user = this.getUser();
    if (!user || !isFirebaseReady() || !user.id || user.id.startsWith('local_')) return user;

    try {
      const freshData = await getUserDoc(user.id);
      if (freshData) {
        this.saveUser(freshData);
        return freshData;
      }
    } catch (e) {
      console.error("Failed to refresh from Firestore:", e);
    }
    return user;
  },

  /**
   * Initialize Global Study Timer
   */
  initStudyTimer() {
    let user = this.getUser();
    if (!user) return;

    // Tick every 5 seconds
    setInterval(() => {
      user = this.getUser(); // re-fetch
      if (!user) return;
      
      const today = new Date().toISOString().split('T')[0];
      if (!user.studyTime || user.studyTime.date !== today) {
        user.studyTime = { date: today, seconds: 0 };
      }
      
      user.studyTime.seconds += 5;
      this.saveUser(user);

      // Dispatch event for UI
      window.dispatchEvent(new CustomEvent('studyTimeUpdated', { detail: user.studyTime.seconds }));
    }, 5000);
  }
};

// Start timer if user is logged in
if (AppState.getUser()) {
  AppState.initStudyTimer();
}


// ═══════════════════════════════════════════════════════════════
// MODULE DATA — Data Analyst Track
// ═══════════════════════════════════════════════════════════════

export const ModuleData = [
  {
    id: "mod_01_intro",
    title: "Pengantar Data Analytics",
    icon: "📊",
    description: "Memahami apa itu data analytics dan perannya di dunia kerja.",
    theory: `<h3>Apa itu Data Analytics?</h3>
<p>Data Analytics adalah proses mengumpulkan, membersihkan, menganalisis, dan memvisualisasikan data untuk mengambil keputusan bisnis yang lebih baik.</p>
<p>Seorang Data Analyst bertugas menjawab pertanyaan bisnis menggunakan data. Misalnya: <em>"Produk apa yang paling laris bulan ini?"</em> atau <em>"Mengapa penjualan turun 20%?"</em></p>
<p><strong>Skill utama:</strong> Berpikir analitis, Excel, SQL, Visualisasi Data, dan kemampuan berkomunikasi.</p>
<p>Gaji rata-rata Data Analyst di Indonesia: <strong>Rp 7-15 juta/bulan</strong> 🚀</p>`,
    quiz: {
      question: "Apa tugas utama seorang Data Analyst?",
      options: [
        "Membuat website dan aplikasi mobile",
        "Menganalisis data untuk mengambil keputusan bisnis",
        "Mendesain logo dan branding perusahaan",
        "Mengelola server dan infrastruktur IT"
      ],
      correctIndex: 1,
      topic: "Pengantar Data Analytics"
    }
  },
  {
    id: "mod_02_excel",
    title: "Dasar Microsoft Excel",
    icon: "📗",
    description: "Menguasai formula, fungsi, dan pivot table di Excel.",
    theory: `<h3>Excel: Senjata Pertama Data Analyst</h3>
<p>Microsoft Excel adalah tools paling dasar dan penting untuk seorang Data Analyst. Banyak perusahaan masih menggunakan Excel untuk analisis data sehari-hari.</p>
<p><strong>Formula penting yang wajib dikuasai:</strong></p>
<ul>
  <li><code>SUM()</code> — Menjumlahkan data</li>
  <li><code>AVERAGE()</code> — Menghitung rata-rata</li>
  <li><code>VLOOKUP()</code> — Mencari data dari tabel lain</li>
  <li><code>IF()</code> — Membuat logika kondisional</li>
  <li><code>COUNTIF()</code> — Menghitung data berdasarkan kriteria</li>
</ul>
<p><strong>Pivot Table</strong> adalah fitur ajaib Excel untuk merangkum ribuan baris data menjadi tabel ringkasan hanya dalam beberapa klik! 🎯</p>`,
    quiz: {
      question: "Fungsi Excel mana yang digunakan untuk mencari data dari tabel lain?",
      options: [
        "SUM()",
        "AVERAGE()",
        "VLOOKUP()",
        "COUNTIF()"
      ],
      correctIndex: 2,
      topic: "Microsoft Excel"
    }
  },
  {
    id: "mod_03_stats",
    title: "Statistik Deskriptif",
    icon: "📈",
    description: "Mean, median, modus, dan standar deviasi.",
    theory: `<h3>Statistik: Bahasa Data</h3>
<p>Statistik deskriptif membantu kita meringkas dan memahami karakteristik dari sekelompok data.</p>
<p><strong>4 Ukuran Pemusatan Data:</strong></p>
<ul>
  <li><strong>Mean (Rata-rata):</strong> Jumlah semua nilai dibagi banyaknya data</li>
  <li><strong>Median:</strong> Nilai tengah setelah data diurutkan</li>
  <li><strong>Modus:</strong> Nilai yang paling sering muncul</li>
  <li><strong>Standar Deviasi:</strong> Ukuran seberapa tersebar data dari rata-ratanya</li>
</ul>
<p><em>Contoh:</em> Data gaji [5, 6, 7, 8, 100] juta. Mean = 25.2 juta, tapi Median = 7 juta. Median lebih representatif karena tidak dipengaruhi outlier (nilai 100)! 🧠</p>`,
    quiz: {
      question: "Jika data = [3, 5, 5, 7, 10], berapakah modusnya?",
      options: [
        "3",
        "5",
        "6",
        "10"
      ],
      correctIndex: 1,
      topic: "Statistik Deskriptif"
    }
  },
  {
    id: "mod_04_sql",
    title: "Pengantar SQL",
    icon: "🗄️",
    description: "SELECT, WHERE, JOIN, dan GROUP BY.",
    theory: `<h3>SQL: Bahasa Query Database</h3>
<p>SQL (Structured Query Language) adalah bahasa standar untuk berkomunikasi dengan database. Hampir semua perusahaan yang bekerja dengan data menggunakan SQL.</p>
<p><strong>Perintah dasar SQL:</strong></p>
<ul>
  <li><code>SELECT</code> — Memilih kolom yang ingin ditampilkan</li>
  <li><code>FROM</code> — Menentukan tabel sumber data</li>
  <li><code>WHERE</code> — Memfilter data berdasarkan kondisi</li>
  <li><code>GROUP BY</code> — Mengelompokkan data</li>
  <li><code>JOIN</code> — Menggabungkan dua tabel berdasarkan kolom yang sama</li>
  <li><code>ORDER BY</code> — Mengurutkan hasil</li>
</ul>
<p><em>Contoh:</em> <code>SELECT nama, gaji FROM karyawan WHERE departemen = 'IT' ORDER BY gaji DESC;</code></p>
<p>Query di atas menampilkan nama dan gaji karyawan IT, diurutkan dari gaji terbesar! 💡</p>`,
    quiz: {
      question: "Perintah SQL mana yang digunakan untuk memfilter data?",
      options: [
        "SELECT",
        "FROM",
        "WHERE",
        "GROUP BY"
      ],
      correctIndex: 2,
      topic: "SQL Dasar"
    }
  },
  {
    id: "mod_05_dataviz",
    title: "Visualisasi Data",
    icon: "🎨",
    description: "Jenis chart, best practices, dan data storytelling.",
    theory: `<h3>Visualisasi: Seni Bercerita dengan Data</h3>
<p>Visualisasi data mengubah angka-angka menjadi gambar yang mudah dipahami. Sebuah chart yang baik bisa menyampaikan insight dalam hitungan detik!</p>
<p><strong>Jenis chart yang umum:</strong></p>
<ul>
  <li><strong>Bar Chart:</strong> Membandingkan kategori (penjualan per produk)</li>
  <li><strong>Line Chart:</strong> Menunjukkan trend waktu (penjualan bulanan)</li>
  <li><strong>Pie Chart:</strong> Menunjukkan proporsi/persentase (market share)</li>
  <li><strong>Scatter Plot:</strong> Hubungan antara 2 variabel (harga vs penjualan)</li>
</ul>
<p><strong>Best Practice:</strong> Gunakan judul yang jelas, label sumbu, warna yang konsisten, dan hindari 3D chart yang menyesatkan. Less is more! 🎯</p>`,
    quiz: {
      question: "Jenis chart apa yang paling tepat untuk menunjukkan trend penjualan selama 12 bulan?",
      options: [
        "Pie Chart",
        "Line Chart",
        "Scatter Plot",
        "Treemap"
      ],
      correctIndex: 1,
      topic: "Visualisasi Data"
    }
  },
  {
    id: "mod_06_python",
    title: "Python untuk Data",
    icon: "🐍",
    description: "Dasar Pandas dan NumPy untuk analisis data.",
    theory: `<h3>Python: Swiss Army Knife Data Analyst</h3>
<p>Python adalah bahasa pemrograman paling populer untuk data analysis. Dua library utamanya:</p>
<p><strong>🐼 Pandas</strong> — Library untuk manipulasi dan analisis data tabular.</p>
<ul>
  <li><code>pd.read_csv()</code> — Membaca file CSV</li>
  <li><code>df.head()</code> — Melihat 5 baris pertama</li>
  <li><code>df.describe()</code> — Statistik ringkas</li>
  <li><code>df.groupby()</code> — Mengelompokkan data</li>
</ul>
<p><strong>🔢 NumPy</strong> — Library untuk operasi matematika dan array.</p>
<ul>
  <li><code>np.mean()</code>, <code>np.median()</code>, <code>np.std()</code></li>
</ul>
<p><em>Contoh:</em> <code>df.groupby('kota')['penjualan'].sum()</code> — menghitung total penjualan per kota! 🏙️</p>`,
    quiz: {
      question: "Library Python apa yang digunakan untuk manipulasi data tabular?",
      options: [
        "NumPy",
        "Matplotlib",
        "Pandas",
        "Scikit-learn"
      ],
      correctIndex: 2,
      topic: "Python untuk Data"
    }
  },
  {
    id: "mod_07_advanced",
    title: "Analisis Data Lanjutan",
    icon: "🔬",
    description: "Korelasi, regresi, dan trend analysis.",
    theory: `<h3>Analisis Lanjutan: Menggali Lebih Dalam</h3>
<p>Setelah menguasai dasar-dasar, saatnya belajar teknik analisis yang lebih mendalam:</p>
<p><strong>📊 Korelasi</strong> — Mengukur hubungan antara 2 variabel. Nilainya dari -1 hingga +1.</p>
<ul>
  <li>+1: Hubungan positif sempurna (jika A naik, B juga naik)</li>
  <li>-1: Hubungan negatif sempurna (jika A naik, B turun)</li>
  <li>0: Tidak ada hubungan</li>
</ul>
<p><strong>📈 Regresi Linear</strong> — Memprediksi nilai variabel berdasarkan variabel lain. Contoh: memprediksi penjualan berdasarkan budget iklan.</p>
<p><strong>⚠️ Penting:</strong> Korelasi ≠ Kausalitas! Es krim dan kriminalitas bisa berkorelasi, tapi bukan berarti es krim menyebabkan kejahatan! 😄</p>`,
    quiz: {
      question: "Jika korelasi antara variabel A dan B adalah -0.9, apa artinya?",
      options: [
        "Tidak ada hubungan antara A dan B",
        "A dan B bergerak ke arah yang sama",
        "A dan B memiliki hubungan negatif kuat",
        "A menyebabkan B turun"
      ],
      correctIndex: 2,
      topic: "Korelasi dan Regresi"
    }
  },
  {
    id: "mod_08_ml_intro",
    title: "Pengantar Machine Learning",
    icon: "🤖",
    description: "Supervised vs unsupervised learning dan use cases.",
    theory: `<h3>Machine Learning: Masa Depan Data</h3>
<p>Machine Learning (ML) adalah cabang AI dimana komputer "belajar" dari data tanpa diprogram secara eksplisit.</p>
<p><strong>2 Jenis Utama ML:</strong></p>
<p><strong>1. Supervised Learning</strong> — Model belajar dari data berlabel.</p>
<ul>
  <li>Klasifikasi: email spam atau bukan? 📧</li>
  <li>Regresi: prediksi harga rumah 🏠</li>
</ul>
<p><strong>2. Unsupervised Learning</strong> — Model menemukan pola tanpa label.</p>
<ul>
  <li>Clustering: segmentasi pelanggan 👥</li>
  <li>Anomaly Detection: deteksi transaksi mencurigakan 🔍</li>
</ul>
<p>Sebagai Data Analyst, kamu tidak perlu jadi ML expert, tapi memahami konsepnya akan membuat kamu lebih valuable di perusahaan! 🌟</p>`,
    quiz: {
      question: "Mengelompokkan pelanggan berdasarkan perilaku belanja tanpa label termasuk jenis ML apa?",
      options: [
        "Supervised Learning",
        "Reinforcement Learning",
        "Unsupervised Learning",
        "Transfer Learning"
      ],
      correctIndex: 2,
      topic: "Machine Learning"
    }
  }
];

/**
 * Build a map of module ID to title (for Gemini prompts)
 */
export function getModuleMap() {
  const map = {};
  ModuleData.forEach(m => {
    map[m.id] = m.title;
  });
  return map;
}


// ═══════════════════════════════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════════════════════════════

export const UI = {
  /**
   * Show a toast notification
   */
  showToast(message, type = 'success', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const icons = {
      success: '✅',
      error: '❌',
      xp: '⭐',
      info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icons[type] || '📢'}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  /**
   * Show XP floating animation at position
   */
  showXPFloat(amount, x, y) {
    const el = document.createElement('div');
    el.className = 'xp-float';
    el.textContent = `+${amount} XP`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  },

  /**
   * Render sidebar with user data (call on each protected page)
   */
  renderSidebar(activePage) {
    const user = AppState.getUser();
    if (!user) return;

    const sidebar = document.getElementById('app-sidebar');
    if (!sidebar) return;

    const xpForLevel = (level) => Math.pow(level * 10, 2);
    const currentLevel = Math.floor(0.1 * Math.sqrt(user.xp || 0)) + 1;
    const currentLevelXP = xpForLevel(currentLevel - 1);
    const nextLevelXP = xpForLevel(currentLevel);
    const progress = nextLevelXP - currentLevelXP > 0
      ? Math.min(((user.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100, 100)
      : 0;

    const navItems = [
      { id: 'dashboard', href: 'dashboard.html', icon: 'fa-compass', label: 'Dashboard' },
      { id: 'course', href: 'course.html', icon: 'fa-map', label: 'Materi Belajar' },
      { id: 'career', href: 'career.html', icon: 'fa-briefcase', label: 'Career Tracks' },
      { id: 'assistant', href: 'assistant.html', icon: 'fa-robot', label: 'AI Assistant' },
      { id: 'leaderboard', href: 'leaderboard.html', icon: 'fa-trophy', label: 'Leaderboard' }
    ];

    sidebar.innerHTML = `
      <div class="sidebar-logo">
        <div class="sidebar-logo-icon">
          <i class="fa-solid fa-rocket"></i>
        </div>
        <span class="sidebar-logo-text">EduVerse</span>
      </div>

      <div class="sidebar-user">
        <div class="sidebar-avatar">🧑‍🚀</div>
        <div class="sidebar-username">${user.displayName || user.username}</div>
        <div class="sidebar-school">${user.school || ''}</div>
        <div class="sidebar-stats">
          <span class="neo-badge neo-badge-purple">⚡ ${user.xp || 0} XP</span>
          <span class="neo-badge neo-badge-orange">
            <span class="streak-fire">🔥 ${user.streak || 1}</span>
          </span>
        </div>
      </div>

      <div class="sidebar-xp-section" style="padding-top: 1rem;">
        <div class="xp-bar-label">
          <span>Level ${currentLevel}</span>
          <span>${user.xp || 0} / ${nextLevelXP} XP</span>
        </div>
        <div class="xp-bar-container">
          <div class="xp-bar-fill" style="width: ${progress}%"></div>
        </div>
      </div>

      <nav class="sidebar-nav">
        ${navItems.map(item => `
          <a href="${item.href}" class="nav-link ${activePage === item.id ? 'active' : ''}">
            <i class="fa-solid ${item.icon}"></i>
            ${item.label}
          </a>
        `).join('')}
      </nav>

      <div class="sidebar-footer">
        <button onclick="window.EduVerse.logout()" class="neo-btn neo-btn-sm neo-btn-block" style="background: var(--card-pink);">
          <i class="fa-solid fa-right-from-bracket"></i> Keluar
        </button>
      </div>
    `;

    // Animate XP bar after render
    requestAnimationFrame(() => {
      const bar = sidebar.querySelector('.xp-bar-fill');
      if (bar) {
        bar.style.width = '0%';
        requestAnimationFrame(() => {
          bar.style.width = `${progress}%`;
        });
      }
    });
  },

  /**
   * Render mobile bottom navigation
   */
  renderMobileNav(activePage) {
    const nav = document.getElementById('mobile-nav');
    if (!nav) return;

    const items = [
      { id: 'dashboard', href: 'dashboard.html', icon: 'fa-compass', label: 'Home' },
      { id: 'course', href: 'course.html', icon: 'fa-map', label: 'Belajar' },
      { id: 'career', href: 'career.html', icon: 'fa-briefcase', label: 'Karir' },
      { id: 'assistant', href: 'assistant.html', icon: 'fa-robot', label: 'AI' },
      { id: 'leaderboard', href: 'leaderboard.html', icon: 'fa-trophy', label: 'Rank' }
    ];

    nav.innerHTML = `
      <div class="mobile-nav-links">
        ${items.map(item => `
          <a href="${item.href}" class="mobile-nav-link ${activePage === item.id ? 'active' : ''}">
            <i class="fa-solid ${item.icon}"></i>
            ${item.label}
          </a>
        `).join('')}
      </div>
    `;
  }
};

// ── Expose logout globally for onclick handlers ────────────────
window.EduVerse = {
  logout: () => AppState.logout()
};

// ═══════════════════════════════════════════════════════════════
// MODULE DATA — Python Backend Track
// ═══════════════════════════════════════════════════════════════

export const PythonData = [
  {
    id: "py_01_intro",
    title: "Pengantar Python Backend",
    icon: "🐍",
    description: "Mengenal Python dan perannya sebagai bahasa backend modern.",
    theory: `<h3>Mengapa Python untuk Backend?</h3>
<p>Python adalah bahasa yang sangat populer untuk membuat server (backend), API, dan sistem berskala besar. Perusahaan seperti Instagram, Spotify, dan Netflix sangat bergantung pada Python!</p>
<p>Sifatnya yang mudah dibaca membuat Python menjadi bahasa yang sempurna untuk pemula sekaligus *powerful* bagi profesional.</p>`,
    quiz: {
      question: "Apa fungsi utama Python di sisi Backend?",
      options: [
        "Membuat desain tampilan website",
        "Mengelola logika server dan database",
        "Menulis artikel untuk blog",
        "Membuat animasi di browser"
      ],
      correctIndex: 1,
      clue: "Backend berkaitan dengan logika di balik layar, bukan tampilan yang dilihat pengguna.",
      topic: "Python Basics"
    }
  },
  {
    id: "py_02_vars",
    title: "Variabel & Tipe Data",
    icon: "📦",
    description: "Cara menyimpan dan memanipulasi data di Python.",
    theory: `<h3>Menyimpan Data di Python</h3>
<p>Di Python, Anda tidak perlu mendeklarasikan tipe data secara eksplisit. Python cukup pintar untuk menebaknya!</p>
<code>umur = 20<br>nama = "Budi"<br>is_aktif = True</code>
<p>Tipe data utama: <strong>Integer</strong> (angka bulat), <strong>String</strong> (teks), <strong>Float</strong> (angka desimal), dan <strong>Boolean</strong> (Benar/Salah).</p>`,
    quiz: {
      question: "Manakah cara pembuatan variabel String yang benar di Python?",
      options: [
        "String nama = Budi",
        "nama = \"Budi\"",
        "var nama = 'Budi'",
        "let nama = Budi"
      ],
      correctIndex: 1,
      clue: "Di Python, kita tidak menggunakan kata kunci 'String', 'var', atau 'let'. Cukup nama variabel diikuti tanda sama dengan dan tanda kutip.",
      topic: "Python Variables"
    }
  },
  {
    id: "py_03_logic",
    title: "Logika Percabangan (If/Else)",
    icon: "🔀",
    description: "Membuat program yang bisa mengambil keputusan.",
    theory: `<h3>If, Elif, Else</h3>
<p>Program sering kali harus mengambil keputusan. Di Python, kita menggunakan <code>if</code>, <code>elif</code>, dan <code>else</code>.</p>
<code>
if umur >= 17:<br>
&nbsp;&nbsp;&nbsp;&nbsp;print("Boleh buat KTP")<br>
else:<br>
&nbsp;&nbsp;&nbsp;&nbsp;print("Belum cukup umur")
</code>
<p>Perhatikan <strong>indentasi</strong> (spasi di awal baris). Python menggunakan indentasi untuk memisahkan blok kode, bukan tanda kurung kurawal <code>{}</code>.</p>`,
    quiz: {
      question: "Apa yang digunakan Python untuk menandai blok kode (seperti di dalam if)?",
      options: [
        "Tanda kurung kurawal {}",
        "Tanda kurung biasa ()",
        "Indentasi (Spasi/Tab)",
        "Tanda titik koma ;"
      ],
      correctIndex: 2,
      clue: "Tidak seperti C++ atau JS yang memakai kurung kurawal {}, Python memaksa kodenya rapi dengan menggunakan spasi atau tab di awal baris.",
      topic: "Python Logic"
    }
  }
];

// ═══════════════════════════════════════════════════════════════
// MODULE DATA — UI/UX Designer Track
// ═══════════════════════════════════════════════════════════════

export const UiUxData = [
  {
    id: "ux_01_intro",
    title: "Pengantar UI & UX",
    icon: "🎨",
    description: "Perbedaan antara UI (User Interface) dan UX (User Experience).",
    theory: `<h3>UI vs UX</h3>
<p><strong>UI (User Interface)</strong> adalah segala sesuatu yang pengguna <em>lihat</em> dan sentuh: warna, tipografi, tombol, dan gambar.</p>
<p><strong>UX (User Experience)</strong> adalah apa yang pengguna <em>rasakan</em> saat menggunakan produk: apakah mudah digunakan? Apakah membingungkan? Apakah mereka mencapai tujuannya dengan cepat?</p>
<p>Desain yang cantik (UI) tanpa kemudahan (UX) sama saja dengan mobil sport yang tidak ada mesinnya!</p>`,
    quiz: {
      question: "Fokus utama dari UX (User Experience) adalah...",
      options: [
        "Memilih warna tombol yang menarik",
        "Memastikan pengalaman pengguna lancar dan mudah",
        "Menulis kode program agar website berjalan",
        "Membuat animasi transisi halaman"
      ],
      correctIndex: 1,
      clue: "UX (Experience) adalah tentang 'Pengalaman', sementara memilih warna lebih masuk ke ranah UI (Interface).",
      topic: "UI/UX Basics"
    }
  },
  {
    id: "ux_02_principles",
    title: "Prinsip Desain Hierarki",
    icon: "📐",
    description: "Mengarahkan mata pengguna dengan ukuran dan kontras.",
    theory: `<h3>Hierarki Visual</h3>
<p>Hierarki visual mengatur elemen-elemen di layar sehingga pengguna tahu mana yang paling penting untuk dilihat pertama kali.</p>
<ul>
  <li><strong>Ukuran:</strong> Teks besar akan dibaca lebih dulu.</li>
  <li><strong>Kontras:</strong> Warna terang di atas latar gelap akan menonjol.</li>
  <li><strong>Ruang Kosong (White Space):</strong> Memberi ruang bernapas agar desain tidak terlihat sumpek.</li>
</ul>`,
    quiz: {
      question: "Mengapa Ruang Kosong (White space) penting dalam desain UI?",
      options: [
        "Untuk menghemat tinta saat dicetak",
        "Agar desain terlihat penuh dan ramai",
        "Memberi ruang bernapas agar informasi mudah dicerna",
        "Karena desainer malas mengisi area tersebut"
      ],
      correctIndex: 2,
      clue: "Ruang kosong membantu memisahkan elemen-elemen agar mata pengguna tidak cepat lelah dan bisa fokus pada informasi penting.",
      topic: "Design Principles"
    }
  },
  {
    id: "ux_03_figma",
    title: "Mengenal Figma",
    icon: "🖌️",
    description: "Tools standar industri untuk desain UI/UX.",
    theory: `<h3>Figma: Kanvas Kolaborasi</h3>
<p>Figma adalah aplikasi desain berbasis *browser* yang memungkinkan banyak orang mendesain secara bersamaan layaknya Google Docs.</p>
<p>Di Figma, kita mengenal istilah <strong>Frame</strong> (kanvas desain seperti layar iPhone atau Desktop) dan <strong>Auto Layout</strong> (fitur ajaib untuk membuat elemen yang ukurannya menyesuaikan isi secara otomatis).</p>`,
    quiz: {
      question: "Apa fungsi dari fitur Auto Layout di Figma?",
      options: [
        "Mewarnai objek secara otomatis",
        "Membuat elemen menyesuaikan ukuran secara otomatis dan rapi",
        "Menghapus *background* foto",
        "Menulis kode HTML/CSS"
      ],
      correctIndex: 1,
      clue: "Auto Layout berfungsi mengatur padding, spacing, dan ukuran *container* agar selalu menyesuaikan isinya (responsif) tanpa digeser manual.",
      topic: "Figma"
    }
  }
];
