import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Headphones,
  Loader2,
  LogIn,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BotanicalCorners, BrandLogo } from '@/components/BrandLogo';
import { PrototypeBanner } from '@/components/PrototypeBanner';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const DEMO_ACCOUNTS = [
  {
    roleLabel: 'Kader Pendamping',
    name: 'Rizky Pratama',
    username: 'kader.aceh',
    password: 'kader123',
    post: 'Posko Banda Aceh',
    icon: Users,
    accent: 'border-[#BFE3CF] bg-[#EFF8F3] text-[#135D43]',
  },
  {
    roleLabel: 'Konselor Profesional',
    name: 'Dr. Ratna Dewi, M.Psi.',
    username: 'konselor.ratna',
    password: 'konselor123',
    post: 'Koordinator Supervisi Aceh',
    icon: Headphones,
    accent: 'border-[#C5DDF8] bg-[#EEF6FD] text-[#1D5FBF]',
  },
];

export function LoginPage() {
  const { login, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const loggedIn = await login(username, password);
      showToast(`Selamat datang, ${loggedIn.name}`, {
        description: `Masuk sebagai ${loggedIn.role === 'konselor' ? 'Konselor Profesional' : 'Kader Pendamping'}.`,
      });
      navigate(loggedIn.role === 'konselor' ? '/konselor/dashboard' : '/kader/dashboard');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal masuk.');
    } finally {
      setLoading(false);
    }
  };

  const quickFillAndLogin = async (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg('');
    setLoading(true);
    try {
      const loggedIn = await login(u, p);
      showToast(`Masuk sebagai ${loggedIn.name}`);
      navigate(loggedIn.role === 'konselor' ? '/konselor/dashboard' : '/kader/dashboard');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal masuk.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-[#F3FAF6]">
      <PrototypeBanner showKioskClear={false} />
      <BotanicalCorners />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/">
            <BrandLogo />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-[#DCEAE3] bg-white px-4 py-2 text-xs font-bold text-[#135D43] hover:bg-[#EFF8F3]"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Login Form */}
          <div className="cb-card-elevated p-6 sm:p-8 lg:col-span-6">
            <h1 className="text-2xl font-extrabold text-[#0E2D24]">
              Masuk Portal Petugas (Demonstrasi)
            </h1>
            <p className="mt-1.5 text-sm text-[#47655B]">
              Autentikasi berbasis peran untuk mengakses Dashboard Kader Pendamping atau Konselor
              Profesional.
            </p>

            {user && (
              <div className="mt-4 rounded-xl border border-[#BFE3CF] bg-[#EFF8F3] p-3.5 text-xs text-[#114432]">
                Saat ini Anda masuk sebagai <strong>{user.name}</strong> ({user.role}).{' '}
                <Link
                  to={user.role === 'konselor' ? '/konselor/dashboard' : '/kader/dashboard'}
                  className="font-bold underline"
                >
                  Buka Dashboard →
                </Link>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="cb-username" className="block text-sm font-semibold text-[#0E2D24]">
                  Username Demo
                </label>
                <input
                  id="cb-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: kader.aceh atau konselor.ratna"
                  required
                  className="mt-1.5 w-full rounded-xl border border-[#CFE3D8] bg-[#FAFDFB] px-4 py-2.5 text-sm text-[#0E2D24]"
                />
              </div>

              <div>
                <label htmlFor="cb-password" className="block text-sm font-semibold text-[#0E2D24]">
                  Kata Sandi Demo
                </label>
                <input
                  id="cb-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi demo"
                  required
                  className="mt-1.5 w-full rounded-xl border border-[#CFE3D8] bg-[#FAFDFB] px-4 py-2.5 text-sm text-[#0E2D24]"
                />
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-xl bg-[#FDECEC] px-3.5 py-2.5 text-xs font-semibold text-[#C93434]"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#135D43] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#0E4834] disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Masuk ke Dashboard
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#F5DDA9] bg-[#FFFDF4] p-3.5 text-xs text-[#735613]">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Catatan Keamanan: Akun di samping hanya kredensial demonstrasi prototipe dan tidak
                boleh digunakan pada lingkungan produksi sungguhan.
              </span>
            </div>
          </div>

          {/* Demo Accounts Quick Access */}
          <div className="space-y-4 lg:col-span-6">
            <div className="cb-card p-6">
              <h2 className="text-base font-extrabold text-[#0E2D24]">
                Akun Demonstrasi Siap Pakai
              </h2>
              <p className="mt-1 text-xs text-[#47655B]">
                Klik salah satu kartu di bawah untuk langsung mencoba sesi sesuai peran saat
                presentasi:
              </p>

              <div className="mt-4 space-y-3">
                {DEMO_ACCOUNTS.map((acc) => {
                  const Icon = acc.icon;
                  return (
                    <div key={acc.username} className={`rounded-2xl border p-4 ${acc.accent}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-2xs">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide opacity-80">
                              {acc.roleLabel}
                            </p>
                            <p className="text-base font-extrabold text-[#0E2D24]">{acc.name}</p>
                            <p className="text-xs text-[#47655B]">{acc.post}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => quickFillAndLogin(acc.username, acc.password)}
                          className="shrink-0 rounded-xl bg-[#135D43] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#0E4834] disabled:opacity-60"
                        >
                          Masuk Cepat
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3 border-t border-black/10 pt-2.5 text-xs">
                        <span>
                          Username: <code className="font-bold">{acc.username}</code>
                        </span>
                        <span>
                          Password: <code className="font-bold">{acc.password}</code>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-xl bg-[#F8FCFA] p-3 text-xs text-[#4F6E63]">
                <strong>Akun Kader Wilayah 2 (opsional):</strong> <code>kader.meulaboh</code> /{' '}
                <code>kader123</code> — untuk menguji pembatasan akses kasus antarkader.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
