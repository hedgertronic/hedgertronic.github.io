/**
 * Evolution page chart and arsenal table rendering.
 * Covers: movement chart, arsenal table, pitch aggregation utilities.
 */

import { createElement } from "./dom.js";

export const SVG_NS = "http://www.w3.org/2000/svg";

export const PITCH_CONFIG = {
  Sinker: { display: "Sinker", class: "pitch-sinker", color: "#fb923c" },
  "Four-Seam": { display: "4-Seam", class: "pitch-four-seam", color: "#60a5fa" },
  Cutter: { display: "Cutter", class: "pitch-cutter", color: "#a78bfa" },
  Slider: { display: "Slider", class: "pitch-slider", color: "#14b8a6" },
  Curveball: { display: "Curve", class: "pitch-curveball", color: "#34d399" },
  Changeup: { display: "Change", class: "pitch-changeup", color: "#f472b6" },
  Splitter: { display: "Split", class: "pitch-splitter", color: "#fbbf24" },
};

export const PITCH_ORDER = [
  "Sinker",
  "Four-Seam",
  "Cutter",
  "Slider",
  "Curveball",
  "Changeup",
  "Splitter",
];

export function createSVGElement(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => {
    el.setAttribute(key, value);
  });
  return el;
}

function tiltToMinutes(tilt) {
  if (!tilt || tilt === "") return null;
  const match = tilt.match(/(\d+):(\d+)/);
  if (!match) return null;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

function minutesToTilt(minutes) {
  const hours = Math.floor(minutes / 60) % 12;
  const mins = Math.round(minutes % 60);
  const roundedMins = Math.round(mins / 15) * 15;
  const displayMins = roundedMins === 60 ? 0 : roundedMins;
  const displayHours = roundedMins === 60 ? (hours + 1) % 12 : hours;
  return `${displayHours || 12}:${displayMins.toString().padStart(2, "0")}`;
}

function average(arr) {
  const valid = arr.filter((v) => v !== null && !isNaN(v));
  if (valid.length === 0) return null;
  return valid.reduce((sum, v) => sum + v, 0) / valid.length;
}

export function aggregateByPitchType(allPitches) {
  const byType = {};

  allPitches.forEach((pitch) => {
    const type = pitch.TaggedPitchType;
    if (!type || type === "") return;

    if (!byType[type]) {
      byType[type] = {
        count: 0,
        velo: [],
        spin: [],
        ivb: [],
        hb: [],
        tiltMinutes: [],
        relHeight: [],
        relSide: [],
        vaa: [],
        haa: [],
      };
    }

    byType[type].count++;

    const velo = parseFloat(pitch.RelSpeed);
    if (!isNaN(velo)) byType[type].velo.push(velo);

    const spin = parseFloat(pitch.SpinRate);
    if (!isNaN(spin)) byType[type].spin.push(spin);

    const ivb = parseFloat(pitch.InducedVertBreak);
    if (!isNaN(ivb)) byType[type].ivb.push(ivb);

    const hb = parseFloat(pitch.HorzBreak);
    if (!isNaN(hb)) byType[type].hb.push(hb);

    const tiltMins = tiltToMinutes(pitch.Tilt);
    if (tiltMins !== null) byType[type].tiltMinutes.push(tiltMins);

    const relHeight = parseFloat(pitch.RelHeight);
    if (!isNaN(relHeight)) byType[type].relHeight.push(relHeight);

    const relSide = parseFloat(pitch.RelSide);
    if (!isNaN(relSide)) byType[type].relSide.push(relSide);

    const vaa = parseFloat(pitch.VertApprAngle);
    if (!isNaN(vaa)) byType[type].vaa.push(vaa);

    const haa = parseFloat(pitch.HorzApprAngle);
    if (!isNaN(haa)) byType[type].haa.push(haa);
  });

  const summary = {};
  for (const type of Object.keys(byType)) {
    const data = byType[type];
    summary[type] = {
      count: data.count,
      velo: average(data.velo),
      maxVelo: data.velo.length > 0 ? Math.max(...data.velo) : null,
      spin: average(data.spin),
      ivb: average(data.ivb),
      hb: average(data.hb),
      tilt:
        data.tiltMinutes.length > 0
          ? minutesToTilt(average(data.tiltMinutes))
          : null,
      relHeight: average(data.relHeight),
      relSide: average(data.relSide),
      vaa: average(data.vaa),
      haa: average(data.haa),
    };
  }

  return summary;
}

export function formatStat(value, decimals = 1) {
  if (value === null || value === undefined) return "—";
  return value.toFixed(decimals);
}

export function buildMovementChart(allPitches, container) {
  if (!container) return;

  const size = 265;
  const center = size / 2;
  const maxBreak = 24;
  const scale = (center - 18) / maxBreak;

  const svg = createSVGElement("svg", {
    viewBox: `0 0 ${size} ${size}`,
    width: size,
    height: size,
  });

  svg.appendChild(
    createSVGElement("circle", {
      cx: center,
      cy: center,
      r: center - 8,
      fill: "var(--bg-card)",
      stroke: "var(--border-color)",
      "stroke-width": 1,
    })
  );

  const gridRadii = [6, 12, 18, 24];
  gridRadii.forEach((r) => {
    svg.appendChild(
      createSVGElement("circle", {
        cx: center,
        cy: center,
        r: r * scale,
        fill: "none",
        stroke: "var(--border-color)",
        "stroke-width": 1,
        "stroke-dasharray": r === 24 ? "none" : "4,4",
        opacity: 0.5,
      })
    );
  });

  svg.appendChild(
    createSVGElement("line", {
      x1: center,
      y1: center - maxBreak * scale - 10,
      x2: center,
      y2: center + maxBreak * scale + 10,
      stroke: "var(--border-color)",
      "stroke-width": 1,
    })
  );

  svg.appendChild(
    createSVGElement("line", {
      x1: center - maxBreak * scale - 10,
      y1: center,
      x2: center + maxBreak * scale + 10,
      y2: center,
      stroke: "var(--border-color)",
      "stroke-width": 1,
    })
  );

  const labelStyle = {
    "font-family": "var(--font-mono)",
    "font-size": "8px",
    fill: "var(--text-muted)",
    "text-anchor": "middle",
  };

  [12, 24].forEach((val) => {
    const topLabel = createSVGElement("text", {
      x: center + 8,
      y: center - val * scale + 3,
      ...labelStyle,
      "text-anchor": "start",
    });
    topLabel.textContent = `${val}`;
    svg.appendChild(topLabel);

    const bottomLabel = createSVGElement("text", {
      x: center + 8,
      y: center + val * scale + 3,
      ...labelStyle,
      "text-anchor": "start",
    });
    bottomLabel.textContent = `${val}`;
    svg.appendChild(bottomLabel);
  });

  [12, 24].forEach((val) => {
    const rightLabel = createSVGElement("text", {
      x: center + val * scale,
      y: center - 6,
      ...labelStyle,
    });
    rightLabel.textContent = `${val}`;
    svg.appendChild(rightLabel);

    const leftLabel = createSVGElement("text", {
      x: center - val * scale,
      y: center - 6,
      ...labelStyle,
    });
    leftLabel.textContent = `${val}`;
    svg.appendChild(leftLabel);
  });

  const pitchesByType = {};
  allPitches.forEach((pitch) => {
    const type = pitch.TaggedPitchType;
    if (!type) return;
    if (!pitchesByType[type]) pitchesByType[type] = [];
    pitchesByType[type].push(pitch);
  });

  const typesToPlot = [...PITCH_ORDER].reverse();
  Object.keys(pitchesByType).forEach((type) => {
    if (!typesToPlot.includes(type)) {
      typesToPlot.unshift(type);
    }
  });

  const tooltip = createElement("div", { className: "movement-chart-tooltip" });
  tooltip.style.cssText = "position: absolute; display: none; pointer-events: none;";
  container.style.position = "relative";

  typesToPlot.forEach((type) => {
    const pitches = pitchesByType[type];
    if (!pitches) return;

    const config = PITCH_CONFIG[type] || { color: "#94a3b8", display: type };

    pitches.forEach((pitch) => {
      const hb = parseFloat(pitch.HorzBreak);
      const ivb = parseFloat(pitch.InducedVertBreak);

      if (isNaN(hb) || isNaN(ivb)) return;

      const x = center + hb * scale;
      const y = center - ivb * scale;

      const dot = createSVGElement("circle", {
        cx: x,
        cy: y,
        r: 4,
        fill: config.color,
        opacity: 0.85,
        stroke: "rgba(0,0,0,0.3)",
        "stroke-width": 0.5,
        style: "cursor: pointer; transition: r 0.15s ease, opacity 0.15s ease;",
      });

      const velo = parseFloat(pitch.RelSpeed);
      const relH = parseFloat(pitch.RelHeight);
      const relS = parseFloat(pitch.RelSide);

      const showTooltip = () => {
        dot.setAttribute("r", "6");
        dot.setAttribute("opacity", "1");

        tooltip.style.display = "block";
        tooltip.style.backgroundColor = "var(--bg-card)";
        tooltip.style.border = "1px solid var(--border-color)";
        tooltip.style.borderRadius = "var(--radius-sm)";
        tooltip.style.padding = "0.5rem 0.75rem";
        tooltip.style.fontSize = "0.75rem";
        tooltip.style.fontFamily = "var(--font-mono)";
        tooltip.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
        tooltip.style.zIndex = "10";
        tooltip.style.whiteSpace = "nowrap";

        const veloStr = !isNaN(velo) ? velo.toFixed(1) : "-";
        const hbStr = hb.toFixed(1);
        const ivbStr = ivb.toFixed(1);
        const relHStr = !isNaN(relH) ? relH.toFixed(2) : "-";
        const relSStr = !isNaN(relS) ? relS.toFixed(2) : "-";

        tooltip.textContent = "";

        const titleSpan = document.createElement("div");
        titleSpan.style.cssText =
          "font-weight: 600; color: " + config.color + "; margin-bottom: 0.25rem;";
        titleSpan.textContent = config.display;
        tooltip.appendChild(titleSpan);

        const createStatLine = (label, value, unit) => {
          const line = document.createElement("div");
          line.style.color = "var(--text-secondary)";
          line.appendChild(document.createTextNode(label + ": "));
          const valSpan = document.createElement("span");
          valSpan.style.color = "var(--text-primary)";
          valSpan.textContent = value;
          line.appendChild(valSpan);
          line.appendChild(document.createTextNode(unit));
          return line;
        };

        const statsDiv = document.createElement("div");
        statsDiv.style.cssText = "color: var(--text-secondary); line-height: 1.4;";

        statsDiv.appendChild(createStatLine("Velo", veloStr, " mph"));

        const moveLine = document.createElement("div");
        moveLine.style.color = "var(--text-secondary)";
        moveLine.appendChild(document.createTextNode("IVB: "));
        const ivbSpan = document.createElement("span");
        ivbSpan.style.color = "var(--text-primary)";
        ivbSpan.textContent = ivbStr + '"';
        moveLine.appendChild(ivbSpan);
        moveLine.appendChild(document.createTextNode(" | HB: "));
        const hbSpan = document.createElement("span");
        hbSpan.style.color = "var(--text-primary)";
        hbSpan.textContent = hbStr + '"';
        moveLine.appendChild(hbSpan);
        statsDiv.appendChild(moveLine);

        const relLine = document.createElement("div");
        relLine.style.color = "var(--text-secondary)";
        relLine.appendChild(document.createTextNode("Rel: "));
        const relHSpan = document.createElement("span");
        relHSpan.style.color = "var(--text-primary)";
        relHSpan.textContent = relHStr;
        relLine.appendChild(relHSpan);
        relLine.appendChild(document.createTextNode(" ft / "));
        const relSSpan = document.createElement("span");
        relSSpan.style.color = "var(--text-primary)";
        relSSpan.textContent = relSStr;
        relLine.appendChild(relSSpan);
        relLine.appendChild(document.createTextNode(" ft"));
        statsDiv.appendChild(relLine);

        tooltip.appendChild(statsDiv);

        const rect = svg.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const dotX = (x / size) * rect.width;
        const dotY = (y / size) * rect.height;

        tooltip.style.left = "0px";
        tooltip.style.top = "0px";
        const tooltipWidth = tooltip.offsetWidth;

        const rightEdge = dotX + 12 + tooltipWidth;
        const containerWidth = containerRect.width;

        if (rightEdge > containerWidth) {
          tooltip.style.left = Math.max(0, dotX - tooltipWidth - 12) + "px";
        } else {
          tooltip.style.left = dotX + 12 + "px";
        }

        const topPos = dotY - 10;
        if (topPos < 0) {
          tooltip.style.top = dotY + 20 + "px";
        } else {
          tooltip.style.top = topPos + "px";
        }
      };

      const hideTooltip = () => {
        dot.setAttribute("r", "4");
        dot.setAttribute("opacity", "0.85");
        tooltip.style.display = "none";
      };

      dot.addEventListener("mouseenter", showTooltip);
      dot.addEventListener("mouseleave", hideTooltip);
      dot.addEventListener("touchstart", (e) => {
        e.preventDefault();
        showTooltip();
        setTimeout(hideTooltip, 2000);
      });

      svg.appendChild(dot);
    });
  });

  container.appendChild(svg);
  container.appendChild(tooltip);
}

export function buildArsenalTable(summary, container) {
  if (!container) return;

  const table = createElement("table", { className: "stats-table" });

  const thead = createElement("thead");
  const headerRow = createElement("tr");
  const headers = [
    "Pitch", "Velo", "Max", "Spin", "IVB", "HB", "Tilt", "REL HT", "REL SD", "VAA", "HAA",
  ];

  headers.forEach((header) => {
    headerRow.appendChild(createElement("th", { textContent: header }));
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = createElement("tbody");
  const sortedTypes = PITCH_ORDER.filter((type) => summary[type]);

  Object.keys(summary).forEach((type) => {
    if (!sortedTypes.includes(type)) {
      sortedTypes.push(type);
    }
  });

  sortedTypes.forEach((type) => {
    const data = summary[type];
    const config = PITCH_CONFIG[type] || { display: type, class: "pitch-default" };

    const row = createElement("tr");

    const pitchCell = createElement("td");
    pitchCell.appendChild(createElement("span", {
      className: `pitch-badge ${config.class}`,
      textContent: config.display,
    }));
    row.appendChild(pitchCell);

    row.appendChild(createElement("td", { textContent: formatStat(data.velo, 1) }));
    row.appendChild(createElement("td", { textContent: formatStat(data.maxVelo, 1) }));
    row.appendChild(createElement("td", { textContent: formatStat(data.spin, 0) }));
    row.appendChild(createElement("td", { textContent: formatStat(data.ivb, 1) }));
    row.appendChild(createElement("td", { textContent: formatStat(data.hb, 1) }));
    row.appendChild(createElement("td", { textContent: data.tilt || "—" }));
    row.appendChild(createElement("td", { textContent: formatStat(data.relHeight, 1) }));
    row.appendChild(createElement("td", { textContent: formatStat(data.relSide, 1) }));
    row.appendChild(createElement("td", { textContent: formatStat(data.vaa, 1) }));
    row.appendChild(createElement("td", { textContent: formatStat(data.haa, 1) }));

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}
