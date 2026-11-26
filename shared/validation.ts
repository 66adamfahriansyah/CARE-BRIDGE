import { z } from 'zod';

export const screeningConsentSchema = z.object({
  understoodConfidentiality: z.literal(true, {
    errorMap: () => ({
      message: 'Harap centang pemahaman sifat sukarela dan non-diagnosis sebelum melanjutkan.',
    }),
  }),
  agreedToProceed: z.literal(true, {
    errorMap: () => ({ message: 'Harap setujui persetujuan skrining untuk melanjutkan.' }),
  }),
});

export const screeningBasicInfoSchema = z
  .object({
    isAnonymous: z.boolean(),
    nickname: z.string().trim().max(40, 'Nama panggilan maksimal 40 karakter.'),
    ageRange: z.string().trim().min(1, 'Pilih rentang usia atau opsi lewati.'),
    locationPost: z.string().trim().min(1, 'Pilih lokasi posko atau wilayah layanan.'),
    agreedFollowUpContact: z.boolean(),
    contactInfo: z.string().trim().max(80, 'Kontak maksimal 80 karakter.'),
  })
  .superRefine((val, ctx) => {
    if (!val.isAnonymous && val.nickname.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['nickname'],
        message: 'Isi nama panggilan minimal 2 karakter atau pilih opsi anonim.',
      });
    }
    if (val.agreedFollowUpContact && val.contactInfo.length < 4) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['contactInfo'],
        message: 'Cantumkan cara menghubungi (mis. nomor posko/tenda) jika menyetujui tindak lanjut.',
      });
    }
  });

export const screeningConditionSchema = z.object({
  safetyStatus: z.enum(['aman', 'kurang_aman', 'bahaya_langsung'], {
    errorMap: () => ({ message: 'Pilih gambaran rasa aman Anda saat ini.' }),
  }),
  emotionalState: z.enum(['tenang_terkendali', 'cemas_sedih_ringan', 'tertekan_berat'], {
    errorMap: () => ({ message: 'Pilih gambaran kondisi perasaan Anda setelah kejadian.' }),
  }),
  sleepDifficulty: z.enum(['tidak_ada', 'kadang', 'sering_sulit_tidur'], {
    errorMap: () => ({ message: 'Pilih kondisi tidur Anda saat ini.' }),
  }),
  activityDifficulty: z.enum(['tidak', 'sedikit', 'cukup_terganggu', 'sangat_terganggu'], {
    errorMap: () => ({ message: 'Pilih gambaran kondisi aktivitas harian Anda.' }),
  }),
  primaryNeed: z.string().trim().min(3, 'Pilih atau jelaskan kebutuhan utama Anda saat ini.'),
  additionalNotes: z.string().trim().max(500, 'Catatan maksimal 500 karakter.').optional().default(''),
});

export const screeningSocialSupportSchema = z.object({
  hasTrustedSupport: z.enum(['ya', 'terbatas', 'tidak_ada'], {
    errorMap: () => ({ message: 'Pilih kondisi dukungan sosial yang Anda miliki saat ini.' }),
  }),
  practicalNeeds: z
    .array(z.string())
    .min(1, 'Pilih minimal satu keterangan kebutuhan praktis (atau pilih tidak ada kebutuhan mendesak).'),
  socialSupportNeeded: z
    .array(z.string())
    .min(1, 'Pilih minimal satu bentuk dukungan sosial yang dirasa membantu.'),
});

export const screeningPreferenceSchema = z.object({
  companionPreference: z.enum(
    ['cukup_informasi', 'ingin_berbicara_kader', 'ingin_konselor', 'butuh_bantuan_segera'],
    {
      errorMap: () => ({ message: 'Pilih preferensi pendampingan Anda saat ini.' }),
    },
  ),
});

export const fullScreeningSubmitSchema = screeningConsentSchema
  .merge(
    z.object({
      isAnonymous: z.boolean(),
      nickname: z.string().trim().max(40),
      ageRange: z.string().trim().min(1),
      locationPost: z.string().trim().min(1),
      agreedFollowUpContact: z.boolean(),
      contactInfo: z.string().trim().max(80),
      safetyStatus: z.enum(['aman', 'kurang_aman', 'bahaya_langsung']),
      emotionalState: z.enum(['tenang_terkendali', 'cemas_sedih_ringan', 'tertekan_berat']),
      sleepDifficulty: z.enum(['tidak_ada', 'kadang', 'sering_sulit_tidur']),
      activityDifficulty: z.enum(['tidak', 'sedikit', 'cukup_terganggu', 'sangat_terganggu']),
      primaryNeed: z.string().trim().min(3),
      additionalNotes: z.string().trim().max(500).optional().default(''),
      hasTrustedSupport: z.enum(['ya', 'terbatas', 'tidak_ada']),
      practicalNeeds: z.array(z.string()).min(1),
      socialSupportNeeded: z.array(z.string()).min(1),
      companionPreference: z.enum([
        'cukup_informasi',
        'ingin_berbicara_kader',
        'ingin_konselor',
        'butuh_bantuan_segera',
      ]),
      sendRequestToQueue: z.boolean().optional(),
    }),
  )
  .superRefine((val, ctx) => {
    if (!val.isAnonymous && val.nickname.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['nickname'],
        message: 'Isi nama panggilan atau aktifkan mode anonim.',
      });
    }
    if (val.agreedFollowUpContact && val.contactInfo.length < 4) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['contactInfo'],
        message: 'Masukkan kontak untuk tindak lanjut jika memilih persetujuan kontak.',
      });
    }
  });

