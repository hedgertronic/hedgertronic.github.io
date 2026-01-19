/**
 * Evolution page components and rendering functions.
 */

import { createElement } from "./dom.js";
import { parseCSV } from "./data.js";
import { formatDate, sortByDate } from "./ui.js";
import { ICONS } from "./icons.js";

const SVG_NS = "http://www.w3.org/2000/svg";

const PITCH_CONFIG = {
  Sinker: { display: "Sinker", class: "pitch-sinker", color: "#fb923c" },
  "Four-Seam": { display: "4-Seam", class: "pitch-four-seam", color: "#60a5fa" },
  Cutter: { display: "Cutter", class: "pitch-cutter", color: "#a78bfa" },
  Slider: { display: "Slider", class: "pitch-slider", color: "#14b8a6" },
  Curveball: { display: "Curve", class: "pitch-curveball", color: "#34d399" },
  Changeup: { display: "Change", class: "pitch-changeup", color: "#f472b6" },
  Splitter: { display: "Split", class: "pitch-splitter", color: "#fbbf24" },
};

const PITCH_ORDER = [
  "Sinker",
  "Four-Seam",
  "Cutter",
  "Slider",
  "Curveball",
  "Changeup",
  "Splitter",
];

export async function loadEvolutionConfig() {
  const response = await fetch("/data/evolution.json");
  if (!response.ok) throw new Error("Failed to load evolution config");
  return response.json();
}

function createSVGElement(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => {
    el.setAttribute(key, value);
  });
  return el;
}

function getIconSVG(iconName) {
  const iconMap = {
    wrench: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
    baseball: ICONS.baseball,
  };
  return iconMap[iconName] || iconMap.wrench;
}

function createIconWrapper(iconName) {
  const wrapper = document.createElement("span");
  wrapper.className = "icon-wrapper";
  // Note: This uses trusted owner-controlled icon data, not user input
  wrapper.innerHTML = getIconSVG(iconName);
  return wrapper;
}

export function createScrollArrow(targetSectionId) {
  const scrollArrow = createElement("a", {
    className: "scroll-down-arrow",
    href: `#${targetSectionId}`,
  });
  const arrowSvg = createSVGElement("svg", {
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  });
  arrowSvg.appendChild(createSVGElement("path", { d: "M12 5v14" }));
  arrowSvg.appendChild(createSVGElement("path", { d: "m19 12-7 7-7-7" }));
  scrollArrow.appendChild(arrowSvg);

  return scrollArrow;
}

export function renderEvolutionHeroNav(heroNav, sections) {
  sections.forEach((section) => {
    const navLink = createElement("a", {
      href: `#${section.id}`,
      className: "hero-nav-item",
    });
    navLink.dataset.section = section.id;
    navLink.style.setProperty(
      "--section-accent",
      section.accentColor || "#f97316"
    );

    if (section.icon) {
      const iconDiv = createElement("div", { className: "hero-nav-icon" });
      iconDiv.appendChild(createIconWrapper(section.icon));
      navLink.appendChild(iconDiv);
    }

    const textDiv = createElement("div", { className: "hero-nav-text" });
    textDiv.appendChild(
      createElement("span", {
        className: "hero-nav-label",
        textContent: section.title,
      })
    );

    if (section.subtitle) {
      textDiv.appendChild(
        createElement("span", {
          className: "hero-nav-subtitle",
          textContent: section.subtitle,
        })
      );
    }

    navLink.appendChild(textDiv);
    navLink.appendChild(
      createElement("span", {
        className: "hero-nav-arrow",
        textContent: "\u2193",
      })
    );

    heroNav.appendChild(navLink);
  });
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

function aggregateByPitchType(allPitches) {
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

function formatStat(value, decimals = 1) {
  if (value === null || value === undefined) return "\u2014";
  return value.toFixed(decimals);
}

function buildMovementChart(allPitches, container) {
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

function buildArsenalTable(summary, container) {
  if (!container) return;

  const table = createElement("table", { className: "stats-table" });

  const thead = createElement("thead");
  const headerRow = createElement("tr");
  const headers = [
    "Pitch",
    "Velo",
    "Spin",
    "IVB",
    "HB",
    "Tilt",
    "REL HT",
    "REL SD",
    "VAA",
    "HAA",
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
    const badge = createElement("span", {
      className: `pitch-badge ${config.class}`,
      textContent: config.display,
    });
    pitchCell.appendChild(badge);
    row.appendChild(pitchCell);

    row.appendChild(createElement("td", { textContent: formatStat(data.velo, 1) }));
    row.appendChild(createElement("td", { textContent: formatStat(data.spin, 0) }));
    row.appendChild(createElement("td", { textContent: formatStat(data.ivb, 1) }));
    row.appendChild(createElement("td", { textContent: formatStat(data.hb, 1) }));
    row.appendChild(createElement("td", { textContent: data.tilt || "\u2014" }));
    row.appendChild(
      createElement("td", { textContent: formatStat(data.relHeight, 1) })
    );
    row.appendChild(
      createElement("td", { textContent: formatStat(data.relSide, 1) })
    );
    row.appendChild(createElement("td", { textContent: formatStat(data.vaa, 1) }));
    row.appendChild(createElement("td", { textContent: formatStat(data.haa, 1) }));

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}

function renderLeaderboardCard(leaderboard) {
  const card = createElement("div", { className: "leaderboard-card" });

  const header = createElement("div", { className: "leaderboard-header" });
  header.appendChild(createElement("h4", { textContent: leaderboard.title }));
  header.appendChild(
    createElement("span", {
      className: "leaderboard-unit",
      textContent: leaderboard.unit,
    })
  );
  card.appendChild(header);

  const listClass = leaderboard.hideRanks ? "leaderboard-list no-ranks" : "leaderboard-list";
  const list = createElement("ol", { className: listClass });

  leaderboard.entries.forEach((entry) => {
    const itemClass = entry.highlight
      ? "leaderboard-item leaderboard-highlight"
      : "leaderboard-item";
    const item = createElement("li", { className: itemClass });

    if (!leaderboard.hideRanks && entry.rank) {
      item.appendChild(
        createElement("span", {
          className: "leaderboard-rank",
          textContent: entry.rank,
        })
      );
    }
    item.appendChild(
      createElement("span", { className: "leaderboard-name", textContent: entry.name })
    );

    if (entry.pitch) {
      item.appendChild(
        createElement("span", {
          className: `leaderboard-pitch ${entry.pitchClass || ""}`,
          textContent: entry.pitch,
        })
      );
    }

    item.appendChild(
      createElement("span", {
        className: "leaderboard-value",
        textContent: entry.value,
      })
    );

    list.appendChild(item);
  });

  card.appendChild(list);
  return card;
}

async function renderArsenalSubsection(subsection, container) {
  const subsectionDiv = createElement("div", { className: "subsection" });

  const header = createElement("div", { className: "subsection-header" });
  header.appendChild(createElement("h3", { textContent: subsection.title }));

  if (subsection.viewAllUrl) {
    const link = createElement("a", {
      href: subsection.viewAllUrl,
      className: "view-all-link",
      textContent: subsection.viewAllLabel || "View All",
      target: "_blank",
    });
    header.appendChild(link);
  }

  subsectionDiv.appendChild(header);

  if (subsection.description) {
    const description = createElement("p", {
      className: "subsection-description",
      textContent: subsection.description,
    });
    subsectionDiv.appendChild(description);
  }

  const grid = createElement("div", { className: "evolution-grid" });

  const tableWrapper = createElement("div", {
    className: "stats-table-wrapper",
    id: "arsenal-summary",
  });
  grid.appendChild(tableWrapper);

  const chartContainer = createElement("div", {
    className: "movement-chart-container",
  });
  const chart = createElement("div", {
    className: "movement-chart",
    id: "movement-chart",
  });
  chartContainer.appendChild(chart);
  grid.appendChild(chartContainer);

  subsectionDiv.appendChild(grid);
  container.appendChild(subsectionDiv);

  try {
    const response = await fetch("/" + subsection.dataFile);
    if (!response.ok) throw new Error("Failed to load data");

    const text = await response.text();
    const pitches = parseCSVWithQuotes(text);

    if (pitches.length > 0) {
      buildMovementChart(pitches, chart);
      const summary = aggregateByPitchType(pitches);
      buildArsenalTable(summary, tableWrapper);
    }
  } catch (error) {
    console.error("Error loading arsenal data:", error);
    tableWrapper.textContent = "Failed to load arsenal data";
  }
}

function parseCSVWithQuotes(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx];
      });
      rows.push(row);
    }
  }
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function renderLeaderboardsSubsection(subsection, container) {
  const subsectionDiv = createElement("div", { className: "subsection" });

  const header = createElement("div", { className: "subsection-header" });
  header.appendChild(createElement("h3", { textContent: subsection.title }));
  subsectionDiv.appendChild(header);

  const grid = createElement("div", {
    className: "content-grid leaderboard-grid",
  });
  subsectionDiv.appendChild(grid);
  container.appendChild(subsectionDiv);

  try {
    const response = await fetch("/" + subsection.dataFile);
    if (!response.ok) throw new Error("Failed to load leaderboards");

    const leaderboards = await response.json();

    leaderboards.forEach((leaderboard) => {
      grid.appendChild(renderLeaderboardCard(leaderboard));
    });
  } catch (error) {
    console.error("Error loading leaderboards:", error);
    grid.textContent = "Failed to load leaderboards";
  }
}

