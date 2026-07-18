
const PALETTE = [
  'bg-sky-900/60 text-sky-300',
  'bg-violet-900/60 text-violet-300',
  'bg-emerald-900/60 text-emerald-300',
  'bg-amber-900/60 text-amber-300',
  'bg-rose-900/60 text-rose-300',
  'bg-cyan-900/60 text-cyan-300',
  'bg-fuchsia-900/60 text-fuchsia-300',
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

interface BadgeProps {
  label: string;
  colorKey?: string;
}

export function Badge({ label, colorKey }: BadgeProps) {
  const key = colorKey ?? label;
  const color = PALETTE[hashString(key) % PALETTE.length];
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
