import React, { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '@shared/types';
import {
  AlertCircle,
  BookOpen,
  Flag,
  HeartHandshake,
  Loader2,
  Send,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandMark } from './BrandLogo';
import { QuickHelpModal } from './QuickHelpModal';
import { ASSISTANT_CHAT_KEY } from '@/context/KioskContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';

const DEFAULT_SUGGESTIONS = [
  'Tips mengelola rasa cemas setelah bencana',
  'Bagaimana cara mengakses layanan CARE BRIDGE?',
  'Apa peran kader pendamping dan konselor?',
  'Cara mendukung keluarga dan anak di posko',
];

function createSessionId(): string {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const INITIAL_WELCOME: ChatMessage = {
  id: 'welcome-1',
  sessionId: 'local',
  sender: 'assistant',
  content:
    'Halo, saya CARE Assistant. Saya dapat membantu menjawab pertanyaan seputar respons stres pascabencana, cara sederhana menenangkan diri, dukungan keluarga, serta cara mengakses layanan CARE BRIDGE.\n\n• Pilih salah satu topik saran di bawah atau tulis pertanyaan Anda.',
  createdAt: new Date().toISOString(),
};

export function AssistantPanel({
  compact = false,
  headerActions,
}: {
  compact?: boolean;
  headerActions?: React.ReactNode;
}) {
  const [sessionId, setSessionId] = useState<string>(() => createSessionId());
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem(ASSISTANT_CHAT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [INITIAL_WELCOME];
  });
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [quickHelpOpen, setQuickHelpOpen] = useState(false);
  const [reportedIds, setReportedIds] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    try {
      sessionStorage.setItem(ASSISTANT_CHAT_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const onCleared = () => {
      setSessionId(createSessionId());
      setMessages([INITIAL_WELCOME]);
      setErrorMsg(null);
      setInputText('');
    };
    window.addEventListener('cb:session-cleared', onCleared);
    return () => window.removeEventListener('cb:session-cleared', onCleared);
  }, []);

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || sending) return;

    setErrorMsg(null);
    setInputText('');
    const optimisticUser: ChatMessage = {
      id: `local-u-${Date.now()}`,
      sessionId,
      sender: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);
    setSending(true);

    try {
      const res = await api.assistant.sendMessage(sessionId, trimmed);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticUser.id),
        res.userMessage,
        res.assistantMessage,
      ]);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Gagal terhubung ke CARE Assistant. Silakan coba lagi.',
      );
    } finally {
      setSending(false);
    }
  };

  const resetChat = () => {
    setSessionId(createSessionId());
    setMessages([]);
    setErrorMsg(null);
    try {
      sessionStorage.removeItem(ASSISTANT_CHAT_KEY);
    } catch {
      // ignore
    }
  };

  const handleReportAnswer = async (msgId: string) => {
    try {
      await api.assistant.reportError(
        sessionId,
        msgId,
        'Pengguna melaporkan jawaban perlu ditinjau ulang oleh konselor.',
      );
      setReportedIds((prev) => ({ ...prev, [msgId]: true }));
      showToast('Laporan kesalahan jawaban dicatat untuk ditinjau konselor', { variant: 'info' });
    } catch {
      showToast('Gagal mengirim laporan jawaban', { variant: 'error' });
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#CFE3D8] bg-white shadow-lg">
      {/* Header matching Panel 4 */}
      <div className="flex items-center justify-between gap-2 border-b border-[#E6F1EB] bg-[#F7FCF9] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <BrandMark className="h-7 w-7 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-[#0E2D24] sm:text-base">
                CARE Assistant
              </span>
              <span className="rounded-full bg-[#DCEBFB] px-2 py-0.5 text-[11px] font-bold text-[#1D65C1]">
                Demo
              </span>
            </div>
            <p className="text-[11px] font-medium text-[#47655B]">
              Demo — jawaban berbasis pengetahuan lokal, bukan layanan AI klinis
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={resetChat}
            title="Bersihkan percakapan"
            aria-label="Bersihkan percakapan"
            className="rounded-lg p-1.5 text-[#58766B] hover:bg-[#E7F4EC] hover:text-[#135D43]"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          {headerActions}
        </div>
      </div>

      {/* Chat message area */}
      <div
        ref={scrollRef}
        className={`flex-1 space-y-3.5 overflow-y-auto bg-[#F9FDFB] p-4 ${
          compact ? 'max-h-[340px] min-h-[260px]' : 'min-h-[380px] max-h-[540px]'
        }`}
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-8 text-center">
            <Sparkles className="h-8 w-8 text-[#1B8A5A]" />
            <p className="mt-2 text-sm font-bold text-[#0E2D24]">Mulai Percakapan Baru</p>
            <p className="mt-1 max-w-xs text-xs text-[#47655B]">
              Tanyakan tentang manajemen stres, dukungan keluarga, atau cara menghubungi kader.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#CFE3D8] bg-white">
                    <BrandMark className="h-5 w-5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    isUser
                      ? 'rounded-tr-sm bg-[#D8F1E4] text-[#0E2D24]'
                      : 'rounded-tl-sm border border-[#E2EFE8] bg-white text-[#1A382E] shadow-2xs'
                  }`}
                >
                  {msg.isEmergencyFlag && (
                    <div className="mb-2.5 flex items-start gap-2 rounded-xl border border-[#F5B7B1] bg-[#FFF0F0] p-2.5 text-xs font-semibold text-[#B42318]">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p>Peringatan Keamanan: Segera cari bantuan manusia langsung (119 / Posko).</p>
                        <Link to="/bantuan" className="mt-1 inline-block underline">
                          Buka Jalur Bantuan Segera →
                        </Link>
                      </div>
                    </div>
                  )}

                  <div className="whitespace-pre-line">
                    {msg.content.replace(/\*\*(.*?)\*\*/g, '$1')}
                  </div>

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2.5 border-t border-[#EDF5F0] pt-2">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#5B7A6F]">
                        Sumber Pengetahuan Lokal:
                      </p>
                      <ul className="mt-1 space-y-1">
                        {msg.sources.map((src) => (
                          <li key={src.id} className="text-xs text-[#135D43]">
                            {src.slug ? (
                              <Link
                                to={`/informasi/${src.slug}`}
                                className="font-semibold underline hover:text-[#0E4834]"
                              >
                                [{src.id}] {src.title}
                              </Link>
                            ) : (
                              <span className="font-semibold">
                                [{src.id}] {src.title}
                              </span>
                            )}
                            <span className="block text-[11px] text-[#5B7A6F]">
                              Ref: {src.referenceSource}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {!isUser && msg.id !== 'welcome-1' && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setQuickHelpOpen(true)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#CFE3D8] bg-[#EFF8F3] px-2.5 py-1 text-xs font-semibold text-[#135D43] hover:bg-[#DCF0E5]"
                      >
                        <HeartHandshake className="h-3.5 w-3.5" />
                        Hubungi Kader
                      </button>
                      <Link
                        to="/informasi"
                        className="inline-flex items-center gap-1 rounded-lg border border-[#DCEAE3] bg-white px-2.5 py-1 text-xs font-semibold text-[#2A5344] hover:bg-[#F5FBF8]"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        Lihat Materi Edukasi
                      </Link>
                      <button
                        type="button"
                        disabled={Boolean(reportedIds[msg.id])}
                        onClick={() => handleReportAnswer(msg.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#E6DFC5] bg-[#FFFDF5] px-2.5 py-1 text-xs font-medium text-[#7A5E14] hover:bg-[#FEF7E0] disabled:opacity-60"
                      >
                        <Flag className="h-3 w-3" />
                        {reportedIds[msg.id] ? 'Dilaporkan' : 'Laporkan Jawaban'}
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#135D43] text-white">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {sending && (
          <div className="flex items-center gap-2 text-xs font-medium text-[#47655B]">
            <Loader2 className="h-4 w-4 animate-spin text-[#135D43]" />
            Mencari materi pengetahuan lokal...
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="rounded-xl border border-[#F5B7B1] bg-[#FFF2F2] p-3 text-xs font-semibold text-[#B42318]"
          >
            {errorMsg}
          </div>
        )}
      </div>

      {/* Suggestion pills matching Panel 4 */}
      <div className="border-t border-[#E6F1EB] bg-white px-3.5 pt-2.5 pb-1">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => sendMessage(DEFAULT_SUGGESTIONS[0])}
            className="rounded-full border border-[#DCEAE3] bg-[#F5FBF8] px-3 py-1 text-xs font-medium text-[#135D43] hover:bg-[#E4F4EC]"
          >
            Tips Mengelola Stres
          </button>
          <button
            type="button"
            onClick={() => sendMessage(DEFAULT_SUGGESTIONS[1])}
            className="rounded-full border border-[#DCEAE3] bg-[#F5FBF8] px-3 py-1 text-xs font-medium text-[#135D43] hover:bg-[#E4F4EC]"
          >
            Akses Layanan
          </button>
          <button
            type="button"
            onClick={() => setQuickHelpOpen(true)}
            className="rounded-full border border-[#DCEAE3] bg-[#F5FBF8] px-3 py-1 text-xs font-medium text-[#135D43] hover:bg-[#E4F4EC]"
          >
            Hubungi Kader
          </button>
          <Link
            to="/informasi"
            className="rounded-full border border-[#DCEAE3] bg-[#F5FBF8] px-3 py-1 text-xs font-medium text-[#135D43] hover:bg-[#E4F4EC]"
          >
            Lihat Materi Edukasi
          </Link>
        </div>
      </div>

      {/* Input form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(inputText);
        }}
        className="flex items-center gap-2 bg-white px-3.5 py-3"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ketik pesan Anda..."
          aria-label="Ketik pertanyaan untuk CARE Assistant"
          className="flex-1 rounded-xl border border-[#D4E6DC] bg-[#F8FCFA] px-3.5 py-2.5 text-sm text-[#0E2D24] placeholder:text-[#7A968B]"
        />
        <button
          type="submit"
          disabled={sending || !inputText.trim()}
          aria-label="Kirim pesan"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#135D43] text-white hover:bg-[#0E4834] disabled:opacity-45"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      <div className="border-t border-[#EEF5F1] bg-[#F9FDFB] px-3 py-1.5 text-center text-[11px] text-[#5C796E]">
        Demo CARE Assistant: menggunakan pencarian pengetahuan lokal CARE BRIDGE (bukan layanan AI
        klinis) dan terpisah dari penentuan rekomendasi skrining.
      </div>

      <QuickHelpModal open={quickHelpOpen} onClose={() => setQuickHelpOpen(false)} />
    </div>
  );
}