function renderVideosSubsection(subsection, container) {
  const subsectionDiv = createElement("div", { className: "subsection" });

  const header = createElement("div", { className: "subsection-header" });
  header.appendChild(createElement("h3", { textContent: subsection.title }));
  subsectionDiv.appendChild(header);

  const grid = createElement("div", { className: "video-grid" });

  subsection.videos.forEach((video) => {
    const videoCard = createElement("div", {
      className: video.vertical ? "video-card video-card--vertical" : "video-card",
    });

    const videoWrapper = createElement("div", { className: "video-wrapper" });

    const iframe = createElement("iframe");
    if (video.vimeoId) {
      iframe.src = `https://player.vimeo.com/video/${video.vimeoId}?loop=1`;
    } else if (video.youtubeId) {
      iframe.src = `https://www.youtube.com/embed/${video.youtubeId}?loop=1`;
    }
    iframe.setAttribute("title", video.title || "");
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute(
      "allow",
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
    );
    iframe.setAttribute("allowfullscreen", "");

    videoWrapper.appendChild(iframe);
    videoCard.appendChild(videoWrapper);

    if (video.title) {
      const titleEl = createElement("p", {
        className: "video-title",
        textContent: video.title,
      });
      videoCard.appendChild(titleEl);
    }

    grid.appendChild(videoCard);
  });

  subsectionDiv.appendChild(grid);
  container.appendChild(subsectionDiv);
}

function renderPlaceholderSubsection(subsection, container) {
  const subsectionDiv = createElement("div", { className: "subsection" });

  const header = createElement("div", { className: "subsection-header" });
  header.appendChild(createElement("h3", { textContent: subsection.title }));
  subsectionDiv.appendChild(header);

  const placeholder = createElement("div", { className: "subsection-placeholder" });
  placeholder.appendChild(
    createElement("p", { textContent: subsection.placeholderText })
  );
  subsectionDiv.appendChild(placeholder);

  container.appendChild(subsectionDiv);
}

