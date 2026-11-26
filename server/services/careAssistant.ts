import type { DatabaseSync } from 'node:sqlite';

interface AssistantSource {
  id: string;
  title: string;
  category: string;
  referenceSource: string;
  slug?: string;
}

export interface AssistantReply {
  content: string;
  sources: AssistantSource[];
  isEmergencyFlag: boolean;
}

interface SearchDoc {
  id: string;
  title: string;
  content: string;
  category: string;
  referenceSource: string;
  slug?: string;
}

const EMERGENCY_KEYWORDS = [
  'bunuh diri',
  'mengakhiri hidup',
  'menyakiti diri',
  'melukai diri',
  'tidak ingin hidup',
  'ingin mati',
  'darurat',
  'bahaya langsung',
  'kekerasan',
  'ancaman nyawa',
  'pingsan',
  'sesak napas parah',
  'tolong segera',
];

const STOP_WORDS = new Set([
  'yang',
  'dan',
  'atau',
  'di',
  'ke',
  'dari',
  'untuk',
  'pada',
  'dengan',
  'apa',
  'bagaimana',
  'cara',
  'saya',
  'aku',
  'kita',
  'ini',
  'itu',
  'bisa',
  'apakah',
  'tentang',
  'ada',
  'setelah',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
}

function scoreDocument(queryTokens: string[], doc: SearchDoc): number {
  const haystackTitle = doc.title.toLowerCase();
  const haystackCategory = doc.category.toLowerCase();
  const haystackBody = doc.content.toLowerCase();

  let score = 0;
  for (const token of queryTokens) {
    if (haystackTitle.includes(token)) score += 4;
    if (haystackCategory.includes(token)) score += 3;
    if (haystackBody.includes(token)) score += 1.5;
  }

  // Helpful synonyms for common user questions in Bahasa Indonesia
  const fullQuery = queryTokens.join(' ');
  if (
    (fullQuery.includes('cemas') ||
      fullQuery.includes('takut') ||
      fullQuery.includes('panik') ||
      fullQuery.includes('stres') ||
      fullQuery.includes('tidur')) &&
    (haystackTitle.includes('cemas') ||
      haystackTitle.includes('stres') ||
      haystackTitle.includes('pernapasan') ||
      haystackCategory.includes('stres') ||
      haystackCategory.includes('menenangkan'))
  ) {
    score += 3;
  }

  if (
    (fullQuery.includes('kader') || fullQuery.includes('konselor') || fullQuery.includes('akses') || fullQuery.includes('layanan')) &&
    (haystackTitle.includes('kader') || haystackTitle.includes('layanan') || haystackTitle.includes('mengakses'))
  ) {
    score += 3;
  }

  if (
    (fullQuery.includes('keluarga') || fullQuery.includes('anak') || fullQuery.includes('orangtua') || fullQuery.includes('lansia')) &&
    (haystackTitle.includes('keluarga') || haystackCategory.includes('keluarga'))
  ) {
    score += 3;
  }

  return score;
}

function summarizeRelevantParagraphs(content: string): string {
  const paragraphs = content
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !p.startsWith('Catatan penting:'));

  if (paragraphs.length === 0) return content.slice(0, 360);
  return paragraphs.slice(0, 3).join('\n\n');
}

