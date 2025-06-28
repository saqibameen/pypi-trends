import * as React from "react"
import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "./card"

interface ChartProps {
  data: any[]
  lines: { dataKey: string; color?: string; name?: string }[]
  xKey?: string
  title?: string
  height?: number
}

export function Chart({ data, lines, xKey = "date", title, height = 320 }: ChartProps) {
  return (
    <Card className="w-full">
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div style={{ width: "100%", height }}>
          <ResponsiveContainer width="100%" height="100%">
            <ReLineChart data={data} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {lines.map((line, idx) => (
                <Line
                  key={line.dataKey}
                  type="monotone"
                  dataKey={line.dataKey}
                  stroke={line.color || `hsl(var(--chart-${idx + 1}))`}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                  name={line.name || line.dataKey}
                />
              ))}
            </ReLineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}