async function renderStatsSubsection(subsection, container) {
  const subsectionDiv = createElement("div", { className: "subsection" });

  const header = createElement("div", { className: "subsection-header" });
  header.appendChild(createElement("h3", { textContent: subsection.title }));

  const statsLinkConfig = {
    Minors: subsection.statsLinks?.find((l) => l.name === "MiLB"),
    College: subsection.statsLinks?.find((l) => l.name === "BBRef"),
    Independent: subsection.statsLinks?.find((l) => l.name === "BBRef"),
  };

  const viewStatsLink = createElement("a", {
    href: statsLinkConfig.Minors?.url || "#",
    className: "view-all-link",
    textContent: "View MiLB",
    target: "_blank",
  });
  header.appendChild(viewStatsLink);
  subsectionDiv.appendChild(header);

  try {
    const response = await fetch("/" + subsection.statsFile);
    if (!response.ok) throw new Error("Failed to load stats");

    const csvText = await response.text();
    const statsData = parseCSV(csvText);

    const careerRows = {
      College: statsData.find((row) => row.Season === "College Career"),
      Independent: statsData.find((row) => row.Season === "Independent Career"),
      Minors: statsData.find((row) => row.Season === "Minors Career"),
    };

    const seasonRows = statsData.filter(
      (row) => /^\d{4}$/.test(row.Season) && /\d+\s*teams?$/i.test(row.Team)
    );

    const levelClasses = {
      "Rk+": "level-roa",
      "A-": "level-a-short",
      "A+": "level-a-plus",
      AA: "level-aa",
      AAA: "level-aaa",
      NCAA: "level-ncaa",
      Independent: "level-independent",
    };

    const orgClasses = {
      Mets: "org-mets",
      Phillies: "org-phillies",
      "Johns Hopkins": "org-hopkins",
      Westside: "org-westside",
      Baltimore: "org-baltimore",
    };

    const orgDisplayNames = {
      Mets: "NYM",
      Phillies: "PHI",
      "Johns Hopkins": "JHU",
      Westside: "WWM",
      Baltimore: "Baltimore Dodgers",
    };

    const levelToCategory = {
      NCAA: "College",
      Independent: "Independent",
      "Rk+": "Minors",
      "A-": "Minors",
      "A+": "Minors",
      AA: "Minors",
      AAA: "Minors",
    };

    const seasonCategoryLevels = {};
    statsData.forEach((row) => {
      if (/^\d{4}$/.test(row.Season) && !/\d+\s*teams?$/i.test(row.Team)) {
        const category = levelToCategory[row.Level] || row.Level;
        const key = `${row.Season}-${category}`;
        if (!seasonCategoryLevels[key]) {
          seasonCategoryLevels[key] = [];
        }
        if (!seasonCategoryLevels[key].includes(row.Level)) {
          seasonCategoryLevels[key].push(row.Level);
        }
      }
    });

    const categoryYears = {};
    seasonRows.forEach((row) => {
      const category = row.Level;
      const year = parseInt(row.Season, 10);
      if (!categoryYears[category]) {
        categoryYears[category] = [];
      }
      categoryYears[category].push(year);
    });

    const getCategoryYearRange = (category) => {
      const years = categoryYears[category] || [];
      if (years.length === 0) return "";
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      if (minYear === maxYear) return `${minYear}`;
      return `${minYear}-${String(maxYear).slice(-2)}`;
    };

    const categorySelector = createElement("div", {
      className: "stats-category-selector",
    });
    const categoryOrder = ["College", "Independent", "Minors"];
    categoryOrder.forEach((category) => {
      const btn = createElement("button", {
        className: `stats-category-btn${category === "Minors" ? " active" : ""}`,
      });
      btn.dataset.category = category;

      btn.appendChild(
        createElement("span", {
          className: "stats-category-name",
          textContent: category,
        })
      );
      btn.appendChild(
        createElement("span", {
          className: "stats-category-years",
          textContent: getCategoryYearRange(category),
        })
      );
      categorySelector.appendChild(btn);
    });
    subsectionDiv.appendChild(categorySelector);

    const categoryLeagues = {
      College: { name: "NCAA D3", className: "league-ncaa" },
      Independent: { name: "USPBL", className: "league-independent" },
    };

    const tableWrapper = createElement("div", { className: "stats-table-wrapper" });
    const table = createElement("table", { className: "stats-table" });

    const thead = createElement("thead");
    const headerRow = createElement("tr");
    const headers = [
      "Year",
      "Org",
      "Levels",
      "W",
      "L",
      "ERA",
      "G",
      "SV",
      "IP",
      "H",
      "SO",
      "BB",
      "WHIP",
    ];
    headers.forEach((h) => {
      const th = createElement("th", { textContent: h });
      if (h === "Org") th.dataset.column = "team";
      if (h === "Levels") th.dataset.column = "levels";
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = createElement("tbody");
    seasonRows.forEach((row) => {
      const tr = createElement("tr");
      const category = row.Level;
      tr.dataset.category = category;
      if (category !== "Minors") {
        tr.style.display = "none";
      }
      tr.appendChild(createElement("td", { textContent: row.Season }));

      const teamCell = createElement("td");
      if (row.Org && row.Org !== "-") {
        const displayName = orgDisplayNames[row.Org] || row.Org;
        const teamBadge = createElement("span", {
          className: `org-badge ${orgClasses[row.Org] || ""}`,
          textContent: displayName,
        });
        teamCell.appendChild(teamBadge);
      }
      tr.appendChild(teamCell);

      const levelsCell = createElement("td");
      if (category === "Minors") {
        const levelKey = `${row.Season}-${category}`;
        (seasonCategoryLevels[levelKey] || []).forEach((level) => {
          const badge = createElement("span", {
            className: `level-badge ${levelClasses[level] || ""}`,
            textContent: level,
          });
          levelsCell.appendChild(badge);
          levelsCell.appendChild(document.createTextNode(" "));
        });
      } else {
        const leagueInfo = categoryLeagues[category];
        if (leagueInfo) {
          levelsCell.appendChild(
            createElement("span", {
              className: `league-badge ${leagueInfo.className}`,
              textContent: leagueInfo.name,
            })
          );
        }
      }
      tr.appendChild(levelsCell);

      ["W", "L", "ERA", "G", "SV", "IP", "H", "SO", "BB", "WHIP"].forEach((col) => {
        let value = row[col];
        if (col === "SV" && (value === "-" || value === "")) {
          value = "0";
        }
        tr.appendChild(createElement("td", { textContent: value }));
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    const tfoot = createElement("tfoot");
    categoryOrder.forEach((category) => {
      const careerRow = careerRows[category];
      if (!careerRow) return;

      const footerRow = createElement("tr");
      footerRow.dataset.category = category;
      if (category !== "Minors") {
        footerRow.style.display = "none";
      }

      footerRow.appendChild(createElement("td"));
      footerRow.appendChild(createElement("td"));
      footerRow.appendChild(createElement("td"));

      ["W", "L", "ERA", "G", "SV", "IP", "H", "SO", "BB", "WHIP"].forEach((col) => {
        let value = careerRow?.[col] || "-";
        if (col === "SV" && (value === "-" || value === "")) {
          value = "0";
        }
        const cell = createElement("td");
        cell.appendChild(createElement("strong", { textContent: value }));
        footerRow.appendChild(cell);
      });
      tfoot.appendChild(footerRow);
    });
    table.appendChild(tfoot);
    tableWrapper.appendChild(table);
    subsectionDiv.appendChild(tableWrapper);

    categorySelector.addEventListener("click", (e) => {
      const btn = e.target.closest(".stats-category-btn");
      if (!btn) return;

      const selectedCategory = btn.dataset.category;

      categorySelector.querySelectorAll(".stats-category-btn").forEach((b) => {
        b.classList.toggle("active", b === btn);
      });

      const teamHeader = thead.querySelector('th[data-column="team"]');
      const levelsHeader = thead.querySelector('th[data-column="levels"]');
      if (teamHeader) {
        teamHeader.textContent = selectedCategory === "Minors" ? "Org" : "Team";
      }
      if (levelsHeader) {
        levelsHeader.textContent =
          selectedCategory === "Minors" ? "Levels" : "League";
      }

      const linkConfig = statsLinkConfig[selectedCategory];
      if (linkConfig) {
        viewStatsLink.href = linkConfig.url;
        viewStatsLink.textContent =
          selectedCategory === "Minors" ? "View MiLB" : "View BBRef";
      }

      tbody.querySelectorAll("tr").forEach((row) => {
        row.style.display = row.dataset.category === selectedCategory ? "" : "none";
      });

      tfoot.querySelectorAll("tr").forEach((row) => {
        row.style.display = row.dataset.category === selectedCategory ? "" : "none";
      });
    });
  } catch (error) {
    console.error("Error loading stats data:", error);
    subsectionDiv.appendChild(
      createElement("p", { textContent: "Failed to load career stats" })
    );
  }

  container.appendChild(subsectionDiv);
}

function renderVideoProgressionSubsection(subsection, container) {
  const subsectionDiv = createElement("div", { className: "subsection" });

  const header = createElement("div", { className: "subsection-header" });
  header.appendChild(createElement("h3", { textContent: subsection.title }));
  subsectionDiv.appendChild(header);

  const videoGrid = createElement("div", {
    className: "content-grid video-progression-grid",
  });

  const metricKey = subsection.metricKey || "releaseHeight";
  const metricUnit = subsection.metricUnit || "ft";

  // Filter valid items for modal navigation (images or videos)
  const validItems = subsection.videos.filter(
    (v) => v.image || (v.vimeoId && !v.vimeoId.startsWith("PLACEHOLDER"))
  );

  // Create shared modal for all items
  let currentModalIndex = 0;
  const modalMedia = []; // Array of media elements (images or iframes)

  const modal = createElement("div", { className: "video-modal" });
  const backdrop = createElement("div", { className: "video-modal-backdrop" });
  const content = createElement("div", {
    className: "video-modal-content video-modal-content--progression",
  });

  const closeBtn = createElement("button", {
    className: "video-modal-close",
    textContent: "\u00D7",
  });

  // Modal label (year · height)
  const modalLabel = createElement("div", { className: "video-modal-label" });

  // Navigation and media container
  const modalBody = createElement("div", { className: "video-modal-body" });

  const prevBtn = createElement("button", {
    className: "video-modal-nav video-modal-nav--prev",
    textContent: "\u2039",
  });

  const modalWrapper = createElement("div", { className: "video-modal-wrapper" });

  const nextBtn = createElement("button", {
    className: "video-modal-nav video-modal-nav--next",
    textContent: "\u203A",
  });

  modalBody.appendChild(prevBtn);
  modalBody.appendChild(modalWrapper);
  modalBody.appendChild(nextBtn);

  // Modal description
  const modalDescription = createElement("p", { className: "video-modal-description" });

  // Append close button to wrapper so it's positioned on the media
  modalWrapper.appendChild(closeBtn);
  content.appendChild(modalLabel);
  content.appendChild(modalBody);
  content.appendChild(modalDescription);
  modal.appendChild(backdrop);
  modal.appendChild(content);

  const updateNavButtons = (index) => {
    prevBtn.style.display = index === 0 ? "none" : "flex";
    nextBtn.style.display = index === validItems.length - 1 ? "none" : "flex";
  };

  // Get or create media element for a specific index
  const getOrCreateMedia = (index) => {
    if (!modalMedia[index]) {
      const item = validItems[index];
      if (item.image) {
        const img = createElement("img", {
          src: item.image,
          alt: `${item.year} release height progression`,
        });
        img.style.cssText = "position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; display: none;";
        modalWrapper.appendChild(img);
        modalMedia[index] = { type: "image", element: img };
      } else {
        const iframe = createElement("iframe");
        iframe.src = `https://player.vimeo.com/video/${item.vimeoId}?loop=1&sidedock=0&title=0&byline=0&portrait=0&quality=auto`;
        iframe.setAttribute("frameborder", "0");
        iframe.setAttribute(
          "allow",
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        );
        iframe.setAttribute("allowfullscreen", "");
        iframe.style.display = "none";
        modalWrapper.appendChild(iframe);
        modalMedia[index] = { type: "video", element: iframe };
      }
    }
    return modalMedia[index];
  };

  const showMedia = (index) => {
    // Hide all media and pause videos
    modalMedia.forEach((media, i) => {
      if (media) {
        media.element.style.display = i === index ? "block" : "none";
        if (i !== index && media.type === "video") {
          media.element.contentWindow.postMessage(JSON.stringify({ method: "pause" }), "*");
        }
      }
    });

    // Show current media
    const media = getOrCreateMedia(index);
    media.element.style.display = "block";
    if (media.type === "video") {
      media.element.contentWindow.postMessage(JSON.stringify({ method: "play" }), "*");
    }
  };

  const updateModalContent = (index) => {
    currentModalIndex = index;
    const item = validItems[index];
    const metricValue = item[metricKey];

    // Update label
    modalLabel.textContent = "";
    modalLabel.appendChild(
      createElement("span", { className: "badge-year", textContent: item.year })
    );
    if (metricValue) {
      modalLabel.appendChild(
        createElement("span", { className: "badge-separator", textContent: " \u00B7 " })
      );
      modalLabel.appendChild(
        createElement("span", {
          className: "badge-height",
          textContent: `${metricValue} ${metricUnit}`,
        })
      );
    }

    // Update description
    modalDescription.textContent = item.description || "";
    modalDescription.style.display = item.description ? "block" : "none";

    // Show media
    showMedia(index);

    updateNavButtons(index);
  };

  const openModal = (index) => {
    currentModalIndex = index;
    getOrCreateMedia(index); // Ensure media exists
    updateModalContent(index);
    modal.classList.add("active");
    document.documentElement.classList.add("modal-open");
    document.body.classList.add("modal-open");
  };

  const closeModal = () => {
    modal.classList.remove("active");
    document.documentElement.classList.remove("modal-open");
    document.body.classList.remove("modal-open");
    // Pause video if current media is a video
    const currentMedia = modalMedia[currentModalIndex];
    if (currentMedia && currentMedia.type === "video") {
      currentMedia.element.contentWindow.postMessage(JSON.stringify({ method: "pause" }), "*");
    }
  };

  prevBtn.addEventListener("click", () => {
    if (currentModalIndex > 0) {
      updateModalContent(currentModalIndex - 1);
    }
  });

  nextBtn.addEventListener("click", () => {
    if (currentModalIndex < validItems.length - 1) {
      updateModalContent(currentModalIndex + 1);
    }
  });

  closeBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", closeModal);
  // Close when clicking on transparent content area (not children)
  content.addEventListener("click", (e) => {
    if (e.target === content || e.target === modalBody) {
      closeModal();
    }
  });

  const handleKeydown = (e) => {
    if (!modal.classList.contains("active")) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowLeft" && currentModalIndex > 0) {
      updateModalContent(currentModalIndex - 1);
    }
    if (e.key === "ArrowRight" && currentModalIndex < validItems.length - 1) {
      updateModalContent(currentModalIndex + 1);
    }
  };
  document.addEventListener("keydown", handleKeydown);

  document.body.appendChild(modal);

  // Create cards
  subsection.videos.forEach((video, index) => {
    const videoCard = createElement("div", { className: "video-progression-card" });

    const cardHeader = createElement("div", { className: "video-progression-header" });

    const badge = createElement("div", { className: "video-progression-badge" });
    badge.appendChild(
      createElement("span", {
        className: "badge-year",
        textContent: video.year,
      })
    );
    const metricValue = video[metricKey];
    if (metricValue) {
      badge.appendChild(
        createElement("span", {
          className: "badge-separator",
          textContent: "\u00B7",
        })
      );
      badge.appendChild(
        createElement("span", {
          className: "badge-height",
          textContent: `${metricValue} ${metricUnit}`,
        })
      );
    }
    cardHeader.appendChild(badge);
    videoCard.appendChild(cardHeader);

    const videoWrapper = createElement("div", {
      className: "video-progression-wrapper",
    });

    if (video.image) {
      const img = createElement("img", {
        src: video.image,
        alt: `${video.year} release height progression`,
        loading: "lazy",
      });
      img.style.cssText = "position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;";
      videoWrapper.appendChild(img);

      // Make clickable for modal
      videoWrapper.classList.add("clickable");
      const validIndex = validItems.findIndex((v) => v.image === video.image);
      videoWrapper.addEventListener("click", () => openModal(validIndex));
    } else if (video.vimeoId && !video.vimeoId.startsWith("PLACEHOLDER")) {
      const iframe = createElement("iframe");
      iframe.src = `https://player.vimeo.com/video/${video.vimeoId}?loop=1&muted=1&autopause=0&controls=0&title=0&byline=0&portrait=0`;
      iframe.setAttribute("frameborder", "0");
      iframe.setAttribute("allow", "autoplay; fullscreen; picture-in-picture");
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute("loading", "lazy");
      videoWrapper.appendChild(iframe);

      const playOverlay = createElement("div", {
        className: "video-progression-play-overlay",
      });
      const playIcon = createSVGElement("svg", {
        width: "40",
        height: "40",
        viewBox: "0 0 24 24",
        fill: "currentColor",
      });
      playIcon.appendChild(createSVGElement("path", { d: "M8 5v14l11-7z" }));
      playOverlay.appendChild(playIcon);
      videoWrapper.appendChild(playOverlay);

      videoWrapper.classList.add("clickable");

      // Find index in validItems array
      const validIndex = validItems.findIndex((v) => v.vimeoId === video.vimeoId);
      videoWrapper.addEventListener("click", () => openModal(validIndex));
    } else {
      const placeholder = createElement("div", { className: "video-placeholder" });
      placeholder.appendChild(
        createElement("span", { textContent: "Video coming soon" })
      );
      videoWrapper.appendChild(placeholder);
    }

    videoCard.appendChild(videoWrapper);

    if (video.description) {
      const descEl = createElement("p", {
        className: "video-progression-description",
        textContent: video.description,
      });
      videoCard.appendChild(descEl);
    }

    videoGrid.appendChild(videoCard);
  });

  subsectionDiv.appendChild(videoGrid);
  container.appendChild(subsectionDiv);
}

async function renderTrainingSubsection(subsection, container) {
  const subsectionDiv = createElement("div", { className: "subsection" });

  const header = createElement("div", { className: "subsection-header" });
  header.appendChild(createElement("h3", { textContent: subsection.title }));

  if (subsection.viewAllUrl) {
    const viewAllLink = createElement("a", {
      href: subsection.viewAllUrl,
      className: "view-all-link",
      textContent: subsection.viewAllLabel || "View All",
    });
    header.appendChild(viewAllLink);
  }
  subsectionDiv.appendChild(header);

  try {
    const response = await fetch("/" + subsection.dataFile);
    if (!response.ok) throw new Error("Failed to load training data");

    const trainingData = await response.json();

    if (trainingData && trainingData.length > 0) {
      const trainingGrid = createElement("div", { className: "content-grid" });

      const sortedData = trainingData.some((item) => item.order !== undefined)
        ? [...trainingData].sort((a, b) => (a.order || 0) - (b.order || 0))
        : sortByDate(trainingData);

      sortedData.forEach((item) => {
        if (item.type === "video") {
          const cardContainer = createElement("div", {
            className: "training-card-container",
          });

          if (item.label) {
            cardContainer.appendChild(
              createElement("div", {
                className: "training-card-label",
                textContent: item.label,
              })
            );
          }

          const cardLink = item.url
            ? createElement("a", {
                href: item.url,
                className: "training-card-link",
                target: "_blank",
                rel: "noopener noreferrer",
              })
            : null;

          const card = createElement("div", { className: "training-card" });

          if (item.poster) {
            const imgWrapper = createElement("div", {
              className: "training-bg-wrapper",
            });
            const posterSrc = item.poster.startsWith("/")
              ? item.poster
              : "/" + item.poster;
            const img = createElement("img", {
              src: posterSrc,
              alt: "Training video thumbnail",
              loading: "lazy",
            });
            img.onerror = () => {
              imgWrapper.remove();
              card.classList.add("no-poster");
            };
            imgWrapper.appendChild(img);
            card.appendChild(imgWrapper);

            const overlay = createElement("div", { className: "training-bg-overlay" });
            card.appendChild(overlay);
          }

          const cardHeader = createElement("div", { className: "training-header" });
          if (item.credit) {
            cardHeader.appendChild(
              createElement("div", {
                className: "training-handle",
                textContent: `@${item.credit.handle}`,
              })
            );
          }
          if (item.date) {
            cardHeader.appendChild(
              createElement("span", {
                className: "training-date",
                textContent: formatDate(item.date),
              })
            );
          }
          card.appendChild(cardHeader);

          const cardContent = createElement("div", {
            className: "training-card-content",
          });
          if (item.caption) {
            const captionEl = createElement("p", { className: "training-caption" });
            let captionText = item.caption;
            if (captionText.length > 280) {
              captionText = captionText.substring(0, 280).trim() + "...";
            }

            const parts = captionText.split(/(@\w+)/g);
            parts.forEach((part) => {
              if (part.startsWith("@")) {
                const mention = createElement("span", {
                  className: "training-mention",
                });
                mention.textContent = part;
                captionEl.appendChild(mention);
              } else {
                captionEl.appendChild(document.createTextNode(part));
              }
            });
            cardContent.appendChild(captionEl);
          }
          card.appendChild(cardContent);

          if (cardLink) {
            cardLink.appendChild(card);
            cardContainer.appendChild(cardLink);
          } else {
            cardContainer.appendChild(card);
          }
          trainingGrid.appendChild(cardContainer);
        }
      });

      subsectionDiv.appendChild(trainingGrid);
    }
  } catch (error) {
    console.error("Error loading training data:", error);
    subsectionDiv.appendChild(
      createElement("p", { textContent: "Failed to load training data" })
    );
  }

  container.appendChild(subsectionDiv);
}

export async function renderSection(section, container, index) {
  const sectionClasses = ["content-section"];
  if (index % 2 === 0) sectionClasses.push("alt-bg");
  if (section.heroSection) sectionClasses.push("hero-year-section");

  const sectionEl = createElement("section", {
    className: sectionClasses.join(" "),
    id: section.id,
  });

  if (section.accentColor) {
    sectionEl.style.setProperty("--section-color", section.accentColor);
    sectionEl.style.setProperty("--section-field", section.accentColor);
  }

  const containerDiv = createElement("div", { className: "container" });

  const sectionHeaderClass = section.centeredTitle
    ? "section-header section-header--centered"
    : "section-header";
  const sectionHeader = createElement("div", { className: sectionHeaderClass });

  if (section.icon) {
    const iconLink = createElement("a", {
      href: `#${section.id}`,
      className: "section-icon evolution-icon",
    });
    iconLink.appendChild(createIconWrapper(section.icon));
    sectionHeader.appendChild(iconLink);
  }

  const titleDiv = createElement("div");
  titleDiv.appendChild(createElement("h2", { textContent: section.title }));
  if (section.subtitle) {
    titleDiv.appendChild(
      createElement("p", {
        className: "section-subtitle",
        textContent: section.subtitle,
      })
    );
  }
  sectionHeader.appendChild(titleDiv);

  containerDiv.appendChild(sectionHeader);

  if (section.heroSection && section.heroVideo) {
    const showcase = createElement("div", { className: "hero-year-showcase" });

    // Left column: year title and description
    const leftColumn = createElement("div", { className: "hero-year-left" });

    const yearTitle = createElement("h2", {
      className: "hero-year-title",
      textContent: section.title,
    });
    yearTitle.dataset.year = section.title;
    leftColumn.appendChild(yearTitle);

    if (section.description) {
      leftColumn.appendChild(
        createElement("p", {
          className: "hero-year-description",
          textContent: section.description,
        })
      );
    }

    if (section.focusMetrics) {
      const metricsContainer = createElement("div", {
        className: "hero-focus-metrics",
      });

      // Group non-standalone metrics together (e.g., release height comparison)
      const groupedMetrics = section.focusMetrics.filter((m) => !m.standalone);
      const standaloneMetrics = section.focusMetrics.filter((m) => m.standalone);

      // Check if device supports hover (desktop)
      const supportsHover = window.matchMedia("(hover: hover)").matches;

      // Helper to close all tooltips
      const closeAllTooltips = () => {
        document.querySelectorAll(".hero-focus-tooltip.active").forEach((t) => {
          t.classList.remove("active");
        });
      };

      // Helper to create tooltip functionality
      const addTooltip = (element, text) => {
        if (!text) return;
        element.classList.add("has-tooltip");
        const tooltip = createElement("div", {
          className: "hero-focus-tooltip",
          textContent: text,
        });
        element.appendChild(tooltip);

        // Only add click handler for mobile (non-hover devices)
        if (!supportsHover) {
          element.addEventListener("click", (e) => {
            e.stopPropagation();
            // Close any other open tooltips
            document.querySelectorAll(".hero-focus-tooltip.active").forEach((t) => {
              if (t !== tooltip) t.classList.remove("active");
            });
            tooltip.classList.toggle("active");
          });
        }
      };

      // Mobile: close tooltips on click outside or scroll
      if (!supportsHover) {
        document.addEventListener("click", closeAllTooltips);
        window.addEventListener("scroll", closeAllTooltips, { passive: true });
      }

      if (groupedMetrics.length > 0) {
        const group = createElement("div", { className: "hero-focus-group" });
        let groupNote = null;
        groupedMetrics.forEach((metric, index) => {
          if (index > 0) {
            group.appendChild(
              createElement("span", {
                className: "hero-focus-arrow",
                textContent: "→",
              })
            );
          }
          const metricEl = createElement("div", { className: "hero-focus-metric" });
          metricEl.appendChild(
            createElement("div", {
              className: "hero-focus-year",
              textContent: metric.year,
            })
          );
          metricEl.appendChild(
            createElement("div", {
              className: "hero-focus-value",
              textContent: metric.value,
            })
          );
          metricEl.appendChild(
            createElement("div", {
              className: "hero-focus-label",
              textContent: metric.label,
            })
          );
          group.appendChild(metricEl);
          if (metric.groupNote) {
            groupNote = metric.groupNote;
          }
        });
        addTooltip(group, groupNote);
        metricsContainer.appendChild(group);
      }

      standaloneMetrics.forEach((metric) => {
        const metricEl = createElement("div", {
          className: "hero-focus-metric hero-focus-standalone",
        });
        metricEl.appendChild(
          createElement("div", {
            className: "hero-focus-year",
            textContent: metric.year,
          })
        );
        metricEl.appendChild(
          createElement("div", {
            className: "hero-focus-value",
            textContent: metric.value,
          })
        );
        metricEl.appendChild(
          createElement("div", {
            className: "hero-focus-label",
            textContent: metric.label,
          })
        );
        addTooltip(metricEl, metric.note);
        metricsContainer.appendChild(metricEl);
      });

      leftColumn.appendChild(metricsContainer);
    }

    showcase.appendChild(leftColumn);

    // Video pair container for highlight and full video side by side
    const videoPair = createElement("div", { className: "hero-video-pair" });

    // Collect videos for shared modal navigation
    const heroVideos = [
      {
        label: section.heroVideo.label || "Highlight",
        vimeoId: section.heroVideo.vimeoId,
        isVertical: section.heroVideo.vertical,
      },
    ];
    if (section.video) {
      heroVideos.push({
        label: section.video.label || "Full Video",
        vimeoId: section.video.vimeoId,
        isVertical: section.video.vertical,
      });
    }

    // Create shared modal for hero videos
    let currentHeroIndex = 0;
    const heroModalIframes = []; // Array of iframes, one per video

    const heroModal = createElement("div", { className: "video-modal" });
    const heroBackdrop = createElement("div", { className: "video-modal-backdrop" });
    const heroContent = createElement("div", {
      className: "video-modal-content video-modal-content--vertical",
    });

    const heroCloseBtn = createElement("button", {
      className: "video-modal-close",
      textContent: "\u00D7",
    });

    // Navigation and video container
    const heroModalBody = createElement("div", { className: "video-modal-body" });

    const heroPrevBtn = createElement("button", {
      className: "video-modal-nav video-modal-nav--prev",
      textContent: "\u2039",
    });

    const heroModalWrapper = createElement("div", { className: "video-modal-wrapper" });

    const heroNextBtn = createElement("button", {
      className: "video-modal-nav video-modal-nav--next",
      textContent: "\u203A",
    });

    heroModalBody.appendChild(heroPrevBtn);
    heroModalBody.appendChild(heroModalWrapper);
    heroModalBody.appendChild(heroNextBtn);

    // Append close button to video wrapper so it's positioned on the video
    heroModalWrapper.appendChild(heroCloseBtn);
    heroContent.appendChild(heroModalBody);
    heroModal.appendChild(heroBackdrop);
    heroModal.appendChild(heroContent);

    const updateHeroNavButtons = (index) => {
      heroPrevBtn.style.display = index === 0 ? "none" : "flex";
      heroNextBtn.style.display = index === heroVideos.length - 1 ? "none" : "flex";
    };

    // Get or create iframe for a specific video index
    const getOrCreateHeroIframe = (index) => {
      if (!heroModalIframes[index]) {
        const video = heroVideos[index];
        const iframe = createElement("iframe");
        iframe.src = `https://player.vimeo.com/video/${video.vimeoId}?loop=1&sidedock=0&title=0&byline=0&portrait=0&quality=auto`;
        iframe.setAttribute("frameborder", "0");
        iframe.setAttribute(
          "allow",
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        );
        iframe.setAttribute("allowfullscreen", "");
        iframe.style.display = "none";
        heroModalWrapper.appendChild(iframe);
        heroModalIframes[index] = iframe;
      }
      return heroModalIframes[index];
    };

    const showHeroVideo = (index) => {
      // Hide all iframes and pause them
      heroModalIframes.forEach((iframe, i) => {
        if (iframe) {
          iframe.style.display = i === index ? "block" : "none";
          if (i !== index) {
            iframe.contentWindow.postMessage(JSON.stringify({ method: "pause" }), "*");
          }
        }
      });

      // Show and play the current video
      const iframe = getOrCreateHeroIframe(index);
      iframe.style.display = "block";
      iframe.contentWindow.postMessage(JSON.stringify({ method: "play" }), "*");
    };

    const updateHeroModalContent = (index) => {
      currentHeroIndex = index;
      showHeroVideo(index);
      updateHeroNavButtons(index);
    };

    const openHeroModal = (index) => {
      currentHeroIndex = index;
      getOrCreateHeroIframe(index); // Ensure iframe exists
      updateHeroModalContent(index);
      heroModal.classList.add("active");
      document.documentElement.classList.add("modal-open");
      document.body.classList.add("modal-open");
    };

    const closeHeroModal = () => {
      heroModal.classList.remove("active");
      document.documentElement.classList.remove("modal-open");
      document.body.classList.remove("modal-open");
      // Pause current video
      const currentIframe = heroModalIframes[currentHeroIndex];
      if (currentIframe) {
        currentIframe.contentWindow.postMessage(JSON.stringify({ method: "pause" }), "*");
      }
    };

    heroPrevBtn.addEventListener("click", () => {
      if (currentHeroIndex > 0) {
        updateHeroModalContent(currentHeroIndex - 1);
      }
    });

    heroNextBtn.addEventListener("click", () => {
      if (currentHeroIndex < heroVideos.length - 1) {
        updateHeroModalContent(currentHeroIndex + 1);
      }
    });

    heroCloseBtn.addEventListener("click", closeHeroModal);
    heroBackdrop.addEventListener("click", closeHeroModal);
    // Close when clicking on transparent content area (not children)
    heroContent.addEventListener("click", (e) => {
      if (e.target === heroContent || e.target === heroModalBody) {
        closeHeroModal();
      }
    });

    const handleHeroKeydown = (e) => {
      if (!heroModal.classList.contains("active")) return;
      if (e.key === "Escape") closeHeroModal();
      if (e.key === "ArrowLeft" && currentHeroIndex > 0) {
        updateHeroModalContent(currentHeroIndex - 1);
      }
      if (e.key === "ArrowRight" && currentHeroIndex < heroVideos.length - 1) {
        updateHeroModalContent(currentHeroIndex + 1);
      }
    };
    document.addEventListener("keydown", handleHeroKeydown);

    document.body.appendChild(heroModal);

    // Helper to create a video card (preview only, uses shared modal)
    const createVideoCard = (label, vimeoId, index) => {
      const card = createElement("div", { className: "hero-video-card" });
      const labelEl = createElement("div", {
        className: "hero-video-label",
        textContent: label,
      });
      card.appendChild(labelEl);

      const wrapper = createElement("div", {
        className: "hero-year-video-wrapper hero-video-clickable",
      });

      const iframe = createElement("iframe");
      iframe.src = `https://player.vimeo.com/video/${vimeoId}?loop=1&muted=1&autopause=0&controls=0&title=0&byline=0&portrait=0`;
      iframe.setAttribute("frameborder", "0");
      iframe.setAttribute("allow", "autoplay; fullscreen; picture-in-picture");
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute("loading", "lazy");
      wrapper.appendChild(iframe);

      const playOverlay = createElement("div", {
        className: "hero-video-play-overlay hero-video-expand-overlay",
      });
      const playIcon = createSVGElement("svg", {
        width: "48",
        height: "48",
        viewBox: "0 0 24 24",
        fill: "currentColor",
      });
      playIcon.appendChild(createSVGElement("path", { d: "M8 5v14l11-7z" }));
      playOverlay.appendChild(playIcon);
      wrapper.appendChild(playOverlay);

      card.appendChild(wrapper);

      wrapper.addEventListener("click", () => openHeroModal(index));

      return card;
    };

    // Create video cards
    heroVideos.forEach((video, index) => {
      const card = createVideoCard(video.label, video.vimeoId, index);
      videoPair.appendChild(card);
    });

    showcase.appendChild(videoPair);
    containerDiv.appendChild(showcase);
  } else if (section.heroVideo) {
    const heroVideoContainer = createElement("div", {
      className: section.heroVideo.vertical
        ? "hero-video-container hero-video-container--vertical"
        : "hero-video-container",
    });

    const videoWrapper = createElement("div", { className: "hero-video-wrapper" });

    const iframe = createElement("iframe");
    iframe.src = `https://player.vimeo.com/video/${section.heroVideo.vimeoId}?background=1&autoplay=1&loop=1&muted=1&autopause=0`;
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("allow", "autoplay; fullscreen; picture-in-picture");
    iframe.setAttribute("allowfullscreen", "");
    iframe.setAttribute("loading", "lazy");

    videoWrapper.appendChild(iframe);
    heroVideoContainer.appendChild(videoWrapper);
    containerDiv.appendChild(heroVideoContainer);
  }

  if (section.description && !section.heroSection) {
    containerDiv.appendChild(
      createElement("p", {
        className: "section-description",
        textContent: section.description,
      })
    );
  }

  if (section.video && !section.heroSection) {
    const videoButton = createElement("button", {
      className: "video-button",
      textContent: section.video.buttonText || "Watch Video",
    });

    const playIcon = createSVGElement("svg", {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "currentColor",
    });
    playIcon.appendChild(createSVGElement("path", { d: "M8 5v14l11-7z" }));
    videoButton.insertBefore(playIcon, videoButton.firstChild);

    const modal = createElement("div", { className: "video-modal" });
    const modalBackdrop = createElement("div", { className: "video-modal-backdrop" });
    const modalContent = createElement("div", {
      className: section.video.vertical
        ? "video-modal-content video-modal-content--vertical"
        : "video-modal-content",
    });

    const closeButton = createElement("button", {
      className: "video-modal-close",
      textContent: "\u00D7",
    });

    const modalVideoWrapper = createElement("div", {
      className: "video-modal-wrapper",
    });

    modalContent.appendChild(closeButton);
    modalContent.appendChild(modalVideoWrapper);
    modal.appendChild(modalBackdrop);
    modal.appendChild(modalContent);

    let modalIframe = null;

    videoButton.addEventListener("click", () => {
      if (!modalIframe) {
        modalIframe = createElement("iframe");
        if (section.video.vimeoId) {
          modalIframe.src = `https://player.vimeo.com/video/${section.video.vimeoId}?autoplay=1&loop=1`;
        } else if (section.video.youtubeId) {
          modalIframe.src = `https://www.youtube.com/embed/${section.video.youtubeId}?autoplay=1&loop=1`;
        }
        modalIframe.setAttribute("frameborder", "0");
        modalIframe.setAttribute(
          "allow",
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        );
        modalIframe.setAttribute("allowfullscreen", "");
        modalVideoWrapper.appendChild(modalIframe);
      } else {
        modalIframe.contentWindow.postMessage(JSON.stringify({ method: "play" }), "*");
      }
      modal.classList.add("active");
      document.documentElement.classList.add("modal-open");
      document.body.classList.add("modal-open");
    });

    const closeModal = () => {
      modal.classList.remove("active");
      document.documentElement.classList.remove("modal-open");
      document.body.classList.remove("modal-open");
      if (modalIframe) {
        modalIframe.contentWindow.postMessage(JSON.stringify({ method: "pause" }), "*");
      }
    };

    closeButton.addEventListener("click", closeModal);
    modalBackdrop.addEventListener("click", closeModal);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("active")) {
        closeModal();
      }
    });

    containerDiv.appendChild(videoButton);
    document.body.appendChild(modal);
  }

  if (section.subsections) {
    for (const subsection of section.subsections) {
      switch (subsection.type) {
        case "arsenal":
          await renderArsenalSubsection(subsection, containerDiv);
          break;
        case "leaderboards":
          await renderLeaderboardsSubsection(subsection, containerDiv);
          break;
        case "videos":
          renderVideosSubsection(subsection, containerDiv);
          break;
        case "placeholder":
          renderPlaceholderSubsection(subsection, containerDiv);
          break;
        case "stats":
          await renderStatsSubsection(subsection, containerDiv);
          break;
        case "training":
          await renderTrainingSubsection(subsection, containerDiv);
          break;
        case "video-progression":
          renderVideoProgressionSubsection(subsection, containerDiv);
          break;
        default:
          console.warn("Unknown subsection type:", subsection.type);
      }
    }
  }

  sectionEl.appendChild(containerDiv);
  container.appendChild(sectionEl);
}
