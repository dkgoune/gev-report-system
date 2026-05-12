"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

type TrendChartProps = {
  data: Array<{
    date: string;
    incidents: number;
    reports: number;
    signatures: number;
  }>;
};

type BreakdownBarChartProps = {
  data: Array<Record<string, number | string>>;
  dataKey: string;
  labelKey: string;
  label: string;
};

type EvaluationTrendChartProps = {
  data: Array<{
    date: string;
    evaluations: number;
    netScore: number;
  }>;
};

const trendConfig = {
  reports: {
    label: "Rapports",
    color: "var(--color-chart-1)",
  },
  incidents: {
    label: "Incidents",
    color: "var(--color-chart-3)",
  },
  signatures: {
    label: "Signatures",
    color: "var(--color-chart-5)",
  },
} satisfies ChartConfig;

export function TrendChart({ data }: TrendChartProps) {
  return (
    <ChartContainer config={trendConfig} className="h-72 w-full">
      <LineChart data={data} margin={{ left: 8, right: 8, top: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          minTickGap={24}
          tickFormatter={(value: string) => value.slice(5)}
        />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <Line
          type="monotone"
          dataKey="reports"
          stroke="var(--color-reports)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="incidents"
          stroke="var(--color-incidents)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="signatures"
          stroke="var(--color-signatures)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}

export function BreakdownBarChart({
  data,
  dataKey,
  labelKey,
  label,
}: BreakdownBarChartProps) {
  const config = {
    value: {
      label,
      color: "var(--color-chart-2)",
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="h-72 w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 20 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" hide />
        <YAxis
          dataKey={labelKey}
          type="category"
          tickLine={false}
          axisLine={false}
          width={120}
        />
        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
        <Bar dataKey={dataKey} fill="var(--color-value)" radius={0} />
      </BarChart>
    </ChartContainer>
  );
}

export function EvaluationTrendChart({ data }: EvaluationTrendChartProps) {
  const config = {
    evaluations: {
      label: "Evaluations",
      color: "var(--color-chart-1)",
    },
    netScore: {
      label: "Score net",
      color: "var(--color-chart-4)",
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="h-72 w-full">
      <LineChart data={data} margin={{ left: 8, right: 8, top: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          minTickGap={24}
          tickFormatter={(value: string) => value.slice(5)}
        />
        <YAxis
          yAxisId="left"
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickLine={false}
          axisLine={false}
        />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="evaluations"
          stroke="var(--color-evaluations)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="netScore"
          stroke="var(--color-netScore)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
