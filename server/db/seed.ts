import crypto from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { withTransaction } from './database.js';

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(`carebridge-demo:${password}`).digest('hex');
}

function daysAgo(days: number, hoursOffset = 0): string {
  const date = new Date(Date.now() - days * 86400_000 - hoursOffset * 3600_000);
  return date.toISOString();
}

function monthsAgoDate(monthsAgo: number, day = 12): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  d.setDate(day);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

export function seedDatabaseIfEmpty(db: DatabaseSync): void {
  const existingUsers = db.prepare('SELECT COUNT(*) as total FROM users').get() as {
    total: number;
  };
  if (existingUsers.total > 0) {
    return;
  }
  seedFreshDemoData(db);
}

export function resetDemoData(db: DatabaseSync): void {
  withTransaction(db, () => {
    db.exec(`
      DELETE FROM chat_messages;
      DELETE FROM chat_sessions;
      DELETE FROM audit_events;
      DELETE FROM referral_records;
      DELETE FROM supervision_requests;
      DELETE FROM follow_up_records;
      DELETE FROM support_requests;
      DELETE FROM screening_sessions;
      DELETE FROM consent_records;
      DELETE FROM education_articles;
      DELETE FROM knowledge_documents;
      DELETE FROM sessions;
      DELETE FROM users;
    `);
    seedFreshDemoData(db);
  });
}

