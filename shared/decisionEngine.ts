import type {
  DecisionResult,
  MatchedRuleTrace,
  ScreeningInput,
  ServiceTrack,
} from './types.js';

const NON_CLINICAL_DISCLAIMER =
  'Hasil ini merupakan rekomendasi jalur layanan konseptual berbasis aturan (rule-based) dari jawaban Anda, BUKAN diagnosis psikologis, bukan skor klinis, dan bukan pengganti pemeriksaan tenaga profesional.';

const PROTOTYPE_VALIDATION_NOTE =
  'Catatan layanan: Pertanyaan skrining dan aturan rekomendasi ini merupakan rancangan prototipe konseptual yang tetap memerlukan validasi instrumen dan peninjauan protokol bersama konselor serta mitra layanan kesehatan jiwa setempat.';

function deriveRecommendedCategories(
  input: ScreeningInput,
  recommendedTrack: ServiceTrack,
): string[] {
  const categories = new Set<string>();

  if (
    input.emotionalState !== 'tenang_terkendali' ||
    input.sleepDifficulty !== 'tidak_ada' ||
    input.activityDifficulty === 'cukup_terganggu' ||
    input.activityDifficulty === 'sangat_terganggu' ||
    input.primaryNeed.toLowerCase().includes('tenang') ||
    input.primaryNeed.toLowerCase().includes('cemas') ||
    input.primaryNeed.toLowerCase().includes('tidur')
  ) {
    categories.add('Teknik sederhana untuk menenangkan diri');
    categories.add('Mengenali respons stres setelah bencana');
  }

  if (
    input.hasTrustedSupport !== 'ya' ||
    input.socialSupportNeeded.some((s) => s.toLowerCase().includes('komunitas'))
  ) {
    categories.add('Dukungan sosial berbasis komunitas');
  }

  if (
    input.practicalNeeds.some((p) => p.toLowerCase().includes('anak') || p.toLowerCase().includes('keluarga')) ||
    input.socialSupportNeeded.some(
      (s) => s.toLowerCase().includes('keluarga') || s.toLowerCase().includes('anak'),
    )
  ) {
    categories.add('Mendukung keluarga dan orang terdekat');
  }

  if (recommendedTrack === 'kader') {
    categories.add('Peran kader pendamping');
  }

  if (recommendedTrack === 'konselor' || recommendedTrack === 'bantuan_segera') {
    categories.add('Kapan perlu meminta bantuan profesional');
  }

  if (categories.size === 0) {
    categories.add('Mengenali respons stres setelah bencana');
    categories.add('Teknik sederhana untuk menenangkan diri');
    categories.add('Cara mengakses CARE BRIDGE');
  }

  return Array.from(categories);
}

function collectHumanFactors(input: ScreeningInput): string[] {
  const factors: string[] = [];

  if (input.safetyStatus === 'bahaya_langsung') {
    factors.push('Melaporkan kondisi rasa aman: sedang menghadapi bahaya langsung / keadaan tidak aman');
  } else if (input.safetyStatus === 'kurang_aman') {
    factors.push('Melaporkan rasa aman masih kurang stabil');
  }

  if (input.emotionalState === 'tertekan_berat') {
    factors.push('Perasaan setelah bencana terasa sangat berat / kewalahan');
  } else if (input.emotionalState === 'cemas_sedih_ringan') {
    factors.push('Merasakan cemas atau sedih ringan setelah bencana');
  }

  if (input.sleepDifficulty === 'sering_sulit_tidur') {
    factors.push('Sering mengalami kesulitan tidur setelah kejadian');
  } else if (input.sleepDifficulty === 'kadang') {
    factors.push('Kadang mengalami gangguan tidur');
  }

  if (input.activityDifficulty === 'sangat_terganggu') {
    factors.push('Aktivitas sehari-hari terasa sangat terganggu');
  } else if (input.activityDifficulty === 'cukup_terganggu') {
    factors.push('Aktivitas sehari-hari cukup terganggu');
  }

  if (input.hasTrustedSupport === 'tidak_ada') {
    factors.push('Belum memiliki keluarga atau orang terdekat yang mendampingi saat ini');
  } else if (input.hasTrustedSupport === 'terbatas') {
    factors.push('Dukungan orang terdekat masih terbatas');
  }

  const realPracticalNeeds = input.practicalNeeds.filter(
    (p) => !p.toLowerCase().includes('tidak ada kebutuhan'),
  );
  if (realPracticalNeeds.length > 0) {
    factors.push(`Kebutuhan praktis yang belum terpenuhi: ${realPracticalNeeds.join(', ')}`);
  }

  if (input.companionPreference === 'butuh_bantuan_segera') {
    factors.push('Menyatakan membutuhkan bantuan segera');
  } else if (input.companionPreference === 'ingin_konselor') {
    factors.push('Menginginkan berbicara dengan konselor profesional');
  } else if (input.companionPreference === 'ingin_berbicara_kader') {
    factors.push('Menginginkan berbicara dengan kader pendamping komunitas');
  } else {
    factors.push('Memilih informasi dan panduan mandiri sebagai langkah awal');
  }

  return factors;
}

