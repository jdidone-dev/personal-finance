import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency, formatUSD } from '../../utils/calculations';

interface DataPoint {
  mes: string;
  valor: number;
}

interface TooltipPayload {
  value: number;
}

function CustomTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  currency: 'BRL' | 'USD';
}) {
  if (!active || !payload?.length) return null;
  const fmt = currency === 'USD' ? formatUSD : formatCurrency;
  return (
    <div className="bg-surface-1 border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="mono text-sm font-semibold text-sky-300">
        {fmt(payload[0].value)}
      </p>
    </div>
  );
}

interface PatrimonyChartProps {
  data: DataPoint[];
  title?: string;
  color?: string;
  currency?: 'BRL' | 'USD';
}

export function PatrimonyChart({
  data,
  title = 'Evolução Patrimonial',
  color = '#38bdf8',
  currency = 'BRL',
}: PatrimonyChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-slate-600 text-sm gap-2">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <span>Use "Consolidar Mês" para registrar o histórico.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {title && (
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="mes"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) =>
              currency === 'USD'
                ? new Intl.NumberFormat('en-US', {
                    notation: 'compact',
                    compactDisplay: 'short',
                    currency: 'USD',
                    style: 'currency',
                  }).format(v)
                : new Intl.NumberFormat('pt-BR', {
                    notation: 'compact',
                    compactDisplay: 'short',
                    currency: 'BRL',
                    style: 'currency',
                  }).format(v)
            }
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip content={<CustomTooltip currency={currency} />} />
          <Line
            type="monotone"
            dataKey="valor"
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