function seedFreshDemoData(db: DatabaseSync): void {
  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password_hash, name, role, title, location_post, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    'usr-kader-01',
    'kader.aceh',
    hashPassword('kader123'),
    'Rizky Pratama',
    'kader',
    'Kader Pendamping Komunitas',
    'Posko Banda Aceh (Masjid Raya / Baiturrahman)',
    daysAgo(90),
  );
  insertUser.run(
    'usr-kader-02',
    'kader.meulaboh',
    hashPassword('kader123'),
    'Cut Nyak Nadia',
    'kader',
    'Kader Pendamping Lapangan',
    'Posko Meulaboh (Aceh Barat)',
    daysAgo(85),
  );
  insertUser.run(
    'usr-konselor-01',
    'konselor.ratna',
    hashPassword('konselor123'),
    'Dr. Ratna Dewi, M.Psi.',
    'konselor',
    'Konselor Profesional',
    'Koordinator Klinis & Supervisi — Banda Aceh',
    daysAgo(120),
  );

  // Consent & screening records for seeded requests
  const insertConsent = db.prepare(`
    INSERT INTO consent_records (id, session_id, understood_confidentiality, agreed_to_proceed, agreed_follow_up_contact, consent_timestamp)
    VALUES (?, ?, 1, 1, ?, ?)
  `);
  const insertScreening = db.prepare(`
    INSERT INTO screening_sessions (
      id, consent_id, anonymous_code, age_range, location_post, primary_need,
      activity_difficulty, has_trusted_support, social_support_needed_json,
      service_choice, recommended_track, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertRequest = db.prepare(`
    INSERT INTO support_requests (
      id, screening_session_id, anonymous_code, display_name, age_range, location_post,
      contact_allowed, contact_info, primary_need, need_summary, activity_difficulty,
      social_support_info, service_track, status, source_type,
      assigned_kader_id, assigned_kader_name, assigned_counselor_id, assigned_counselor_name,
      counselor_follow_up_summary, supervision_guidance, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // 1. Pengguna #1042 - Baru (kader) - matches Mockup Panel 5
  insertConsent.run('cns-1042', 'scr-1042', 1, daysAgo(0, 2));
  insertScreening.run(
    'scr-1042',
    'cns-1042',
    'Pengguna #1042',
    '26-40 tahun',
    'Posko Banda Aceh (Masjid Raya / Baiturrahman)',
    'Dukungan emosional',
    'cukup_terganggu',
    'terbatas',
    JSON.stringify(['Teman bicara yang menenangkan', 'Informasi pemulihan pascabencana']),
    'kader',
    'kader',
    daysAgo(0, 2),
  );
  insertRequest.run(
    'req-1042',
    'scr-1042',
    'Pengguna #1042',
    'Anonim (#1042)',
    '26-40 tahun',
    'Posko Banda Aceh (Masjid Raya / Baiturrahman)',
    1,
    'Meja Posko Tenda B / WA Simulasi *042',
    'Dukungan emosional',
    'Merasa mudah terkejut dan cemas setelah gempa susulan; ingin berbicara dengan pendamping.',
    'Cukup terganggu saat istirahat malam',
    'Dukungan keluarga terbatas karena keluarga tinggal di desa lain',
    'kader',
    'baru',
    'skrining',
    null,
    null,
    null,
    null,
    null,
    null,
    daysAgo(0, 2),
    daysAgo(0, 2),
  );

  // 2. Pengguna #1039 - Dalam Proses (kader) - matches Mockup Panel 5
  insertConsent.run('cns-1039', 'scr-1039', 1, daysAgo(0, 5));
  insertScreening.run(
    'scr-1039',
    'cns-1039',
    'Pengguna #1039',
    '18-25 tahun',
    'Posko Banda Aceh (Masjid Raya / Baiturrahman)',
    'Informasi & edukasi',
    'sedikit',
    'ya',
    JSON.stringify(['Panduan teknik relaksasi', 'Kegiatan kelompok warga']),
    'kader',
    'kader',
    daysAgo(0, 5),
  );
  insertRequest.run(
    'req-1039',
    'scr-1039',
    'Pengguna #1039',
    'Siti A. (Simulasi)',
    '18-25 tahun',
    'Posko Banda Aceh (Masjid Raya / Baiturrahman)',
    1,
    'Posko Pelajar — Blok C',
    'Informasi & edukasi',
    'Membutuhkan panduan mengelola rasa tegang dan cara membantu adik yang sering takut hujan deras.',
    'Sedikit terganggu',
    'Ada orang tua di posko',
    'kader',
    'dalam_proses',
    'skrining',
    'usr-kader-01',
    'Rizky Pratama',
    null,
    null,
    null,
    null,
    daysAgo(0, 5),
    daysAgo(0, 3),
  );

  // 3. Pengguna #1035 - Perlu Supervisi (kader -> supervisi konselor) - matches Mockup Panel 5
  insertConsent.run('cns-1035', 'scr-1035', 1, daysAgo(1, 2));
  insertScreening.run(
    'scr-1035',
    'cns-1035',
    'Pengguna #1035',
    '41-60 tahun',
    'Posko Sigli (Pidie)',
    'Pendampingan lanjutan',
    'sangat_terganggu',
    'tidak_ada',
    JSON.stringify(['Pendampingan rutin', 'Konsultasi profesional']),
    'kader',
    'kader',
    daysAgo(1, 2),
  );
  insertRequest.run(
    'req-1035',
    'scr-1035',
    'Pengguna #1035',
    'Anonim (#1035)',
    '41-60 tahun',
    'Posko Sigli (Pidie)',
    1,
    'Posko Kesehatan Sigli',
    'Pendampingan lanjutan',
    'Mengalami sulit tidur berkepanjangan dan kesulitan menjalani rutinitas harian pascabanjir bandang.',
    'Sangat terganggu dalam beraktivitas',
    'Tinggal sendiri setelah terpisah sementara dari kerabat',
    'kader',
    'perlu_supervisi',
    'skrining',
    'usr-kader-01',
    'Rizky Pratama',
    'usr-konselor-01',
    'Dr. Ratna Dewi, M.Psi.',
    null,
    null,
    daysAgo(1, 2),
    daysAgo(0, 6),
  );

  // 4. Pengguna #1044 - Baru (permintaan cepat tanpa skrining)
  insertRequest.run(
    'req-1044',
    null,
    'Pengguna #1044',
    'Anonim (#1044)',
    'Tidak disebutkan',
    'Posko Meulaboh (Aceh Barat)',
    1,
    'Tenda Pengungsian Sektor 2',
    'Butuh teman bicara segera',
    'Mengajukan permintaan pendampingan langsung tanpa skrining karena merasa kewalahan mengurus keluarga.',
    'Belum diisi (permintaan cepat)',
    'Menunggu asesmen awal oleh kader',
    'kader',
    'baru',
    'permintaan_cepat',
    null,
    null,
    null,
    null,
    null,
    null,
    daysAgo(0, 1),
    daysAgo(0, 1),
  );

  // 5. Pengguna #1041 - Konseling Profesional Baru (konselor track)
  insertConsent.run('cns-1041', 'scr-1041', 1, daysAgo(0, 2));
  insertScreening.run(
    'scr-1041',
    'cns-1041',
    'Pengguna #1041',
    '26-40 tahun',
    'Posko Lhokseumawe',
    'Konseling profesional',
    'sangat_terganggu',
    'terbatas',
    JSON.stringify(['Sesi dengan konselor profesional']),
    'konselor',
    'konselor',
    daysAgo(0, 2),
  );
  insertRequest.run(
    'req-1041',
    'scr-1041',
    'Pengguna #1041',
    'Anonim (#1041)',
    '26-40 tahun',
    'Posko Lhokseumawe',
    1,
    'Kontak Simulasi Posko Lhokseumawe',
    'Konseling profesional',
    'Meminta konsultasi langsung dengan konselor terkait kesedihan mendalam pascakehilangan tempat tinggal.',
    'Sangat terganggu',
    'Memiliki rekan di posko namun ingin berbicara dengan profesional',
    'konselor',
    'baru',
    'skrining',
    null,
    null,
    'usr-konselor-01',
    'Dr. Ratna Dewi, M.Psi.',
    'Perlu penjadwalan sesi konseling tatap muka awal pada jadwal sore di Posko Lhokseumawe.',
    null,
    daysAgo(0, 2),
    daysAgo(0, 2),
  );

  // 6. Pengguna #1032 - Menunggu Rujukan ke RSUD Aceh (konselor)
  insertConsent.run('cns-1032', 'scr-1032', 1, daysAgo(2, 4));
  insertScreening.run(
    'scr-1032',
    'cns-1032',
    'Pengguna #1032',
    '41-60 tahun',
    'Posko Banda Aceh (Masjid Raya / Baiturrahman)',
    'Pendampingan & rujukan fasilitas',
    'sangat_terganggu',
    'terbatas',
    JSON.stringify(['Konselor profesional', 'Rujukan layanan kesehatan']),
    'konselor',
    'konselor',
    daysAgo(2, 4),
  );
  insertRequest.run(
    'req-1032',
    'scr-1032',
    'Pengguna #1032',
    'Anonim (#1032)',
    '41-60 tahun',
    'Posko Banda Aceh (Masjid Raya / Baiturrahman)',
    1,
    'Unit Koordinasi Kesehatan Posko Utama',
    'Pendampingan & rujukan fasilitas',
    'Membutuhkan layanan lanjutan terintegrasi di fasilitas kesehatan tingkat lanjut.',
    'Sangat terganggu',
    'Didampingi keponakan saat melapor',
    'konselor',
    'menunggu_rujukan',
    'skrining',
    'usr-kader-01',
    'Rizky Pratama',
    'usr-konselor-01',
    'Dr. Ratna Dewi, M.Psi.',
    'Sudah dilakukan asesmen konselor awal; disiapkan rujukan terkoordinasi ke Poli Psikologi RSUDZA.',
    'Kader mendampingi administrasi rujukan dan memantau kenyamanan penyintas hingga serah terima.',
    daysAgo(2, 4),
    daysAgo(0, 5),
  );

  // 7-10. Completed cases across recent months so Recharts statistics & Riwayat match real DB data!
  const completedSeeds = [
    {
      id: 'req-1028',
      code: 'Pengguna #1028',
      name: 'Anonim (#1028)',
      age: '26-40 tahun',
      loc: 'Posko Bireuen',
      need: 'Dukungan emosional',
      summary: 'Kecemasan ringan pascagempa yang membaik setelah dua sesi pendampingan.',
      track: 'kader',
      date: monthsAgoDate(0, 6),
    },
    {
      id: 'req-1021',
      code: 'Pengguna #1021',
      name: 'Hendra M. (Simulasi)',
      age: '18-25 tahun',
      loc: 'Posko Banda Aceh (Masjid Raya / Baiturrahman)',
      need: 'Dukungan sosial komunitas',
      summary: 'Berhasil terhubung dengan kelompok relawan pemuda desa.',
      track: 'kader',
      date: monthsAgoDate(1, 14),
    },
    {
      id: 'req-1018',
      code: 'Pengguna #1018',
      name: 'Anonim (#1018)',
      age: '26-40 tahun',
      loc: 'Posko Takengon (Aceh Tengah)',
      need: 'Konseling profesional',
      summary: 'Sesi konseling selesai dengan rencana perawatan diri berkelanjutan.',
      track: 'konselor',
      date: monthsAgoDate(2, 18),
    },
    {
      id: 'req-1012',
      code: 'Pengguna #1012',
      name: 'Anonim (#1012)',
      age: '41-60 tahun',
      loc: 'Posko Aceh Tamiang',
      need: 'Dukungan keluarga',
      summary: 'Pendampingan keluarga selesai setelah relokasi sementara stabil.',
      track: 'kader',
      date: monthsAgoDate(3, 10),
    },
    {
      id: 'req-1007',
      code: 'Pengguna #1007',
      name: 'Anonim (#1007)',
      age: '18-25 tahun',
      loc: 'Posko Sigli (Pidie)',
      need: 'Informasi & edukasi',
      summary: 'Sesi psikoedukasi dan grounding selesai.',
      track: 'kader',
      date: monthsAgoDate(4, 20),
    },
    {
      id: 'req-1003',
      code: 'Pengguna #1003',
      name: 'Anonim (#1003)',
      age: '26-40 tahun',
      loc: 'Posko Banda Aceh (Masjid Raya / Baiturrahman)',
      need: 'Pendampingan lanjutan',
      summary: 'Kasus awal prototipe selesai dengan dukungan komunitas.',
      track: 'konselor',
      date: monthsAgoDate(5, 8),
    },
  ];

  for (const item of completedSeeds) {
    insertRequest.run(
      item.id,
      null,
      item.code,
      item.name,
      item.age,
      item.loc,
      0,
      null,
      item.need,
      item.summary,
      'Sedikit terganggu',
      'Memiliki dukungan keluarga/tetangga di posko',
      item.track,
      'selesai',
      'skrining',
      'usr-kader-01',
      'Rizky Pratama',
      item.track === 'konselor' ? 'usr-konselor-01' : null,
      item.track === 'konselor' ? 'Dr. Ratna Dewi, M.Psi.' : null,
      item.track === 'konselor' ? 'Tindak lanjut konseling selesai dengan stabil.' : null,
      'Tetap jaga rutinitas istirahat dan koneksi dengan kelompok warga.',
      item.date,
      item.date,
    );
  }

  // Additional active dalam_proses case for counselor follow-up module
  insertRequest.run(
    'req-1037',
    null,
    'Pengguna #1037',
    'Anonim (#1037)',
    '26-40 tahun',
    'Posko Meulaboh (Aceh Barat)',
    1,
    'Posko Utama Meulaboh',
    'Konseling profesional',
    'Membutuhkan lanjutan konseling karena kelelahan emosional merawat lansia di pengungsian.',
    'Cukup terganggu',
    'Memiliki anggota keluarga namun ikut terdampak',
    'konselor',
    'dalam_proses',
    'skrining',
    'usr-kader-02',
    'Cut Nyak Nadia',
    'usr-konselor-01',
    'Dr. Ratna Dewi, M.Psi.',
    'Sesi awal telah berjalan; dijadwalkan evaluasi dukungan pengasuh keluarga 3 hari lagi.',
    null,
    daysAgo(1, 5),
    daysAgo(0, 7),
  );

  // Follow-up records
  const insertFollowUp = db.prepare(`
    INSERT INTO follow_up_records (id, request_id, author_id, author_name, author_role, note, action_type, is_counselor_only, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertFollowUp.run(
    'fu-01',
    'req-1039',
    'usr-kader-01',
    'Rizky Pratama',
    'kader',
    'Permintaan diterima. Telah menyapa penyintas di Posko Blok C dan membagikan panduan teknik pernapasan 4-4-6.',
    'penerimaan',
    0,
    daysAgo(0, 4),
  );
  insertFollowUp.run(
    'fu-02',
    'req-1035',
    'usr-kader-01',
    'Rizky Pratama',
    'kader',
    'Penyintas tampak sangat kelelahan dan sulit tidur 5 hari berturut-turut. Meminta supervisi konselor untuk arahan pendampingan lanjutan.',
    'pengajuan_supervisi',
    0,
    daysAgo(0, 6),
  );
  insertFollowUp.run(
    'fu-03',
    'req-1032',
    'usr-konselor-01',
    'Dr. Ratna Dewi, M.Psi.',
    'konselor',
    'Catatan profesional: Dilakukan stabilisasi awal non-farmakologis dan disiapkan koordinasi rujukan ke RSUD dr. Zainoel Abidin.',
    'tindak_lanjut_konselor',
    1,
    daysAgo(0, 5),
  );

  // Supervision requests
  const insertSupervision = db.prepare(`
    INSERT INTO supervision_requests (
      id, request_id, anonymous_code, kader_id, kader_name, supervision_type, reason, kader_summary,
      status, counselor_id, counselor_name, counselor_guidance, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertSupervision.run(
    'sup-01',
    'req-1035',
    'Pengguna #1035',
    'usr-kader-01',
    'Rizky Pratama',
    'konsultasi_segera',
    'Kesulitan tidur berat dan belum memiliki pendamping keluarga di posko.',
    'Sudah dilakukan pendampingan awal dan grounding ringan, namun penyintas masih sering terjaga malam dan terpisah dari kerabat.',
    'menunggu',
    null,
    null,
    null,
    daysAgo(0, 6),
    daysAgo(0, 6),
  );

  insertSupervision.run(
    'sup-02',
    'req-1039',
    'Pengguna #1039',
    'usr-kader-01',
    'Rizky Pratama',
    'terjadwal',
    'Meminta arahan materi ramah anak untuk membantu adiknya.',
    'Penyintas menanyakan cara menjelaskan situasi hujan deras pada adik usia 8 tahun tanpa memicu panik.',
    'arahan_dikirim',
    'usr-konselor-01',
    'Dr. Ratna Dewi, M.Psi.',
    'Gunakan aktivitas menggambar atau bercerita yang menenangkan, jaga rutinitas waktu tidur, dan hindari paparan berita bencana berulang di depan anak.',
    daysAgo(0, 8),
    daysAgo(0, 3),
  );

  // Referral records
  const insertReferral = db.prepare(`
    INSERT INTO referral_records (
      id, request_id, anonymous_code, counselor_id, counselor_name,
      destination_facility, referral_type, summary_note, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertReferral.run(
    'ref-01',
    'req-1032',
    'Pengguna #1032',
    'usr-konselor-01',
    'Dr. Ratna Dewi, M.Psi.',
    'RSUD dr. Zainoel Abidin (RSUDZA) Banda Aceh',
    'Layanan Psikologi Klinis & Kesehatan Terpadu',
    'Rujukan terkoordinasi untuk evaluasi psikologis lanjutan dan pemeriksaan keluhan tidur.',
    'dikonfirmasi',
    daysAgo(0, 5),
    daysAgo(0, 4),
  );

  insertReferral.run(
    'ref-02',
    'req-1018',
    'Pengguna #1018',
    'usr-konselor-01',
    'Dr. Ratna Dewi, M.Psi.',
    'Puskesmas Kebayakan — Aceh Tengah',
    'Konseling Komunitas & Kesehatan Dasar',
    'Tindak lanjut di puskesmas terdekat setelah relokasi posko selesai.',
    'selesai',
    monthsAgoDate(2, 16),
    monthsAgoDate(2, 18),
  );

  // Education Articles covering ALL 7 required categories!
  const insertArticle = db.prepare(`
    INSERT INTO education_articles (
      id, slug, title, summary, content, category, reference_source,
      status, author_name, read_time_minutes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const articles = [
    {
      id: 'art-01',
      slug: 'mengenali-respons-stres-setelah-bencana',
      title: 'Mengenali Respons Stres yang Wajar Setelah Bencana',
      summary:
        'Reaksi emosional dan fisik seperti sulit tidur, mudah terkejut, atau sedih adalah respons alami tubuh menghadapi peristiwa berat.',
      content: `Setelah mengalami bencana seperti banjir, gempa bumi, atau kehilangan tempat tinggal, banyak penyintas merasakan perubahan pada perasaan, pikiran, dan tubuh. Penting untuk memahami bahwa respons ini adalah reaksi wajar manusia terhadap situasi yang tidak biasa, bukan tanda kelemahan pribadi.

Beberapa respons yang sering muncul meliputi:
1. Respons emosional: mudah cemas, sedih mendalam, merasa hampa, atau mudah tersinggung.
2. Respons fisik: sulit tidur, jantung berdebar saat mendengar suara keras, otot tegang, atau nafsu makan menurun.
3. Respons pikiran: sulit berkonsentrasi atau terus teringat momen kejadian.

Pada sebagian besar orang, reaksi ini perlahan mereda seiring rasa aman kembali terbangun dan adanya dukungan orang sekitar. Yang terpenting adalah tidak menghakimi diri sendiri dan memberi waktu bagi tubuh untuk beristirahat.

Catatan penting: Informasi ini bersifat edukasi umum dan tidak menggantikan konsultasi tenaga kesehatan jiwa profesional apabila keluhan terus memberat atau mengganggu aktivitas sehari-hari.`,
      category: 'Mengenali respons stres setelah bencana',
      referenceSource:
        'WHO (Psychological First Aid: Guide for Field Workers) & Kemenkes RI (Pedoman Dukungan Kesehatan Jiwa dan Psikososial)',
      status: 'published',
      readTime: 4,
      days: 15,
    },
    {
      id: 'art-02',
      slug: 'teknik-sederhana-menenangkan-diri-grounding',
      title: 'Teknik Pernapasan dan Grounding 5-4-3-2-1 untuk Menenangkan Diri',
      summary:
        'Langkah praktis 3 menit yang dapat dilakukan kapan saja di posko maupun rumah saat rasa cemas tiba-tiba muncul.',
      content: `Saat rasa takut atau panik muncul secara tiba-tiba, pikiran kita sering terasa melompat ke kejadian masa lalu atau kekhawatiran masa depan. Teknik grounding membantu membawa kesadaran kita kembali ke saat ini dengan aman.

Langkah Pernapasan Tenang (4-4-6):
1. Duduk atau berdiri dengan posisi nyaman, letakkan satu tangan di dada atau perut.
2. Tarik napas perlahan melalui hidung selama 4 hitungan.
3. Tahan napas dengan lembut selama 4 hitungan.
4. Hembuskan napas perlahan melalui mulut selama 6 hitungan. Ulangi 4 hingga 6 kali.

Langkah Grounding 5-4-3-2-1:
- Sebutkan dalam hati 5 benda yang dapat Anda lihat di sekitar Anda.
- Sentuh 4 tekstur benda yang berbeda (misalnya baju, kursi, alas duduk).
- Dengarkan 3 suara lembut di sekitar Anda.
- Rasakan 2 aroma yang ada di dekat Anda (atau tarik napas udara segar).
- Ucapkan 1 kalimat penguat untuk diri sendiri, misalnya: "Saat ini saya berada di tempat yang aman."

Lakukan perlahan tanpa memaksa diri. Jika merasa pusing, hentikan sejenak dan bernapaslah secara normal.`,
      category: 'Teknik sederhana untuk menenangkan diri',
      referenceSource:
        'WHO — Doing What Matters in Times of Stress: An Illustrated Guide (Panduan Manajemen Stres Berbasis Komunitas)',
      status: 'published',
      readTime: 3,
      days: 14,
    },
    {
      id: 'art-03',
      slug: 'mendukung-keluarga-dan-anak-di-masa-pemulihan',
      title: 'Mendukung Keluarga, Anak, dan Lansia Pascabencana dengan Penuh Kehangatan',
      summary:
        'Cara mendengarkan anggota keluarga tanpa memaksa mereka bercerita serta menjaga rasa aman bagi anak-anak di pengungsian.',
      content: `Dalam situasi pascabencana di Aceh, ikatan keluarga adalah salah satu sumber kekuatan terbesar. Namun setiap anggota keluarga—termasuk anak-anak dan lansia—memiliki cara berbeda dalam mengekspresikan ketakutan atau kesedihannya.

Cara mendampingi orang terdekat dengan empatik:
1. Hadir dan dengarkan tanpa menghakimi: Terkadang menemani dalam diam jauh lebih menenangkan daripada memberi banyak nasihat.
2. Jangan memaksa bercerita: Biarkan anggota keluarga berbagi cerita sesuai kesiapan mereka.
3. Ciptakan rutinitas sederhana untuk anak: Waktu makan, bermain ringan, atau mendongeng sebelum tidur membantu anak kembali merasa aman.
4. Batasi paparan berita atau video bencana yang berulang di depan anak maupun lansia yang mudah cemas.

Jika Anda sendiri merasa sangat lelah karena merawat keluarga, ingatlah bahwa Anda juga berhak mendapatkan dukungan dari kader maupun relawan posko.`,
      category: 'Mendukung keluarga dan orang terdekat',
      referenceSource:
        'Kementerian Sosial RI & UNICEF Indonesia — Pedoman Dukungan Psikososial Keluarga dan Anak pada Masa Tanggap Darurat',
      status: 'published',
      readTime: 5,
      days: 12,
    },
    {
      id: 'art-04',
      slug: 'kekuatan-dukungan-sosial-berbasis-komunitas-aceh',
      title: 'Membangun Dukungan Sosial Berbasis Komunitas dan Gotong Royong',
      summary:
        'Kebersamaan gampong, meunasah, dan kelompok warga berperan penting mencegah rasa terisolasi dalam masa pemulihan.',
      content: `Masyarakat Aceh memiliki tradisi kuat dalam kebersamaan, peusijuek, dan gotong royong di tingkat gampong maupun meunasah. Riset kebencanaan menunjukkan bahwa keterhubungan sosial yang sehat membantu mempercepat pemulihan psikososial warga.

Bentuk dukungan komunitas yang dapat dimulai secara sederhana:
- Saling menyapa dan menanyakan kabar tetangga di tenda atau hunian sementara, terutama lansia dan ibu hamil.
- Mengadakan kegiatan positif bersama seperti dapur umum gotong royong, ruang bermain anak, atau sesi berbagi cerita yang aman.
- Menghindari penyebaran kabar simpang siur (hoaks) yang memicu kepanikan bersama.

CARE BRIDGE hadir sebagai jembatan antara semangat kepedulian warga di tingkat komunitas dengan pendampingan terstruktur bersama kader dan konselor.`,
      category: 'Dukungan sosial berbasis komunitas',
      referenceSource:
        'IASC Guidelines on Mental Health and Psychosocial Support in Emergency Settings (Adaptasi Konteks Komunitas)',
      status: 'published',
      readTime: 4,
      days: 10,
    },
    {
      id: 'art-05',
      slug: 'mengenal-peran-kader-pendamping-care-bridge',
      title: 'Mengenal Peran Kader Pendamping Komunitas di CARE BRIDGE',
      summary:
        'Apa yang dilakukan kader pendamping, batas kewenangannya, dan bagaimana kader bekerja sama dengan konselor profesional.',
      content: `Kader pendamping CARE BRIDGE adalah relawan komunitas terlatih yang menjadi penghubung pertama bagi penyintas yang membutuhkan teman bicara, dukungan emosional awal (Psychological First Aid), atau informasi layanan.

Apa yang dilakukan kader pendamping:
1. Mendengarkan keluhan dan kebutuhan penyintas dengan penuh hormat serta menjaga kerahasiaan.
2. Memberikan informasi edukasi dasar mengenai respons stres dan perawatan diri.
3. Membantu penyintas terhubung dengan aktivitas dukungan sosial atau bantuan posko.
4. Mengajukan supervisi kepada konselor profesional apabila menemui kasus yang membutuhkan arahan ahli.

Batas kewenangan kader:
Kader bukan dokter atau psikolog klinis. Kader tidak membuat diagnosis gangguan jiwa maupun meresepkan pengobatan, dan selalu berkoordinasi dengan konselor untuk layanan lanjutan.`,
      category: 'Peran kader pendamping',
      referenceSource:
        'Panduan Operasional Layanan Dukungan Psikososial Berbasis Komunitas — Prototipe CARE BRIDGE',
      status: 'published',
      readTime: 4,
      days: 8,
    },
    {
      id: 'art-06',
      slug: 'kapan-perlu-meminta-bantuan-profesional',
      title: 'Kapan Perlu Meminta Bantuan Konselor atau Tenaga Profesional?',
      summary:
        'Kenali tanda-tanda kapan dukungan mandiri perlu ditingkatkan menjadi pendampingan konselor profesional atau bantuan segera.',
      content: `Meminta bantuan profesional adalah langkah bijak untuk menjaga kesehatan diri, sama halnya seperti berobat ketika mengalami luka fisik.

Pertimbangkan untuk terhubung dengan konselor atau tenaga kesehatan profesional apabila:
- Rasa cemas, sedih, atau takut tidak kunjung mereda setelah beberapa minggu atau justru semakin berat.
- Kesulitan tidur, makan, atau merawat diri berlangsung terus-menerus hingga menghambat aktivitas harian.
- Muncul perasaan putus asa mendalam atau pikiran untuk menyakiti diri sendiri.

Apabila Anda atau orang di sekitar Anda berada dalam bahaya langsung atau krisis akut, jangan menunda: segera hubungi petugas posko terdekat, layanan darurat 119, atau kunjungi unit gawat darurat rumah sakit terdekat.`,
      category: 'Kapan perlu meminta bantuan profesional',
      referenceSource:
        'Kementerian Kesehatan RI — Layanan Kesehatan Jiwa dan Pedoman Rujukan Psikososial',
      status: 'published',
      readTime: 4,
      days: 6,
    },
    {
      id: 'art-07',
      slug: 'cara-mengakses-layanan-care-bridge',
      title: 'Cara Mengakses Layanan CARE BRIDGE dengan Aman dan Tanpa Rasa Takut',
      summary:
        'Panduan singkat menggunakan skrining mandiri, permintaan pendamping tanpa skrining, mode kiosk, dan privasi data.',
      content: `CARE BRIDGE dirancang agar mudah diakses baik melalui ponsel pribadi maupun perangkat kiosk di posko bencana Aceh.

Pilihan jalur yang tersedia:
1. Mulai Skrining Mandiri: Mengisi 6 langkah singkat untuk membantu mengarahkan kebutuhan Anda—Anda boleh tetap anonim tanpa mencantumkan nama lengkap atau NIK.
2. Saya Membutuhkan Pendamping: Jika sedang lelah atau terburu-buru, Anda dapat langsung meminta pendamping tanpa mengisi skrining panjang.
3. Informasi & CARE Assistant: Membaca materi pemulihan mandiri atau bertanya kepada asisten lokal untuk menemukan panduan yang relevan.
4. Bantuan Segera: Jalur cepat untuk melihat kontak darurat dan instruksi eskalasi langsung kepada petugas.

Jika Anda menggunakan komputer atau tablet bersama di posko, tekan tombol "Selesai dan Hapus Sesi" setelah selesai agar jawaban sementara Anda terhapus dari layar.`,
      category: 'Cara mengakses CARE BRIDGE',
      referenceSource: 'Dokumentasi Prototipe CARE BRIDGE — Privasi & Aksesibilitas Penyintas',
      status: 'published',
      readTime: 3,
      days: 4,
    },
  ];

  for (const a of articles) {
    insertArticle.run(
      a.id,
      a.slug,
      a.title,
      a.summary,
      a.content,
      a.category,
      a.referenceSource,
      a.status,
      'Dr. Ratna Dewi, M.Psi.',
      a.readTime,
      daysAgo(a.days),
      daysAgo(a.days),
    );
  }

  // Knowledge documents for CARE Assistant local retrieval
  const insertKnowledge = db.prepare(`
    INSERT INTO knowledge_documents (id, title, content, category, reference_source, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const knowledgeDocs = [
    {
      id: 'DOC-01',
      title: 'Mengatasi Rasa Cemas dan Napas Tenang Pascabencana',
      content:
        'Setelah bencana, merasa cemas atau mudah terkejut adalah hal yang wajar. Hal sederhana yang dapat dilakukan: tarik napas perlahan selama 4 hitungan, tahan 4 hitungan, dan hembuskan 6 hitungan; fokus pada 5 benda yang dapat dilihat di sekitar (grounding); serta bercerita kepada orang terdekat atau kader pendamping.',
      category: 'Cara sederhana merawat diri',
      ref: 'WHO — Doing What Matters in Times of Stress',
    },
    {
      id: 'DOC-02',
      title: 'Respons Stres Umum Setelah Bencana',
      content:
        'Respons stres pascabencana dapat berupa sulit tidur, jantung berdebar, sedih berulang, mudah lelah, atau sulit fokus. Ini adalah reaksi normal tubuh setelah peristiwa krisis. Beristirahatlah cukup, batasi paparan berita yang membuat tegang, dan hubungi pendamping jika berlangsung lama.',
      category: 'Respons stres pascabencana',
      ref: 'WHO Psychological First Aid & Kemenkes RI',
    },
    {
      id: 'DOC-03',
      title: 'Mendukung Keluarga dan Anak di Posko',
      content:
        'Untuk membantu keluarga dan anak: dengarkan tanpa menghakimi, jangan memaksa mereka bercerita sebelum siap, pertahankan rutinitas harian sederhana seperti jam makan dan tidur, serta jauhkan anak dari gambar atau video bencana yang berulang.',
      category: 'Dukungan kepada keluarga',
      ref: 'Kemensos RI & UNICEF Panduan Dukungan Psikososial',
    },
    {
      id: 'DOC-04',
      title: 'Cara Mengakses Layanan dan Meminta Pendamping CARE BRIDGE',
      content:
        'Anda dapat mengakses layanan CARE BRIDGE melalui: (1) tombol Mulai Skrining di beranda untuk diarahkan sesuai kebutuhan, (2) tombol Saya Membutuhkan Pendamping jika ingin meminta bantuan tanpa mengisi skrining, atau (3) menu Bantuan untuk jalur darurat. Identitas Anda dapat tetap anonim tanpa NIK.',
      category: 'Cara mengakses layanan',
      ref: 'Panduan Pengguna Prototipe CARE BRIDGE',
    },
    {
      id: 'DOC-05',
      title: 'Peran Kader Pendamping dan Konselor Profesional',
      content:
        'Kader pendamping adalah relawan komunitas terlatih yang memberikan dukungan emosional awal, menemani penyintas, dan menghubungkan kebutuhan ke posko. Konselor profesional menangani konsultasi lanjutan, memberikan supervisi kepada kader, serta merencanakan rujukan medis/psikologis ke fasilitas seperti RSUD atau Puskesmas.',
      category: 'Peran kader dan konselor',
      ref: 'Pedoman Alur Layanan CARE BRIDGE',
    },
  ];

  for (const doc of knowledgeDocs) {
    insertKnowledge.run(doc.id, doc.title, doc.content, doc.category, doc.ref, daysAgo(5));
  }

  // Initial Audit events for Panel 6 ("Aktivitas Terbaru")
  const insertAudit = db.prepare(`
    INSERT INTO audit_events (id, actor_id, actor_name, actor_role, action, entity_type, entity_id, detail, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAudit.run(
    'aud-01',
    null,
    'Penyintas (#1041)',
    'publik',
    'permintaan_konseling_baru',
    'support_request',
    'req-1041',
    'Permintaan konseling baru dari Posko Lhokseumawe (Pengguna #1041)',
    daysAgo(0, 2),
  );
  insertAudit.run(
    'aud-02',
    'usr-konselor-01',
    'Dr. Ratna Dewi, M.Psi.',
    'konselor',
    'supervisi_selesai',
    'supervision_request',
    'sup-02',
    'Supervisi kader selesai untuk Pengguna #1039 (arahan pendampingan anak dikirim)',
    daysAgo(0, 3),
  );
  insertAudit.run(
    'aud-03',
    'usr-konselor-01',
    'Dr. Ratna Dewi, M.Psi.',
    'konselor',
    'rujukan_dibuat',
    'referral_record',
    'ref-01',
    'Rujukan ke RSUD Aceh (RSUDZA) dikonfirmasi untuk Pengguna #1032',
    daysAgo(0, 5),
  );
}
