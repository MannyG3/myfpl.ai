'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface FormTrendChartProps {
  data: any[];
  squadPlayers: { id: number; web_name: string }[];
}

const LINE_COLORS = [
  '#04F5FF', // FPL Cyan
  '#963CFF', // FPL Violet
  '#00ff87', // FPL Green
  '#f59e0b', // Amber
  '#ec4899', // Rose
  '#3b82f6', // Blue
];

export default function FormTrendChart({
  data,
  squadPlayers,
}: FormTrendChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !data || data.length === 0) {
    return (
      <div className="bg-[#1F0A29] border border-[#3B1348] rounded-xl p-5 min-h-[280px] flex flex-col justify-center items-center text-center">
        <h2 className="text-xl font-bold text-white mb-2">Squad Form Trend</h2>
        <p className="text-xs text-[#C9B7D4]">
          {!isMounted ? 'Loading interactive chart...' : 'No gameweek trend history loaded yet.'}
        </p>
      </div>
    );
  }

  const chartPlayers = squadPlayers.slice(0, 6);

  return (
    <div className="bg-[#1F0A29] border border-[#3B1348] rounded-xl p-5">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="text-xl font-bold text-white">Squad Form Trend</h2>
        <span className="text-xs text-[#C9B7D4]">
          Points per Gameweek
        </span>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 15, left: -25, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#3B1348" />
            <XAxis
              dataKey="gameweek"
              stroke="#C9B7D4"
              fontSize={11}
              tickLine={false}
            />
            <YAxis stroke="#C9B7D4" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#2B0032',
                borderColor: '#3B1348',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

            {chartPlayers.map((player, idx) => (
              <Line
                key={player.id}
                type="monotone"
                dataKey={String(player.id)}
                name={player.web_name}
                stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
