import type {
  ReferralStatus,
  ServiceTrack,
  SupervisionStatus,
  SupportRequestStatus,
} from './types.js';

export interface StatusMeta {
  label: string;
  dotColor: string;
  badgeClass: string;
}

export const REQUEST_STATUS_META: Record<SupportRequestStatus, StatusMeta> = {
  baru: {
    label: 'Baru',
    dotColor: '#2563EB',
    badgeClass: 'bg-[#EBF4FF] text-[#1D5FBF] border-[#CFE2FF]',
  },
  dalam_proses: {
    label: 'Dalam Proses',
    dotColor: '#D97706',
    badgeClass: 'bg-[#FFF4E5] text-[#C2610C] border-[#FDE2BA]',
  },
  perlu_supervisi: {
    label: 'Perlu Supervisi',
    dotColor: '#7C3AED',
    badgeClass: 'bg-[#F3E8FF] text-[#6D28D9] border-[#E2CCFF]',
  },
  menunggu_rujukan: {
    label: 'Menunggu Rujukan',
    dotColor: '#0F766E',
    badgeClass: 'bg-[#E6F7F5] text-[#0F766E] border-[#B8EAE4]',
  },
  selesai: {
    label: 'Selesai',
    dotColor: '#15803D',
    badgeClass: 'bg-[#E7F7EE] text-[#157347] border-[#BEEAD2]',
  },
};

export const SUPERVISION_STATUS_META: Record<SupervisionStatus, StatusMeta> = {
  menunggu: {
    label: 'Menunggu Tinjauan',
    dotColor: '#7C3AED',
    badgeClass: 'bg-[#F3E8FF] text-[#6D28D9] border-[#E2CCFF]',
  },
  ditinjau: {
    label: 'Sedang Ditinjau',
    dotColor: '#D97706',
    badgeClass: 'bg-[#FFF4E5] text-[#C2610C] border-[#FDE2BA]',
  },
  arahan_dikirim: {
    label: 'Arahan Dikirim',
    dotColor: '#2563EB',
    badgeClass: 'bg-[#EBF4FF] text-[#1D5FBF] border-[#CFE2FF]',
  },
  selesai: {
    label: 'Supervisi Selesai',
    dotColor: '#15803D',
    badgeClass: 'bg-[#E7F7EE] text-[#157347] border-[#BEEAD2]',
  },
};

export const REFERRAL_STATUS_META: Record<ReferralStatus, StatusMeta> = {
  direncanakan: {
    label: 'Direncanakan',
    dotColor: '#D97706',
    badgeClass: 'bg-[#FFF4E5] text-[#C2610C] border-[#FDE2BA]',
  },
  dikonfirmasi: {
    label: 'Dikonfirmasi',
    dotColor: '#2563EB',
    badgeClass: 'bg-[#EBF4FF] text-[#1D5FBF] border-[#CFE2FF]',
  },
  selesai: {
    label: 'Selesai',
    dotColor: '#15803D',
    badgeClass: 'bg-[#E7F7EE] text-[#157347] border-[#BEEAD2]',
  },
};

export const SERVICE_TRACK_LABEL: Record<ServiceTrack, string> = {
  edukasi: 'Informasi & Edukasi Psikososial',
  kader: 'Kader Pendamping Komunitas',
  konselor: 'Konselor Profesional',
  bantuan_segera: 'Bantuan Segera / Eskalasi Petugas',
};

export const EDUCATION_CATEGORIES = [
  'Mengenali respons stres setelah bencana',
  'Teknik sederhana untuk menenangkan diri',
  'Mendukung keluarga dan orang terdekat',
  'Dukungan sosial berbasis komunitas',
  'Peran kader pendamping',
  'Kapan perlu meminta bantuan profesional',
  'Cara mengakses CARE BRIDGE',
] as const;

export const ACEH_POSKO_LOCATIONS = [
  'Posko Banda Aceh (Masjid Raya / Baiturrahman)',
  'Posko Meulaboh (Aceh Barat)',
  'Posko Sigli (Pidie)',
  'Posko Bireuen',
  'Posko Lhokseumawe',
  'Posko Takengon (Aceh Tengah)',
  'Posko Aceh Tamiang',
  'Posko Lainnya / Akses Daring',
] as const;
