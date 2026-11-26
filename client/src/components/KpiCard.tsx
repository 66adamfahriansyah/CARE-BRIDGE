import type { LucideIcon } from 'lucide-react';
import { useCountUp } from '@/hooks/useMotion';

type KpiTone = 'blue' | 'amber' | 'purple' | 'green';

const TONE_MAP: Record<
  KpiTone,
  { card: string; iconBg: string; iconColor: string; valueColor: string }
> = {
  blue: {
    card: 'bg-[#F0F7FF] border-[#D6E7FC]',
    iconBg: 'bg-[#DCEBFB]',
    iconColor: 'text-[#1D65C1]',
    valueColor: 'text-[#0E2D24]',
  },
  amber: {
    card: 'bg-[#FFF8EE] border-[#FDE2BA]',
    iconBg: 'bg-[#FCEAD0]',
    iconColor: 'text-[#C2610C]',
    valueColor: 'text-[#0E2D24]',
  },
  purple: {
    card: 'bg-[#F7F2FF] border-[#E4D3FF]',
    iconBg: 'bg-[#EADAFE]',
    iconColor: 'text-[#6D28D9]',
    valueColor: 'text-[#0E2D24]',
  },
  green: {
    card: 'bg-[#EEF9F2] border-[#C5E8D3]',
    iconBg: 'bg-[#D5F0DF]',
    iconColor: 'text-[#135D43]',
    valueColor: 'text-[#0E2D24]',
  },
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
  subtext,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone: KpiTone;
  subtext?: string;
}) {
  const style = TONE_MAP[tone];
  const numericVal = typeof value === 'number' ? value : -1;
  const animatedNumber = useCountUp(numericVal >= 0 ? numericVal : 0);
  const displayValue = typeof value === 'number' ? animatedNumber : value;

  return (
    <div className={`cb-card-interactive rounded-2xl border p-4 shadow-xs sm:p-5 ${style.card}`}>
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${style.iconBg} ${style.iconColor}`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <div className={`text-2xl font-extrabold leading-tight sm:text-3xl ${style.valueColor}`}>
            {displayValue}
          </div>
          <div className="mt-0.5 text-sm font-semibold text-[#2E4D42]">{label}</div>
          {subtext && <div className="mt-0.5 text-xs text-[#5B7A6F]">{subtext}</div>}
        </div>
      </div>
    </div>
  );
}
