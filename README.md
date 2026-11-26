# CARE BRIDGE — Community-Based Crisis Counseling and Psychosocial Support Bridge

**Tagline:** *"Menghubungkan Kepedulian, Menguatkan Pemulihan."*

Prototipe platform layanan konseling krisis berbasis komunitas untuk mendukung pemulihan psikososial masyarakat pascabencana di Aceh.

> **Pemberitahuan Prototipe:** Aplikasi ini adalah **prototipe demonstrasi CARE BRIDGE** yang belum digunakan untuk pelayanan klinis sungguhan. Seluruh data, statistik, autentikasi demonstrasi, dan chatbot CARE Assistant menggunakan data simulasi serta basis pengetahuan lokal.

---

## Arsitektur & Teknologi

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Lucide React, Recharts, Zod.
- **Backend:** Node.js + Express 5 + TypeScript.
- **Database:** SQLite relasional melalui `node:sqlite` bawaan Node.js v24 dengan skema migrasi (`server/db/schema.sql`), transaksi, dan seed data Aceh pascabencana (`data/carebridge.db`).
- **Mesin Pengarah Layanan:** `shared/decisionEngine.ts` (rule-based konseptual berbasis jawaban skrining: rasa aman, perubahan perasaan, gangguan tidur, aktivitas harian, dukungan sosial, kebutuhan praktis, serta keinginan pendamping — tanpa skor klinis atau diagnosis).
- **CARE Assistant:** `server/services/careAssistant.ts` (terpisah dari jalur keputusan klinis/skrining; memakai pencarian kata kunci lokal atas `knowledge_documents` & artikel terbit karena API LLM eksternal & vector DB RAG belum diintegrasikan pada prototipe, dilengkapi deteksi kata kunci krisis dan pelaporan ketidaksesuaian jawaban).

---

## Cara Instalasi & Menjalankan

### Prasyarat
- **Node.js v24+** (menggunakan modul bawaan `node:sqlite`)
- **npm**

### Langkah Menjalankan (Mode Development)
```bash
npm install
npm run dev
```
- Frontend Vite berjalan pada `http://localhost:5173` (dengan proxy `/api` ke port `4000`).
- Backend Express API berjalan pada `http://localhost:4000`.

### Build & Jalankan Produksi (Single Server)
```bash
npm run build
npm start
```
Setelah `npm run build`, jalankan `npm start` untuk mengakses seluruh aplikasi full-stack pada `http://localhost:4000`.

### Menjalankan Pemeriksaan & Pengujian Otomatis
```bash
npm run typecheck
npm test
```

### Reset Database Demonstrasi
```bash
npm run db:reset
```
Atau klik tombol **"Reset Data Demo"** di dalam Dashboard Kader / Konselor (`/konselor/pengaturan`).

---

## Akun Demonstrasi (Hanya untuk Presentasi)

| Peran | Username | Kata Sandi | Wilayah / Keterangan |
| :--- | :--- | :--- | :--- |
| **Kader Pendamping** | `kader.aceh` | `kader123` | Rizky Pratama — Posko Banda Aceh |
| **Kader Pendamping 2** | `kader.meulaboh` | `kader123` | Cut Nyak Nadia — Posko Meulaboh (menguji batas kasus antarkader) |
| **Konselor Profesional** | `konselor.ratna` | `konselor123` | Dr. Ratna Dewi, M.Psi. — Koordinator Supervisi & Rujukan |

> **Catatan Keamanan:** Kredensial di atas hanya simulasi demonstrasi yang divalidasi di sisi server prototipe dan **tidak aman untuk penggunaan produksi**.

---

## Daftar Halaman / Route Aplikasi

### Halaman Publik & Kiosk
- `/` — Landing Page utama, CTA Skrining, Minta Pendamping Tanpa Skrining, Alur Layanan Terintegrasi.
- `/skrining` — Wizard Skrining Psikososial 6 langkah (Persetujuan, Data Diri minimal/anonim, Kondisi, Dukungan, Pendampingan, Konfirmasi).
- `/hasil` — Ringkasan Kebutuhan & Pengarah Layanan (plus jalur eskalasi Bantuan Segera).
- `/informasi` — Portal Edukasi Psikososial (7 kategori terstruktur).
- `/informasi/:slug` — Detail artikel edukasi, sumber referensi, dan materi terkait.
- `/assistant` — CARE Assistant (Demo — basis pengetahuan lokal).
- `/bantuan` — Jalur Bantuan Segera, kontak darurat 119/112, dan instruksi eskalasi langsung.
- `/masuk` — Halaman masuk demonstrasi berbasis peran.

### Dashboard Kader Pendamping (Memerlukan login peran `kader`)
- `/kader/dashboard` — KPI ringkasan dan antrean permintaan pendampingan.
- `/kader/pendampingan` — Pencarian, filter status/kebutuhan, pengurutan, dan pagination.
- `/kader/pendampingan/:id` — Terima pendampingan, catat tindak lanjut, konsultasi supervisi ke konselor, dan tandai selesai.
- `/kader/riwayat` — Arsip pendampingan selesai & riwayat supervisi.
- `/kader/edukasi` — Referensi cepat materi edukasi lapangan.

### Dashboard Konselor Profesional (Memerlukan login peran `konselor`)
- `/konselor/dashboard` — KPI konselor, grafik tren layanan (Recharts), dan aktivitas terbaru.
- `/konselor/permintaan` — Tinjauan permintaan profesional & pembaruan status tindak lanjut.
- `/konselor/supervisi` — Antrean permintaan supervisi kader dan pengiriman arahan kembali ke kader.
- `/konselor/rujukan` — Pengelolaan rujukan ke RSUD / Puskesmas.
- `/konselor/tindak-lanjut` — Pemantauan kasus berjalan dan riwayat audit perubahan status.
- `/konselor/materi` — Buat, edit, terbitkan, simpan draf, dan hapus materi edukasi.
- `/konselor/statistik` — Analitik dinamis berbasis catatan tersimpan.
- `/konselor/pengaturan` — Reset data demonstrasi dan transparansi keterbatasan prototipe.

---

## Keterbatasan Prototipe

1. **Bukan Layanan Klinis & Belum Divalidasi:** Tidak menghasilkan diagnosis gangguan mental maupun skor klinis; pertanyaan skrining serta aturan pemicu rekomendasi masih memerlukan validasi konselor dan mitra layanan setempat.
2. **CARE Assistant Lokal:** Menggunakan pencarian kata kunci atas dokumen pengetahuan lokal dan artikel terbit; integrasi API LLM eksternal dan vector database RAG belum terhubung pada prototipe ini.
3. **Keamanan & Mode Kiosk/Luring:** Server prototipe lokal belum mengaktifkan enkripsi penuh tingkat produksi, kebijakan retensi otomatis, maupun sinkronisasi antrean luring otomatis saat koneksi terputus. Tombol *"Selesai dan Hapus Sesi"* membersihkan draf skrining, hasil tampilan, dan riwayat chat pada `sessionStorage` browser tanpa menghapus permintaan yang sudah dikirim secara sah ke server.
4. **Eskalasi Darurat Manual:** Jalur Bantuan Segera menampilkan kontak resmi (119/112, Posko BPBA) tanpa integrasi panggilan telepon otomatis atau pengiriman ambulans langsung.