/**
 * Pure, deterministic rule-based decision system grounded in ESAI.docx (Paragraf 21-22, Lampiran 4 & 5).
 * Processes explicit answers (safety, emotional strain, sleep, daily activity, social support,
 * practical needs, and companion preference) to recommend an appropriate non-diagnostic support pathway.
 * Never generates clinical scores, severity indices, or psychiatric diagnoses.
 */
export function evaluateScreeningDecision(input: ScreeningInput): DecisionResult {
  const matchedRules: MatchedRuleTrace[] = [];
  const humanFactors = collectHumanFactors(input);
  const realPracticalNeeds = input.practicalNeeds.filter(
    (p) => !p.toLowerCase().includes('tidak ada kebutuhan'),
  );
  const needsHealthOrProtection = realPracticalNeeds.some(
    (p) =>
      p.toLowerCase().includes('kesehatan') || p.toLowerCase().includes('perlindungan'),
  );

  // 1. Immediate safety / crisis escalation rule (ESAI Paragraf 22 & Lampiran 4-5)
  const immediateTriggers: string[] = [];
  if (input.safetyStatus === 'bahaya_langsung') {
    immediateTriggers.push('Status rasa aman: berada dalam bahaya langsung atau situasi krisis');
  }
  if (input.companionPreference === 'butuh_bantuan_segera') {
    immediateTriggers.push('Preferensi bantuan: memilih membutuhkan bantuan segera');
  }

  if (immediateTriggers.length > 0) {
    matchedRules.push({
      code: 'RULE_IMMEDIATE_SAFETY_ESCALATION',
      label: 'Eskalasi Segera untuk Keselamatan & Krisis Akut',
      triggeredBy: immediateTriggers,
      basisInEssay:
        'Protokol Keselamatan: Indikasi risiko keselamatan atau bantuan segera harus langsung dieskalasikan kepada petugas dan layanan darurat tanpa menunggu antrean skrining.',
    });

    const recommendedCategories = deriveRecommendedCategories(input, 'bantuan_segera');
    const shouldCreateRequest = input.sendRequestToQueue ?? true;

    return {
      track: 'bantuan_segera',
      ruleCode: 'RULE_IMMEDIATE_SAFETY_ESCALATION',
      summaryTitle: 'Bantuan Segera & Eskalasi Langsung kepada Petugas',
      summaryDescription:
        'Jawaban Anda menunjukkan kondisi yang memerlukan perhatian segera atau rasa tidak aman. Prioritas utama adalah terhubung langsung dengan manusia (petugas posko atau layanan darurat).',
      reasoningSummary: `Rekomendasi ini dipicu oleh: ${immediateTriggers.join('; ')}. Sesuai protokol CARE BRIDGE, situasi mendesak tidak boleh ditunda oleh antrean digital atau jawaban otomatis.`,
      needBadgeLabel: 'Bantuan Segera — Hubungi Petugas Secara Langsung',
      shouldCreateRequest,
      initialStatus: shouldCreateRequest ? 'baru' : null,
      isImmediateHelp: true,
      authorityNote:
        'Kader tidak menangani krisis akut atau situasi bahaya sendirian; eskalasi langsung diarahkan ke petugas siaga, konselor profesional, dan layanan darurat resmi (119 / 112 / Posko BPBA).',
      needsProfessionalValidationNote:
        'Dalam prototipe demonstrasi ini, sistem dapat mencatat permintaan prioritas ke antrean konselor bila Anda menyetujui, namun sistem TIDAK otomatis menghubungi ambulans atau layanan darurat sungguhan.',
      matchedRules,
      recommendedCategories,
      nextSteps: [
        'Segera datangi meja petugas posko kesehatan/psikososial terdekat atau hubungi layanan darurat 119 / 112.',
        'Mintalah anggota keluarga, tetangga, atau relawan di dekat Anda untuk menemani saat ini.',
        'Jika Anda tetap memilih mengirim catatan prioritas ke konselor prototipe, statusnya tercatat dengan penanda Bantuan Segera.',
      ],
      disclaimer: NON_CLINICAL_DISCLAIMER,
    };
  }

  // 2. Counselor Professional Pathway Rule (ESAI Paragraf 21-22, 27, Lampiran 5)
  const counselorTriggers: string[] = [];
  if (input.companionPreference === 'ingin_konselor') {
    counselorTriggers.push('Memilih keinginan untuk terhubung dengan konselor profesional');
  }
  if (
    input.emotionalState === 'tertekan_berat' &&
    input.activityDifficulty === 'sangat_terganggu'
  ) {
    counselorTriggers.push(
      'Kombinasi tekanan emosional terasa sangat berat dan aktivitas sehari-hari sangat terganggu',
    );
  }
  if (
    input.safetyStatus === 'kurang_aman' &&
    input.sleepDifficulty === 'sering_sulit_tidur' &&
    input.hasTrustedSupport === 'tidak_ada'
  ) {
    counselorTriggers.push(
      'Rasa aman kurang stabil disertai sering sulit tidur dan belum memiliki pendamping terdekat',
    );
  }
  if (needsHealthOrProtection && input.activityDifficulty === 'sangat_terganggu') {
    counselorTriggers.push(
      'Memerlukan akses kesehatan/perlindungan mendesak dengan aktivitas harian sangat terganggu',
    );
  }

  if (counselorTriggers.length > 0) {
    matchedRules.push({
      code: 'RULE_COUNSELOR_PROFESSIONAL_NEED',
      label: 'Peninjauan & Layanan Konselor Profesional',
      triggeredBy: counselorTriggers,
      basisInEssay:
        'Protokol Layanan Lanjutan: Kebutuhan yang melampaui dukungan dasar atau keinginan konsultasi profesional diarahkan kepada konselor untuk peninjauan dan koordinasi rujukan.',
    });

    const recommendedCategories = deriveRecommendedCategories(input, 'konselor');
    const shouldCreateRequest = input.sendRequestToQueue ?? true;

    return {
      track: 'konselor',
      ruleCode: 'RULE_COUNSELOR_PROFESSIONAL_NEED',
      summaryTitle: 'Rekomendasi: Dihubungkan dengan Konselor Profesional',
      summaryDescription:
        'Berdasarkan kombinasi jawaban Anda mengenai kondisi keseharian, dukungan sosial, atau keinginan konsultasi, sistem mengarahkan Anda ke jalur peninjauan Konselor Profesional.',
      reasoningSummary: `Analisis aturan menemukan: ${counselorTriggers.join('; ')}. Pendampingan konselor disarankan agar Anda mendapatkan peninjauan yang sesuai kompetensi serta rujukan terarah bila dibutuhkan.`,
      needBadgeLabel: 'Layanan & Peninjauan Konselor Profesional',
      shouldCreateRequest,
      initialStatus: shouldCreateRequest ? 'baru' : null,
      isImmediateHelp: false,
      authorityNote:
        'Konselor profesional berwenang meninjau kebutuhan lanjutan, melakukan konseling sesuai kompetensi, serta mengoordinasikan rujukan ke puskesmas/rumah sakit atau layanan perlindungan.',
      needsProfessionalValidationNote: PROTOTYPE_VALIDATION_NOTE,
      matchedRules,
      recommendedCategories,
      nextSteps: [
        shouldCreateRequest
          ? 'Permintaan layanan Anda akan tercatat dengan status "Baru" pada daftar Konselor Profesional.'
          : 'Anda memilih belum mengirim permintaan ke antrean; Anda tetap dapat menghubungi petugas posko kapan saja.',
        'Sambil menunggu tindak lanjut, baca panduan menenangkan diri dan kapan meminta bantuan profesional.',
        'Jika sewaktu-waktu rasa aman menurun atau muncul krisis mendesak, segera gunakan jalur Bantuan Segera.',
      ],
      disclaimer: NON_CLINICAL_DISCLAIMER,
    };
  }

  // 3. Kader Community Companion Pathway Rule (ESAI Paragraf 25-26, Lampiran 5 & 6)
  const kaderTriggers: string[] = [];
  if (input.companionPreference === 'ingin_berbicara_kader') {
    kaderTriggers.push('Memilih ingin berbicara dan didampingi oleh kader komunitas');
  }
  if (
    input.activityDifficulty === 'cukup_terganggu' ||
    input.activityDifficulty === 'sangat_terganggu'
  ) {
    kaderTriggers.push('Aktivitas harian setelah bencana terasa cukup/sangat terganggu');
  }
  if (input.sleepDifficulty === 'sering_sulit_tidur') {
    kaderTriggers.push('Sering mengalami kesulitan tidur sejak kejadian');
  }
  if (input.emotionalState === 'tertekan_berat') {
    kaderTriggers.push('Merasakan tekanan emosional yang berat');
  }
  if (input.hasTrustedSupport === 'tidak_ada') {
    kaderTriggers.push('Belum memiliki dukungan keluarga atau orang tepercaya di sekitar');
  }
  if (input.safetyStatus === 'kurang_aman') {
    kaderTriggers.push('Melaporkan rasa aman masih kurang stabil');
  }
  if (realPracticalNeeds.length > 0) {
    kaderTriggers.push(`Membutuhkan penghubung kebutuhan praktis (${realPracticalNeeds.join(', ')})`);
  }

  if (kaderTriggers.length > 0) {
    matchedRules.push({
      code: 'RULE_KADER_COMMUNITY_COMPANION',
      label: 'Pendampingan Awal oleh Kader Komunitas (PFA)',
      triggeredBy: kaderTriggers,
      basisInEssay:
        'Protokol Pendampingan Komunitas: Kader hadir mendengarkan secara empatik (PFA), menghubungkan kebutuhan praktis atau sosial, dan meminta supervisi konselor bila melampaui dukungan dasar.',
    });

    const recommendedCategories = deriveRecommendedCategories(input, 'kader');
    // Respect voluntary nature if user specifically asked for info only unless they opt in
    const defaultOptIn = input.companionPreference === 'ingin_berbicara_kader';
    const shouldCreateRequest = input.sendRequestToQueue ?? defaultOptIn;

    return {
      track: 'kader',
      ruleCode: 'RULE_KADER_COMMUNITY_COMPANION',
      summaryTitle: 'Rekomendasi: Pendampingan Awal oleh Kader Komunitas',
      summaryDescription:
        input.companionPreference === 'cukup_informasi'
          ? 'Meskipun Anda memilih informasi mandiri, jawaban Anda menunjukkan adanya gangguan tidur/aktivitas, keterbatasan dukungan sekitar, atau kebutuhan praktis sehingga pendampingan kader komunitas direkomendasikan.'
          : 'Berdasarkan jawaban Anda, sistem merekomendasikan pendampingan awal bersama Kader Pendamping Komunitas untuk dukungan empatik dan penghubung layanan posko.',
      reasoningSummary: `Rekomendasi ini disusun karena jawaban Anda menunjukkan: ${kaderTriggers.join('; ')}.`,
      needBadgeLabel: 'Pendampingan awal & dukungan komunitas bersama Kader',
      shouldCreateRequest,
      initialStatus: shouldCreateRequest ? 'baru' : null,
      isImmediateHelp: false,
      authorityNote:
        'Kader pendamping memberikan dukungan psikososial dasar (Psychological First Aid), mendengarkan tanpa memaksa, dan menghubungkan Anda ke dukungan sosial. Kader BUKAN terapis dan tidak membuat diagnosis; bila diperlukan, kader akan berkonsultasi ke konselor.',
      needsProfessionalValidationNote: PROTOTYPE_VALIDATION_NOTE,
      matchedRules,
      recommendedCategories,
      nextSteps: [
        shouldCreateRequest
          ? 'Permintaan pendampingan Anda tercatat dengan status "Baru" pada dashboard Kader Pendamping.'
          : 'Anda tetap dapat membaca materi edukasi terlebih dahulu, atau menekan tombol "Hubungi Kader Pendamping" kapan pun merasa siap.',
        'Kader dapat berkoordinasi dengan konselor melalui supervisi apabila keluhan berlanjut.',
        'Anda juga dapat mengakses CARE Assistant untuk mencari informasi umum dari materi lokal.',
      ],
      disclaimer: NON_CLINICAL_DISCLAIMER,
    };
  }

  // 4. General Information & Self-Care Education Rule (ESAI Lampiran 5 row 1)
  matchedRules.push({
    code: 'RULE_SELF_EDUCATION_AND_PFA_INFO',
    label: 'Informasi Psikososial Mandiri & CARE Assistant',
    triggeredBy: humanFactors,
    basisInEssay:
      'Protokol Informasi Mandiri: Kondisi harian yang stabil diarahkan ke materi edukasi terverifikasi serta CARE Assistant, sambil tetap bebas meminta pendamping manusia kapan saja.',
  });

  const recommendedCategories = deriveRecommendedCategories(input, 'edukasi');
  const shouldCreateRequest = input.sendRequestToQueue ?? false;

  return {
    track: 'edukasi',
    ruleCode: 'RULE_SELF_EDUCATION_AND_PFA_INFO',
    summaryTitle: 'Rekomendasi: Informasi & Edukasi Psikososial Mandiri',
    summaryDescription:
      'Berdasarkan jawaban Anda, kondisi rasa aman, aktivitas harian, serta dukungan sekitar relatif terjaga saat ini. Anda diarahkan ke panduan perawatan diri dan informasi dukungan komunitas.',
    reasoningSummary: `Analisis aturan membaca bahwa aktivitas Anda relatif stabil (${humanFactors.join('; ')}). Materi edukasi dan CARE Assistant dapat membantu Anda menjaga ketenangan serta mendukung orang sekitar.`,
    needBadgeLabel: 'Informasi & edukasi pemulihan mandiri',
    shouldCreateRequest,
    initialStatus: shouldCreateRequest ? 'baru' : null,
    isImmediateHelp: false,
    authorityNote:
      'Jalur ini bersifat informasional mandiri. Apabila di kemudian hari kondisi berubah atau Anda ingin teman bicara, Anda tetap berhak meminta pendampingan kader atau konselor tanpa mengulang skrining.',
    needsProfessionalValidationNote: PROTOTYPE_VALIDATION_NOTE,
    matchedRules,
    recommendedCategories,
    nextSteps: [
      'Pelajari materi edukasi terkurasi yang disesuaikan dengan kebutuhan yang Anda pilih.',
      'Gunakan CARE Assistant (fitur informasi lokal, bukan konselor) bila ingin menanyakan topik umum.',
      'Jika suatu saat membutuhkan pendamping, gunakan tombol "Saya Membutuhkan Pendamping".',
    ],
    disclaimer: NON_CLINICAL_DISCLAIMER,
  };
}