export const quickHelpRequestSchema = z
  .object({
    isAnonymous: z.boolean().default(true),
    nickname: z.string().trim().max(40).optional().default(''),
    locationPost: z.string().trim().min(1, 'Pilih lokasi posko atau wilayah layanan.'),
    primaryNeed: z.string().trim().min(3, 'Pilih atau tulis kebutuhan pendampingan Anda.'),
    preferredTrack: z.enum(['kader', 'konselor', 'bantuan_segera']).default('kader'),
    agreedFollowUpContact: z.boolean().default(false),
    contactInfo: z.string().trim().max(80).optional().default(''),
    consentGiven: z.literal(true, {
      errorMap: () => ({ message: 'Setujui pengiriman permintaan agar petugas dapat menindaklanjuti.' }),
    }),
  })
  .superRefine((val, ctx) => {
    if (!val.isAnonymous && val.nickname.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['nickname'],
        message: 'Masukkan nama panggilan minimal 2 karakter atau pilih anonim.',
      });
    }
    if (val.agreedFollowUpContact && val.contactInfo.trim().length < 4) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['contactInfo'],
        message: 'Masukkan informasi kontak yang dapat dihubungi.',
      });
    }
  });

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username wajib diisi.'),
  password: z.string().min(1, 'Kata sandi wajib diisi.'),
});

export const followUpCreateSchema = z.object({
  note: z.string().trim().min(5, 'Catatan tindak lanjut minimal 5 karakter.').max(1000),
  nextStatus: z
    .enum(['dalam_proses', 'perlu_supervisi', 'menunggu_rujukan', 'selesai'])
    .optional(),
  isCounselorOnly: z.boolean().optional().default(false),
});

export const supervisionCreateSchema = z.object({
  requestId: z.string().trim().min(1, 'ID permintaan wajib disertakan.'),
  supervisionType: z.enum(['terjadwal', 'konsultasi_segera']).default('terjadwal'),
  reason: z.string().trim().min(5, 'Jelaskan alasan permintaan supervisi minimal 5 karakter.').max(500),
  kaderSummary: z.string().trim().min(5, 'Ringkasan pendampingan minimal 5 karakter.').max(1000),
});

export const supervisionUpdateSchema = z.object({
  status: z.enum(['menunggu', 'ditinjau', 'arahan_dikirim', 'selesai']),
  counselorGuidance: z.string().trim().min(5, 'Arahan supervisi minimal 5 karakter.').max(1500),
  requestStatusAfter: z
    .enum(['dalam_proses', 'perlu_supervisi', 'menunggu_rujukan', 'selesai'])
    .optional(),
});

export const referralCreateSchema = z.object({
  requestId: z.string().trim().min(1, 'Pilih kasus terkait rujukan.'),
  destinationFacility: z.string().trim().min(3, 'Tujuan fasilitas rujukan wajib diisi.').max(160),
  referralType: z.string().trim().min(3, 'Jenis layanan rujukan wajib dipilih.').max(120),
  summaryNote: z.string().trim().min(5, 'Ringkasan rujukan minimal 5 karakter.').max(1000),
  status: z.enum(['direncanakan', 'dikonfirmasi', 'selesai']).default('direncanakan'),
});

export const referralUpdateSchema = z.object({
  status: z.enum(['direncanakan', 'dikonfirmasi', 'selesai']),
  summaryNote: z.string().trim().min(5).max(1000).optional(),
  destinationFacility: z.string().trim().min(3).max(160).optional(),
});

export const educationArticleSchema = z.object({
  title: z.string().trim().min(5, 'Judul minimal 5 karakter.').max(160),
  summary: z.string().trim().min(10, 'Ringkasan minimal 10 karakter.').max(400),
  content: z.string().trim().min(40, 'Isi artikel minimal 40 karakter.').max(8000),
  category: z.string().trim().min(3, 'Kategori wajib dipilih.'),
  referenceSource: z.string().trim().min(3, 'Sumber referensi wajib dicantumkan.').max(250),
  status: z.enum(['published', 'draft']).default('draft'),
  readTimeMinutes: z.number().int().min(1).max(30).optional().default(4),
});

export const chatMessageSchema = z.object({
  sessionId: z.string().trim().min(1),
  message: z.string().trim().min(1, 'Tulis pesan terlebih dahulu.').max(500),
});

export const assistantReportSchema = z.object({
  sessionId: z.string().trim().min(1),
  messageId: z.string().trim().min(1),
  reason: z.string().trim().min(5, 'Jelaskan ketidaksesuaian jawaban minimal 5 karakter.').max(400),
});