export function generateCareAssistantReply(
  db: DatabaseSync,
  userMessage: string,
  _history: Array<{ sender: string; content: string }> = [],
): AssistantReply {
  const normalized = userMessage.toLowerCase().trim();

  // 1. Safety / Crisis Check — never rely solely on chatbot, always show immediate human escalation
  const matchedEmergency = EMERGENCY_KEYWORDS.some((kw) => normalized.includes(kw));
  if (matchedEmergency) {
    return {
      isEmergencyFlag: true,
      sources: [],
      content: [
        'Jika Anda atau seseorang di sekitar Anda sedang menghadapi bahaya langsung, krisis akut, atau dorongan untuk menyakiti diri, mohon segera cari bantuan manusia secara langsung saat ini juga.',
        'Langkah cepat yang dapat dilakukan:',
        '• Datangi petugas posko kesehatan/psikososial terdekat atau minta keluarga/rekan di sekitar menemani Anda.',
        '• Hubungi layanan gawat darurat medis 119 atau Posko Tanggap Darurat BPBA Aceh.',
        '• Gunakan halaman Bantuan Segera pada CARE BRIDGE untuk melihat kontak dan jalur eskalasi lengkap.',
        'Catatan: CARE Assistant adalah fitur demonstrasi berbasis pengetahuan lokal dan bukan layanan darurat atau klinis.',
      ].join('\n\n'),
    };
  }

  // 2. Local retrieval across knowledge_documents + published education_articles
  const knowledgeRows = db
    .prepare('SELECT id, title, content, category, reference_source FROM knowledge_documents')
    .all() as Array<{
    id: string;
    title: string;
    content: string;
    category: string;
    reference_source: string;
  }>;

  const articleRows = db
    .prepare(
      `SELECT id, slug, title, content, category, reference_source
       FROM education_articles
       WHERE status = 'published'`,
    )
    .all() as Array<{
    id: string;
    slug: string;
    title: string;
    content: string;
    category: string;
    reference_source: string;
  }>;

  const corpus: SearchDoc[] = [
    ...knowledgeRows.map((k) => ({
      id: k.id,
      title: k.title,
      content: k.content,
      category: k.category,
      referenceSource: k.reference_source,
    })),
    ...articleRows.map((a) => ({
      id: a.id.toUpperCase(),
      title: a.title,
      content: a.content,
      category: a.category,
      referenceSource: a.reference_source,
      slug: a.slug,
    })),
  ];

  // Greeting shortcut
  if (/^(halo|hai|hi|selamat|assalamualaikum|permisi)\b/i.test(normalized) && normalized.length < 35) {
    return {
      isEmergencyFlag: false,
      sources: [],
      content:
        'Halo, selamat datang di CARE Assistant (Demo — basis pengetahuan lokal). Anda dapat menanyakan cara mengelola rasa cemas setelah bencana, teknik menenangkan diri, cara mendukung keluarga, atau cara menghubungi kader dan konselor di CARE BRIDGE.',
    };
  }

  const queryTokens = tokenize(userMessage);
  const ranked = corpus
    .map((doc) => ({ doc, score: scoreDocument(queryTokens, doc) }))
    .filter((entry) => entry.score >= 2.5)
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0) {
    return {
      isEmergencyFlag: false,
      sources: [],
      content: [
        'Maaf, saya belum menemukan informasi yang cukup spesifik dalam koleksi materi lokal CARE BRIDGE untuk pertanyaan tersebut.',
        'Sebagai asisten demonstrasi berbasis pengetahuan lokal, saya hanya dapat menjawab seputar respons stres pascabencana, perawatan diri sederhana, dukungan keluarga/komunitas, peran kader/konselor, dan cara mengakses layanan CARE BRIDGE.',
        'Anda dapat membaca daftar Materi Edukasi yang tersedia atau langsung meminta terhubung dengan Kader Pendamping jika membutuhkan teman bicara.',
      ].join('\n\n'),
    };
  }

  const topDocs = ranked.slice(0, 2).map((r) => r.doc);
  const primary = topDocs[0];
  const excerpt = summarizeRelevantParagraphs(primary.content);

  const lines = [
    `Berdasarkan materi lokal **${primary.title}**:`,
    excerpt,
  ];

  if (topDocs[1]) {
    lines.push(
      `Informasi terkait lainnya juga tersedia pada materi "${topDocs[1].title}".`,
    );
  }

  lines.push(
    'Jika Anda merasa perlu berbicara langsung atau kondisi terasa berat, Anda dapat menekan tombol "Hubungi Kader" atau mengakses halaman Skrining tanpa harus menunggu.',
  );

  return {
    isEmergencyFlag: false,
    content: lines.join('\n\n'),
    sources: topDocs.map((d) => ({
      id: d.id,
      title: d.title,
      category: d.category,
      referenceSource: d.referenceSource,
      slug: d.slug,
    })),
  };
}
