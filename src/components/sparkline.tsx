import * as React from "react";

import { cn } from "@/lib/utils";

type SparklineProps = {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
  strokeClassName?: string;
};

function getPath(values: number[], width: number, height: number) {
  if (values.length === 0) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((value, idx) => {
      const x = (idx / (values.length - 1 || 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${idx === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export function Sparkline({
  values,
  width = 120,
  height = 32,
  className,
  strokeClassName,
}: SparklineProps) {
  const path = React.useMemo(() => getPath(values, width, height), [values, width, height]);
  if (values.length < 2) {
    return <div className={cn("h-8 w-28 rounded-full bg-secondary/50", className)} />;
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-8 w-28 overflow-visible", className)}
      role="img"
      aria-hidden="true"
    >
      <path
        d={path}
        className={cn("fill-none stroke-[2.2] stroke-primary", strokeClassName)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
