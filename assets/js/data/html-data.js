/**
 * ═══════════════════════════════════════════════════════════════
 * EduVerse — HTML Web Developer Track Data
 * ═══════════════════════════════════════════════════════════════
 */

export const HtmlModuleData = [
  {
    id: "html_01_intro",
    title: "1. Pengantar HTML",
    icon: "🌐",
    theory: `<h3>Apa itu HTML?</h3>
<p>HTML (HyperText Markup Language) adalah kerangka dasar dari semua halaman web. Bayangkan HTML sebagai tulang punggung dari sebuah website.</p>
<p>Setiap dokumen HTML selalu dimulai dengan struktur dasar agar browser mengenali isinya.</p>
<p><strong>Tugasmu:</strong></p>
<ul>
  <li>Di editor kode, lihatlah struktur dasar HTML.</li>
  <li>Ubah teks di dalam tag <code>&lt;h1&gt;</code> menjadi "Halo Dunia!".</li>
  <li>Perhatikan perubahan di layar preview sebelah kanan!</li>
</ul>`,
    initialCode: `<!DOCTYPE html>
<html>
<head>
  <title>Latihan HTML Pertamaku</title>
</head>
<body>
  <h1>Selamat Datang di EduVerse</h1>
  <p>Ini adalah paragraf pertamaku di web.</p>
</body>
</html>`,
  },
  {
    id: "html_02_text",
    title: "2. Format Teks & Paragraf",
    icon: "📝",
    theory: `<h3>Menulis Cerita dengan HTML</h3>
<p>Kamu bisa menggunakan berbagai tag untuk memformat teks:</p>
<ul>
  <li><code>&lt;p&gt;</code> untuk paragraf baru.</li>
  <li><code>&lt;strong&gt;</code> untuk teks tebal.</li>
  <li><code>&lt;em&gt;</code> untuk teks miring (italic).</li>
</ul>
<p><strong>Tugasmu:</strong></p>
<ul>
  <li>Buat satu paragraf baru.</li>
  <li>Tambahkan teks tebal dan miring di dalam paragraf tersebut.</li>
</ul>`,
    initialCode: `<!DOCTYPE html>
<html>
<body>
  <h2>Cerita Pendek</h2>
  <p>Pada suatu hari, ada seekor <strong>kucing</strong> yang sangat lucu.</p>
  
  <!-- Tulis paragraf barumu di bawah ini -->

</body>
</html>`,
  },
  {
    id: "html_03_links",
    title: "3. Tautan (Links)",
    icon: "🔗",
    theory: `<h3>Menghubungkan Dunia</h3>
<p>Internet adalah kumpulan halaman yang saling terhubung. Di HTML, kita menghubungkannya menggunakan tag <code>&lt;a&gt;</code> (Anchor).</p>
<p>Formatnya: <code>&lt;a href="url_tujuan"&gt;Teks yang diklik&lt;/a&gt;</code></p>
<p><strong>Tugasmu:</strong></p>
<ul>
  <li>Buat sebuah link yang mengarah ke <code>https://google.com</code> dengan teks "Buka Google".</li>
</ul>`,
    initialCode: `<!DOCTYPE html>
<html>
<body>
  <h2>Link Pertamaku</h2>
  <p>Klik link di bawah ini untuk mencari informasi:</p>
  
  <!-- Buat link kamu di bawah ini -->
  <a href=""></a>
  
</body>
</html>`,
  },
  {
    id: "html_04_images",
    title: "4. Menambahkan Gambar",
    icon: "🖼️",
    theory: `<h3>Mempercantik Web dengan Gambar</h3>
<p>Untuk menampilkan gambar, kita gunakan tag <code>&lt;img&gt;</code>. Tag ini spesial karena tidak butuh tag penutup!</p>
<p>Formatnya: <code>&lt;img src="url_gambar" alt="Deskripsi gambar" width="300"&gt;</code></p>
<p><strong>Tugasmu:</strong></p>
<ul>
  <li>Tambahkan tag <code>img</code> menggunakan link gambar yang sudah disediakan di editor.</li>
</ul>`,
    initialCode: `<!DOCTYPE html>
<html>
<body>
  <h2>Gambar Kucing Lucu</h2>
  
  <!-- Tambahkan gambar di bawah ini -->
  <!-- Link gambar: https://placekitten.com/300/200 -->

</body>
</html>`,
  },
  {
    id: "html_05_lists",
    title: "5. Membuat Daftar (Lists)",
    icon: "📋",
    theory: `<h3>Menyusun Daftar</h3>
<p>Ada dua jenis daftar utama di HTML:</p>
<ul>
  <li><code>&lt;ul&gt;</code> (Unordered List): Daftar dengan titik/bullet.</li>
  <li><code>&lt;ol&gt;</code> (Ordered List): Daftar dengan angka.</li>
</ul>
<p>Isi dari daftarnya dibuat dengan tag <code>&lt;li&gt;</code> (List Item).</p>
<p><strong>Tugasmu:</strong></p>
<ul>
  <li>Buat daftar belanjaan favoritmu menggunakan Ordered List (ol) dengan 3 item (li).</li>
</ul>`,
    initialCode: `<!DOCTYPE html>
<html>
<body>
  <h2>Daftar Hobi Saya</h2>
  <ul>
    <li>Bermain Game</li>
    <li>Membaca Buku</li>
  </ul>

  <h2>Daftar Belanja (Tugasmu)</h2>
  <!-- Buat Ordered List di bawah ini -->

</body>
</html>`,
  },
  {
    id: "html_06_css_intro",
    title: "6. Mewarnai Web (Intro CSS)",
    icon: "🎨",
    theory: `<h3>Ajaibnya CSS!</h3>
<p>HTML hanya kerangka, sedangkan CSS adalah bajunya. Kita bisa menambahkan warna menggunakan atribut <code>style</code> langsung di dalam tag HTML!</p>
<p>Contoh: <code>&lt;h1 style="color: blue; text-align: center;"&gt;</code></p>
<p><strong>Tugasmu:</strong></p>
<ul>
  <li>Ubah warna teks paragraf menjadi merah (<code>color: red;</code>).</li>
  <li>Buat judul h2 berada di tengah (<code>text-align: center;</code>).</li>
</ul>`,
    initialCode: `<!DOCTYPE html>
<html>
<body>
  <!-- Ubah style pada tag h2 dan p di bawah ini -->
  <h2>Halo Sobat Coder!</h2>
  <p>Teks ini akan menjadi berwarna merah.</p>
</body>
</html>`,
  }
];

export function getHtmlModuleMap() {
  const map = {};
  HtmlModuleData.forEach(m => {
    map[m.id] = m.title;
  });
  return map;
}
