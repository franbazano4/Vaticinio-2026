import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  Brush,
} from "recharts";
import { PARTICIPANTS, COLORS, FORECASTS, GROUP_MATCHES } from "../data/constants";
import { KNOCKOUT_MATCHES, KNOCKOUT_MATCH_BY_ID, resolveKnockoutBracket, KnockoutResult } from "../data/knockoutBracket";
import { calcPts, calcBonusPoints } from "../lib/logic";
import { calcPlayerKnockoutTotal, calcRondaRelampagoPoints } from "../lib/knockoutLogic";

interface Props {
  results: Record<string, [number, number]>;
  knockoutResults: Record<string, KnockoutResult>;
}

type StatsSubTab = "TOTALES" | "PRECISION" | "MAV";
const SUBTAB_LABELS: Record<StatsSubTab, string> = {
  TOTALES: "Totales",
  PRECISION: "Precisión",
  MAV: "MAV",
};

type PrecisionSubTab = "TOTAL" | "GRUPOS" | "FINAL";
const PRECISION_SUBTAB_LABELS: Record<PrecisionSubTab, string> = {
  TOTAL: "Total",
  GRUPOS: "Fase de Grupos",
  FINAL: "Fase Final",
};

const dateSortKey = (d: string) => {
  const [dd, mm] = d.split("/");
  return `${mm}${dd}`;
};

const TOOLTIP_STYLE = {
  backgroundColor: "#1a1a1a",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 6,
  fontSize: 12,
};
const AXIS_TICK = { fill: "#8b8b93", fontSize: 11 };
const GRID_STROKE = "rgba(255,255,255,0.08)";

interface AccuracyEntry {
  name: string;
  color: string;
  exact: number;
  sign: number;
  miss: number;
  played: number;
  advanceHits?: number;
  advanceTotal?: number;
}

function AccuracyRow({ entry, showAdvance }: { entry: AccuracyEntry; showAdvance?: boolean }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-bold uppercase text-sm text-white flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
          {entry.name}
        </span>
        <span className="text-xs text-muted-foreground">{entry.played} pronósticos</span>
      </div>
      {entry.played > 0 ? (
        <>
          <div className="w-full h-3 rounded-full overflow-hidden bg-black/30 flex">
            <div
