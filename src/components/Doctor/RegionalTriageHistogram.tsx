import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import {
  HistoricalTriageRecord,
  OutbreakSyndrome,
  getUnifiedTriageDataset,
} from "../../data/regionalTriageHistory";
import { PatientCase } from "../../types";
import {
  AlertTriangle,
  Flame,
  Activity,
  Calendar,
  Filter,
  Layers,
  TrendingUp,
  MapPin,
  Users,
  Search,
  CheckCircle2,
  Info,
  ChevronRight,
  ShieldAlert,
  ArrowUpDown,
  RefreshCw,
  FileText,
} from "lucide-react";

interface RegionalTriageHistogramProps {
  cases: PatientCase[];
  onSelectCase?: (caseItem: PatientCase) => void;
  onOpenPdfReport?: (caseItem: PatientCase) => void;
  className?: string;
}

type TimeframeFilter = "24h" | "7d" | "30d" | "all";

export const RegionalTriageHistogram: React.FC<RegionalTriageHistogramProps> = ({
  cases,
  onSelectCase,
  onOpenPdfReport,
  className = "",
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Filter States
  const [timeframe, setTimeframe] = useState<TimeframeFilter>("7d");
  const [selectedSyndrome, setSelectedSyndrome] = useState<OutbreakSyndrome>("ALL");
  const [binCount, setBinCount] = useState<number>(10);
  const [showDensityCurve, setShowDensityCurve] = useState<boolean>(true);
  const [selectedBinRange, setSelectedBinRange] = useState<[number, number] | null>(null);
  const [tooltipData, setTooltipData] = useState<{
    visible: boolean;
    x: number;
    y: number;
    bin: d3.Bin<HistoricalTriageRecord, number> | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    bin: null,
  });

  // Prepare unified dataset (combining live cases + regional baseline)
  const fullDataset = useMemo(() => getUnifiedTriageDataset(cases), [cases]);

  // Filter data by timeframe and syndrome
  const filteredData = useMemo(() => {
    const now = Date.now();
    return fullDataset.filter((item) => {
      // Timeframe filter
      if (timeframe !== "all") {
        const itemTime = new Date(item.timestamp).getTime();
        const diffHours = (now - itemTime) / (1000 * 60 * 60);
        if (timeframe === "24h" && diffHours > 24) return false;
        if (timeframe === "7d" && diffHours > 24 * 7) return false;
        if (timeframe === "30d" && diffHours > 24 * 30) return false;
      }

      // Syndrome filter
      if (selectedSyndrome !== "ALL" && item.syndrome !== selectedSyndrome) {
        return false;
      }

      return true;
    });
  }, [fullDataset, timeframe, selectedSyndrome]);

  // Statistical calculations & Outbreak Detection
  const outbreakMetrics = useMemo(() => {
    const total = filteredData.length;
    if (total === 0) {
      return {
        total: 0,
        criticalCount: 0,
        criticalPercent: 0,
        consultationCount: 0,
        routineCount: 0,
        meanScore: 0,
        medianScore: 0,
        isOutbreakAlert: false,
        outbreakSeverity: "NORMAL" as "NORMAL" | "ELEVATED" | "CRITICAL",
        topClusterVillage: "None",
        dominantSyndrome: "None",
        surgeFactor: 1.0,
      };
    }

    const criticalCount = filteredData.filter((d) => d.riskScore >= 75).length;
    const consultationCount = filteredData.filter((d) => d.riskScore >= 40 && d.riskScore < 75).length;
    const routineCount = filteredData.filter((d) => d.riskScore < 40).length;
    const criticalPercent = Math.round((criticalCount / total) * 100);

    const scores = filteredData.map((d) => d.riskScore).sort((a, b) => a - b);
    const meanScore = Math.round(scores.reduce((acc, s) => acc + s, 0) / total);
    const medianScore = scores[Math.floor(total / 2)];

    // Dominant Village Cluster among high-risk patients
    const highRiskRecords = filteredData.filter((d) => d.riskScore >= 65);
    const villageCounts: Record<string, number> = {};
    const syndromeCounts: Record<string, number> = {};

    highRiskRecords.forEach((r) => {
      villageCounts[r.village] = (villageCounts[r.village] || 0) + 1;
      syndromeCounts[r.syndromeLabel] = (syndromeCounts[r.syndromeLabel] || 0) + 1;
    });

    const topClusterVillage =
      Object.entries(villageCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Distributed Regionally";
    const dominantSyndrome =
      Object.entries(syndromeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Mixed Syndromes";

    // Surge Factor compared to safe baseline (15% critical baseline)
    const baselineRatio = 0.15;
    const currentRatio = criticalCount / total;
    const surgeFactor = Number((currentRatio / baselineRatio).toFixed(1));

    // Thresholds: >25% in high zone indicates epidemic cluster
    const isOutbreakAlert = criticalPercent >= 24;
    const outbreakSeverity: "NORMAL" | "ELEVATED" | "CRITICAL" =
      criticalPercent >= 30 ? "CRITICAL" : criticalPercent >= 20 ? "ELEVATED" : "NORMAL";

    return {
      total,
      criticalCount,
      criticalPercent,
      consultationCount,
      routineCount,
      meanScore,
      medianScore,
      isOutbreakAlert,
      outbreakSeverity,
      topClusterVillage,
      dominantSyndrome,
      surgeFactor,
    };
  }, [filteredData]);

  // Patients in currently selected bin (or all if none selected)
  const selectedBinPatients = useMemo(() => {
    if (!selectedBinRange) return [];
    const [minS, maxS] = selectedBinRange;
    return filteredData.filter((d) => d.riskScore >= minS && d.riskScore <= maxS);
  }, [filteredData, selectedBinRange]);

  // --------------------------------------------------------------------------
  // D3 Histogram Rendering Effect
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Responsive dimensions
    const containerWidth = containerRef.current?.clientWidth || 700;
    const width = Math.max(320, containerWidth);
    const height = 280;
    const margin = { top: 32, right: 28, bottom: 44, left: 48 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define Gradients and Drop Shadows
    const defs = svg.append("defs");

    // Routine Green Gradient
    const gradGreen = defs.append("linearGradient").attr("id", "grad-green").attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%");
    gradGreen.append("stop").attr("offset", "0%").attr("stop-color", "#10B981");
    gradGreen.append("stop").attr("offset", "100%").attr("stop-color", "#047857");

    // Amber Consultation Gradient
    const gradAmber = defs.append("linearGradient").attr("id", "grad-amber").attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%");
    gradAmber.append("stop").attr("offset", "0%").attr("stop-color", "#F59E0B");
    gradAmber.append("stop").attr("offset", "100%").attr("stop-color", "#D97706");

    // Critical Red Outbreak Gradient
    const gradRed = defs.append("linearGradient").attr("id", "grad-red").attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%");
    gradRed.append("stop").attr("offset", "0%").attr("stop-color", "#F43F5E");
    gradRed.append("stop").attr("offset", "100%").attr("stop-color", "#BE123C");

    // Highlight Selected Gradient
    const gradSelected = defs.append("linearGradient").attr("id", "grad-selected").attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%");
    gradSelected.append("stop").attr("offset", "0%").attr("stop-color", "#38BDF8");
    gradSelected.append("stop").attr("offset", "100%").attr("stop-color", "#0284C7");

    // X Scale (Triage Risk Score: 0 to 100)
    const xScale = d3.scaleLinear().domain([0, 100]).range([0, innerWidth]);

    // D3 Histogram Generator
    const histogram = d3
      .bin<HistoricalTriageRecord, number>()
      .value((d) => d.riskScore)
      .domain([0, 100])
      .thresholds(xScale.ticks(binCount));

    const bins = histogram(filteredData);
    const maxBinCount = d3.max(bins, (d) => d.length) || 5;

    // Y Scale (Frequency / Number of Patient Cases)
    const yScale = d3
      .scaleLinear()
      .domain([0, Math.ceil(maxBinCount * 1.25)])
      .range([innerHeight, 0]);

    // ------------------------------------------------------------------------
    // Clinical Zone Background Bands (Routine, Consultation, Critical)
    // ------------------------------------------------------------------------
    const zoneBands = [
      { x0: 0, x1: 40, color: "#10B981", label: "ROUTINE SUB-CENTRE (0-39)" },
      { x0: 40, x1: 75, color: "#F59E0B", label: "CONSULTATION ZONE (40-74)" },
      { x0: 75, x1: 100, color: "#EF4444", label: "CRITICAL OUTBREAK ALERT (75-100)" },
    ];

    zoneBands.forEach((band) => {
      g.append("rect")
        .attr("x", xScale(band.x0))
        .attr("y", 0)
        .attr("width", xScale(band.x1) - xScale(band.x0))
        .attr("height", innerHeight)
        .attr("fill", band.color)
        .attr("opacity", 0.05);

      // Top Zone Label
      g.append("text")
        .attr("x", (xScale(band.x0) + xScale(band.x1)) / 2)
        .attr("y", -8)
        .attr("text-anchor", "middle")
        .attr("fill", band.color)
        .attr("font-size", "9px")
        .attr("font-weight", "700")
        .attr("font-family", "monospace")
        .attr("letter-spacing", "0.5px")
        .text(band.label);
    });

    // Horizontal Grid Lines
    const yAxisTicks = yScale.ticks(5);
    g.append("g")
      .attr("class", "grid-lines")
      .selectAll("line")
      .data(yAxisTicks)
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("stroke", "#E2E8F0")
      .attr("stroke-dasharray", "3,3");

    // ------------------------------------------------------------------------
    // Draw Histogram Bars
    // ------------------------------------------------------------------------
    const barGroups = g
      .selectAll<SVGGElement, d3.Bin<HistoricalTriageRecord, number>>(".bar-group")
      .data(bins)
      .enter()
      .append("g")
      .attr("class", "bar-group")
      .style("cursor", "pointer");

    barGroups
      .append("rect")
      .attr("x", (d) => xScale(d.x0 ?? 0) + 1.5)
      .attr("width", (d) => Math.max(0, xScale(d.x1 ?? 0) - xScale(d.x0 ?? 0) - 3))
      .attr("y", innerHeight)
      .attr("height", 0)
      .attr("rx", 3)
      .attr("ry", 3)
      .attr("fill", (d) => {
        const xMid = ((d.x0 ?? 0) + (d.x1 ?? 0)) / 2;
        const isSelected =
          selectedBinRange &&
          d.x0 !== undefined &&
          d.x1 !== undefined &&
          selectedBinRange[0] === d.x0 &&
          selectedBinRange[1] === d.x1;

        if (isSelected) return "url(#grad-selected)";
        if (xMid >= 75) return "url(#grad-red)";
        if (xMid >= 40) return "url(#grad-amber)";
        return "url(#grad-green)";
      })
      .attr("stroke", (d) => {
        const isSelected =
          selectedBinRange &&
          d.x0 !== undefined &&
          d.x1 !== undefined &&
          selectedBinRange[0] === d.x0 &&
          selectedBinRange[1] === d.x1;
        return isSelected ? "#0284C7" : "transparent";
      })
      .attr("stroke-width", 2)
      .on("mouseover", function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("opacity", 0.85)
          .attr("transform", "translate(0, -2)");

        const [mouseX, mouseY] = d3.pointer(event, containerRef.current);
        setTooltipData({
          visible: true,
          x: mouseX,
          y: mouseY,
          bin: d,
        });
      })
      .on("mousemove", function (event) {
        const [mouseX, mouseY] = d3.pointer(event, containerRef.current);
        setTooltipData((prev) => ({
          ...prev,
          x: mouseX,
          y: mouseY,
        }));
      })
      .on("mouseout", function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 1)
          .attr("transform", "translate(0, 0)");

        setTooltipData((prev) => ({ ...prev, visible: false }));
      })
      .on("click", function (_event, d) {
        if (d.x0 !== undefined && d.x1 !== undefined) {
          if (selectedBinRange && selectedBinRange[0] === d.x0 && selectedBinRange[1] === d.x1) {
            setSelectedBinRange(null); // Toggle off
          } else {
            setSelectedBinRange([d.x0, d.x1]);
          }
        }
      })
      .transition()
      .duration(650)
      .ease(d3.easeCubicOut)
      .attr("y", (d) => yScale(d.length))
      .attr("height", (d) => innerHeight - yScale(d.length));

    // Value Labels on Top of Bars (if count > 0)
    barGroups
      .filter((d) => d.length > 0)
      .append("text")
      .attr("x", (d) => (xScale(d.x0 ?? 0) + xScale(d.x1 ?? 0)) / 2)
      .attr("y", (d) => yScale(d.length) - 5)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("font-family", "monospace")
      .attr("fill", (d) => {
        const xMid = ((d.x0 ?? 0) + (d.x1 ?? 0)) / 2;
        if (xMid >= 75) return "#BE123C";
        if (xMid >= 40) return "#B45309";
        return "#047857";
      })
      .text((d) => d.length);

    // ------------------------------------------------------------------------
    // Optional Kernel Density Estimation (KDE) Smooth Curve
    // ------------------------------------------------------------------------
    if (showDensityCurve && filteredData.length >= 4) {
      function kernelDensityEstimator(kernel: (v: number) => number, X: number[]) {
        return function (V: number[]) {
          return X.map((x) => [x, d3.mean(V, (v) => kernel(x - v)) || 0] as [number, number]);
        };
      }
      function epanechnikovKernel(scale: number) {
        return function (u: number) {
          return Math.abs((u /= scale)) <= 1 ? (0.75 * (1 - u * u)) / scale : 0;
        };
      }

      const sampleScores = filteredData.map((d) => d.riskScore);
      const kde = kernelDensityEstimator(epanechnikovKernel(8), xScale.ticks(50));
      const density = kde(sampleScores);

      // Scale density to fit SVG chart height
      const maxDensity = d3.max(density, (d) => d[1]) || 0.01;
      const densityYScale = d3
        .scaleLinear()
        .domain([0, maxDensity])
        .range([innerHeight, innerHeight * 0.15]);

      const lineGenerator = d3
        .line<[number, number]>()
        .curve(d3.curveBasis)
        .x((d) => xScale(d[0]))
        .y((d) => densityYScale(d[1]));

      // Density curve area shadow
      const areaGenerator = d3
        .area<[number, number]>()
        .curve(d3.curveBasis)
        .x((d) => xScale(d[0]))
        .y0(innerHeight)
        .y1((d) => densityYScale(d[1]));

      g.append("path")
        .datum(density)
        .attr("fill", "#2563EB")
        .attr("fill-opacity", 0.04)
        .attr("d", areaGenerator);

      g.append("path")
        .datum(density)
        .attr("fill", "none")
        .attr("stroke", "#2563EB")
        .attr("stroke-width", 2.2)
        .attr("stroke-dasharray", "4,2")
        .attr("opacity", 0.75)
        .attr("d", lineGenerator);
    }

    // ------------------------------------------------------------------------
    // Reference Markers: Mean Score & 75 Alert Threshold
    // ------------------------------------------------------------------------
    if (outbreakMetrics.total > 0) {
      // Mean Line
      const meanX = xScale(outbreakMetrics.meanScore);
      g.append("line")
        .attr("x1", meanX)
        .attr("x2", meanX)
        .attr("y1", 0)
        .attr("y2", innerHeight)
        .attr("stroke", "#334155")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "4,3");

      g.append("text")
        .attr("x", meanX + 3)
        .attr("y", 12)
        .attr("font-size", "9px")
        .attr("font-weight", "bold")
        .attr("fill", "#334155")
        .attr("font-family", "monospace")
        .text(`Mean: ${outbreakMetrics.meanScore}`);

      // Alert 75 Threshold Line
      const alertX = xScale(75);
      g.append("line")
        .attr("x1", alertX)
        .attr("x2", alertX)
        .attr("y1", 0)
        .attr("y2", innerHeight)
        .attr("stroke", "#EF4444")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "2,2");

      g.append("text")
        .attr("x", alertX - 4)
        .attr("y", 12)
        .attr("text-anchor", "end")
        .attr("font-size", "9px")
        .attr("font-weight", "bold")
        .attr("fill", "#DC2626")
        .attr("font-family", "monospace")
        .text("Alert Line (≥75)");
    }

    // ------------------------------------------------------------------------
    // X and Y Axes
    // ------------------------------------------------------------------------
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(10)
      .tickFormat((d) => `${d}`);

    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(d3.format("d"));

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .call((ax) => ax.select(".domain").attr("stroke", "#CBD5E1"))
      .call((ax) => ax.selectAll(".tick line").attr("stroke", "#CBD5E1"))
      .call((ax) =>
        ax
          .selectAll(".tick text")
          .attr("fill", "#475569")
          .attr("font-size", "10px")
          .attr("font-family", "monospace")
      );

    g.append("g")
      .call(yAxis)
      .call((ax) => ax.select(".domain").remove())
      .call((ax) =>
        ax
          .selectAll(".tick text")
          .attr("fill", "#64748B")
          .attr("font-size", "10px")
          .attr("font-family", "monospace")
      );

    // X-Axis Axis Label
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 36)
      .attr("text-anchor", "middle")
      .attr("fill", "#475569")
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .text("Historical Patient Triage Score (0 = Low Risk Routine, 100 = Severe Emergency)");

    // Y-Axis Axis Label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -32)
      .attr("text-anchor", "middle")
      .attr("fill", "#64748B")
      .attr("font-size", "10px")
      .attr("font-weight", "600")
      .text("Patient Encounters");
  }, [filteredData, binCount, showDensityCurve, selectedBinRange, outbreakMetrics]);

  return (
    <div
      ref={containerRef}
      className={`rounded-2xl bg-white border border-slate-200/90 shadow-xs p-4 sm:p-6 space-y-5 ${className}`}
    >
      {/* --------------------------------------------------------------------
          Header & Epidemiological Outbreak Alert Banner
          -------------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <TrendingUp className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Regional Triage Score Distribution & Outbreak Surveillance</span>
                <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                  D3.JS EPIDEMIOLOGY
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Continuous probability density & frequency histogram across primary health centers and sub-centers
              </p>
            </div>
          </div>
        </div>

        {/* Right Metric Quick Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-right">
            <span className="text-[9px] font-mono text-slate-400 block uppercase">Cohort Sample</span>
            <span className="text-xs font-mono font-extrabold text-slate-800">
              {outbreakMetrics.total} Patients
            </span>
          </div>

          <div
            className={`px-3 py-1.5 rounded-xl border text-right transition-colors ${
              outbreakMetrics.outbreakSeverity === "CRITICAL"
                ? "bg-red-50/90 border-red-300 text-red-800"
                : outbreakMetrics.outbreakSeverity === "ELEVATED"
                ? "bg-amber-50/90 border-amber-300 text-amber-800"
                : "bg-emerald-50/90 border-emerald-300 text-emerald-800"
            }`}
          >
            <span className="text-[9px] font-mono block uppercase">Critical Cluster Ratio</span>
            <span className="text-xs font-mono font-black flex items-center justify-end gap-1">
              {outbreakMetrics.isOutbreakAlert && <Flame className="w-3.5 h-3.5 text-red-600 animate-pulse" />}
              {outbreakMetrics.criticalPercent}% (Score ≥75)
            </span>
          </div>
        </div>
      </div>

      {/* Outbreak Status Alert Banner (Shown when high-risk cluster detected) */}
      {outbreakMetrics.isOutbreakAlert ? (
        <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-red-500/10 via-rose-500/10 to-amber-500/10 border-2 border-red-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black text-red-800 uppercase tracking-wide">
                  IDSP Surveillance Alert: High-Risk Cluster Detected ({outbreakMetrics.surgeFactor}x Surge)
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-red-600 text-white animate-pulse">
                  ACTIVATE S.O.P.
                </span>
              </div>
              <p className="text-xs text-red-700 font-medium mt-0.5 leading-snug">
                Unusual concentration in <strong>{outbreakMetrics.dominantSyndrome}</strong>. Primary focal
                point: <strong>{outbreakMetrics.topClusterVillage}</strong>. Recommend preemptive mobile rapid-response team deployment.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setSelectedSyndrome("RESPIRATORY");
                setSelectedBinRange([70, 100]);
              }}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-2xs transition-colors cursor-pointer"
            >
              Isolate Severe Cluster
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Regional Epidemiology Stable:</strong> Score distribution follows normal rural baseline.
              No acute cluster outbreak detected across surveyed blocks.
            </span>
          </div>
          <span className="font-mono text-[10px] text-emerald-700 font-bold shrink-0">
            Mean Score: {outbreakMetrics.meanScore}
          </span>
        </div>
      )}

      {/* --------------------------------------------------------------------
          Interactive Controls & Filter Toolbar
          -------------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50/90 p-3 rounded-xl border border-slate-200/70">
        {/* Timeframe Tabs */}
        <div className="flex items-center gap-1">
          <span className="text-slate-400 font-mono text-[10px] uppercase mr-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-500" />
            Period:
          </span>
          {(
            [
              { id: "24h", label: "24 Hours" },
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" },
              { id: "all", label: "All Data" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTimeframe(t.id);
                setSelectedBinRange(null);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                timeframe === t.id
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Syndrome Filter Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-mono text-[10px] uppercase flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-500" />
            Syndrome:
          </span>
          <select
            value={selectedSyndrome}
            onChange={(e) => {
              setSelectedSyndrome(e.target.value as OutbreakSyndrome);
              setSelectedBinRange(null);
            }}
            className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Clinical Syndromes</option>
            <option value="RESPIRATORY">Severe Respiratory / Hypoxia</option>
            <option value="FEBRILE_VECTOR">Acute Febrile / Vector-Borne</option>
            <option value="GASTROINTESTINAL">Water-Borne / Gastroenteritis</option>
            <option value="MATERNAL">Maternal & Obstetric Risk</option>
            <option value="CARDIOVASCULAR">Hypertensive / Cardiovascular</option>
            <option value="TRAUMA_OTHER">Routine Primary Subcentre</option>
          </select>
        </div>

        {/* Display Toggles */}
        <div className="flex items-center gap-2">
          {/* Bin Granularity */}
          <button
            onClick={() => setBinCount(binCount === 10 ? 20 : 10)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-mono text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            title="Toggle Bin Count"
          >
            <Layers className="w-3 h-3 text-slate-500" />
            <span>{binCount} Bins</span>
          </button>

          {/* Density Curve Toggle */}
          <button
            onClick={() => setShowDensityCurve(!showDensityCurve)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
              showDensityCurve
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
            title="Toggle Kernel Density Estimation line"
          >
            <Activity className="w-3 h-3" />
            <span>KDE Curve</span>
          </button>

          {/* Clear Bin Selection */}
          {selectedBinRange && (
            <button
              onClick={() => setSelectedBinRange(null)}
              className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* --------------------------------------------------------------------
          SVG Histogram Visualizer Container
          -------------------------------------------------------------------- */}
      <div className="relative border border-slate-100 rounded-xl bg-gradient-to-b from-white to-slate-50/50 p-2 overflow-hidden shadow-inner">
        <svg ref={svgRef} className="w-full h-auto overflow-visible select-none" />

        {/* Floating Tooltip */}
        {tooltipData.visible && tooltipData.bin && (
          <div
            className="absolute z-20 pointer-events-none p-3 rounded-xl bg-slate-900/95 backdrop-blur-md text-white border border-slate-700 shadow-xl text-xs space-y-1 max-w-xs transition-transform duration-75"
            style={{
              left: `${Math.min(
                containerRef.current?.clientWidth ? containerRef.current.clientWidth - 200 : 400,
                Math.max(10, tooltipData.x + 12)
              )}px`,
              top: `${Math.max(10, tooltipData.y - 120)}px`,
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-700 pb-1 gap-2">
              <span className="font-mono font-bold text-cyan-300">
                Score Range: {tooltipData.bin.x0} – {tooltipData.bin.x1}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                {tooltipData.bin.length} Cases
              </span>
            </div>
            <div className="text-[11px] text-slate-300 pt-0.5">
              <span>Cohort Proportion: </span>
              <strong className="text-white">
                {outbreakMetrics.total > 0
                  ? ((tooltipData.bin.length / outbreakMetrics.total) * 100).toFixed(1)
                  : 0}
                %
              </strong>
            </div>

            {/* Severity Indicator */}
            {((tooltipData.bin.x0 ?? 0) + (tooltipData.bin.x1 ?? 0)) / 2 >= 75 ? (
              <div className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Critical Outbreak Danger Zone (Immediate Transfer)</span>
              </div>
            ) : ((tooltipData.bin.x0 ?? 0) + (tooltipData.bin.x1 ?? 0)) / 2 >= 40 ? (
              <div className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                <Info className="w-3 h-3" />
                <span>Consultation Threshold (Tele-MO Review)</span>
              </div>
            ) : (
              <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Routine Primary Care Level</span>
              </div>
            )}

            <div className="text-[10px] text-slate-400 italic pt-0.5">
              Click bar to view matching clinical cases below
            </div>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------
          Selected Bin Drill-down Patient Inspector
          -------------------------------------------------------------------- */}
      {selectedBinRange && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
                Patients in Selected Score Bracket ({selectedBinRange[0]} – {selectedBinRange[1]})
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-200 text-blue-900 font-bold">
                {selectedBinPatients.length} Records Found
              </span>
            </div>

            <button
              onClick={() => setSelectedBinRange(null)}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 underline"
            >
              Clear Filter
            </button>
          </div>

          {selectedBinPatients.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No patients recorded in this score interval.</p>
          ) : (
            <div className="divide-y divide-blue-200/60 max-h-56 overflow-y-auto rounded-lg bg-white border border-blue-100">
              {selectedBinPatients.map((p) => {
                const isUrgent = p.riskScore >= 75;
                const isConsult = p.riskScore >= 40 && p.riskScore < 75;

                return (
                  <div
                    key={p.id}
                    className="p-2.5 sm:p-3 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 truncate">{p.patientName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {p.age}y • {p.gender}
                        </span>
                        {p.isLiveCase && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-green-100 text-green-800 border border-green-200">
                            LIVE INTAKE
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {p.village} ({p.block})
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="font-medium text-slate-700 truncate">{p.diagnosis}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        {p.vitalsSummary}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span
                          className={`text-sm font-black font-mono px-2 py-0.5 rounded-lg border ${
                            isUrgent
                              ? "bg-red-50 text-red-700 border-red-200"
                              : isConsult
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {p.riskScore}
                        </span>
                        <span className="text-[9px] block text-slate-400 uppercase font-mono mt-0.5">
                          Triage Score
                        </span>
                      </div>

                      {p.isLiveCase && (
                        <div className="flex items-center gap-1.5">
                          {onOpenPdfReport && (
                            <button
                              type="button"
                              onClick={() => {
                                const found = cases.find((c) => c.id === p.id);
                                if (found) onOpenPdfReport(found);
                              }}
                              className="px-2 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                              title="Generate and inspect PDF for this patient"
                            >
                              <FileText className="w-3 h-3 text-cyan-700" />
                              <span>PDF</span>
                            </button>
                          )}
                          {onSelectCase && (
                            <button
                              type="button"
                              onClick={() => {
                                const found = cases.find((c) => c.id === p.id);
                                if (found) onSelectCase(found);
                              }}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 cursor-pointer"
                              title="Open Case Dossier"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------
          Footer Clinical Guidelines & Legend
          -------------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700">Epidemiological Zone Tiers:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span>0-39: Stable Routine Sub-center</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            <span>40-74: Medical Officer Tele-Review</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
            <span>75-100: Emergency ICU / Outbreak Threat</span>
          </div>
        </div>

        <div className="font-mono text-[10px] text-slate-400">
          Source: Integrated Disease Surveillance Programme (IDSP) & ArogyaSeva Clinical Telemetry
        </div>
      </div>
    </div>
  );
};
