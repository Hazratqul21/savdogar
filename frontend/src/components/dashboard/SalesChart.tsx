"use client";

// Using Recharts for charts (Tremor alternative)
// Install with: npm install recharts
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SalesDataPoint {
  date: string;
  actual: number;
  predicted: number;
}

interface SalesChartProps {
  data: SalesDataPoint[];
  className?: string;
}

export function SalesChart({ data, className }: SalesChartProps) {
  // Calculate stats
  const latestActual = data[data.length - 1]?.actual || 0;
  const latestPredicted = data[data.length - 1]?.predicted || 0;
  const variance = latestPredicted > 0 
    ? ((latestActual - latestPredicted) / latestPredicted) * 100 
    : 0;
  const isPositive = variance >= 0;

  // Format number for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium mb-2">{payload[0].payload.date}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Sales Performance vs AI Predictions</CardTitle>
            <CardDescription>Real-time sales compared to Prophet AI forecasts</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{formatCurrency(latestActual)}</div>
            <div className={cn(
              "text-sm flex items-center gap-1",
              isPositive ? "text-green-600" : "text-red-600"
            )}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(variance).toFixed(1)}% vs predicted
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'currentColor', fontSize: 12 }}
              stroke="currentColor"
              className="opacity-60"
            />
            <YAxis 
              tick={{ fill: 'currentColor', fontSize: 12 }}
              stroke="currentColor"
              className="opacity-60"
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="actual"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorActual)"
              name="Actual Sales"
            />
            <Area
              type="monotone"
              dataKey="predicted"
              stroke="#8b5cf6"
              fillOpacity={1}
              fill="url(#colorPredicted)"
              name="Predicted (AI)"
              strokeDasharray="5 5"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

