import {
  REFERRAL_STATUS_META,
  REQUEST_STATUS_META,
  SUPERVISION_STATUS_META,
} from '@shared/status';
import type {
  ReferralStatus,
  SupervisionStatus,
  SupportRequestStatus,
} from '@shared/types';

export function StatusBadge({ status }: { status: SupportRequestStatus }) {
  const meta = REQUEST_STATUS_META[status] ?? REQUEST_STATUS_META.baru;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.badgeClass}`}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: meta.dotColor }}
        aria-hidden="true"
      />
      {meta.label}
    </span>
  );
}

export function SupervisionStatusBadge({ status }: { status: SupervisionStatus }) {
  const meta = SUPERVISION_STATUS_META[status] ?? SUPERVISION_STATUS_META.menunggu;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.badgeClass}`}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: meta.dotColor }}
        aria-hidden="true"
      />
      {meta.label}
    </span>
  );
}

export function ReferralStatusBadge({ status }: { status: ReferralStatus }) {
  const meta = REFERRAL_STATUS_META[status] ?? REFERRAL_STATUS_META.direncanakan;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.badgeClass}`}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: meta.dotColor }}
        aria-hidden="true"
      />
      {meta.label}
    </span>
  );
}
