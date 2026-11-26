import React from 'react';
import type { Role } from '@shared/types';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ProtectedRoute({
  allowedRole,
  children,
}: {
  allowedRole: Role;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4FAF6]">
        <div className="rounded-2xl border border-[#DCEAE3] bg-white px-6 py-4 text-sm font-semibold text-[#135D43] shadow-sm">
          Memeriksa sesi pengguna demonstrasi...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/masuk" state={{ from: location.pathname }} replace />;
  }

  if (user.role !== allowedRole) {
    const targetHome =
      user.role === 'konselor' ? '/konselor/dashboard' : '/kader/dashboard';
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4FAF6] p-4">
        <div className="max-w-md rounded-2xl border border-[#F5C2C2] bg-white p-6 text-center shadow-lg">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FDECEC] text-[#C93434]">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-lg font-extrabold text-[#0E2D24]">
            Akses Dibatasi Berdasarkan Peran
          </h1>
          <p className="mt-2 text-sm text-[#47655B]">
            Anda masuk sebagai <strong className="capitalize">{user.role}</strong> ({user.name}),
            sehingga tidak memiliki kewenangan membuka modul{' '}
            <strong className="capitalize">{allowedRole}</strong>.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link
              to={targetHome}
              className="rounded-xl bg-[#135D43] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0E4834]"
            >
              Kembali ke Dashboard Saya
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
