/**
 * Evolution page subsection renderers and section dispatcher.
 */

import { createElement, createIconElement } from "./dom.js";
import { parseCSV } from "./data.js";
import { initCarouselScrollDetection, createVideoFacade, createVideoModal, formatDate, sortByDate } from "./ui.js";
import { buildStatsTable } from "./stats-table.js";
import { renderCaption } from "./training-card.js";
import {
  createSVGElement,
  PITCH_CONFIG,
  PITCH_ORDER,
  buildMovementChart,
  buildArsenalTable,
  aggregateByPitchType,
} from "./evolution-charts.js";

// Mobile tooltip listeners are registered at most once across all sections
let tooltipListenersRegistered = false;

function closeAllTooltips() {
  document.querySelectorAll(".hero-focus-tooltip.active").forEach((t) => {
    t.classList.remove("active");
  });
}

// Quote-aware CSV parser for Trackman/Hawkeye pitch data files.
// Distinct from data.js parseCSV: handles quoted fields with embedded commas.
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
        createElement("span", { className: "leaderboard-rank", textContent: entry.rank })
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
      createElement("span", { className: "leaderboard-value", textContent: entry.value })
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
    subsectionDiv.appendChild(createElement("p", {
      className: "subsection-description",
      textContent: subsection.description,
    }));
  }

  const grid = createElement("div", { className: "evolution-grid" });

  const tableWrapper = createElement("div", {
    className: "stats-table-wrapper",
    id: "arsenal-summary",
  });
  grid.appendChild(tableWrapper);

  const chartContainer = createElement("div", { className: "movement-chart-container" });
  const chart = createElement("div", { className: "movement-chart", id: "movement-chart" });
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

async function renderLeaderboardsSubsection(subsection, container) {
  const subsectionDiv = createElement("div", { className: "subsection" });

  const header = createElement("div", { className: "subsection-header" });
  header.appendChild(createElement("h3", { textContent: subsection.title }));
  subsectionDiv.appendChild(header);

  const grid = createElement("div", { className: "content-grid leaderboard-grid" });
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

  initCarouselScrollDetection(grid);
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

    // Facade defers iframe load until user clicks
    const facade = createVideoFacade({
      videoId: video.vimeoId || video.youtubeId,
      isVimeo: !!video.vimeoId,
      title: video.title || "",
    });
    videoWrapper.appendChild(facade);
    videoCard.appendChild(videoWrapper);

    if (video.title) {
      videoCard.appendChild(createElement("p", {
        className: "video-title",
        textContent: video.title,
      }));
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
  placeholder.appendChild(createElement("p", { textContent: subsection.placeholderText }));
  subsectionDiv.appendChild(placeholder);

  container.appendChild(subsectionDiv);
}

async function renderStatsSubsection(subsection, container) {
  const subsectionDiv = createElement("div", { className: "subsection" });

  const header = createElement("div", { className: "subsection-header" });
  header.appendChild(createElement("h3", { textContent: subsection.title }));
  subsectionDiv.appendChild(header);

  try {
    const response = await fetch("/" + subsection.statsFile);
    if (!response.ok) throw new Error("Failed to load stats");

    const csvText = await response.text();
    const statsData = parseCSV(csvText);

    buildStatsTable(subsectionDiv, statsData, subsection.statsLinks, {
      headerEl: header,
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

  // Valid items for modal navigation (images or real vimeo IDs)
  const validItems = subsection.videos.filter(
    (v) => v.image || (v.vimeoId && !v.vimeoId.startsWith("PLACEHOLDER"))
  );

  const { open: openModal } = createVideoModal({
    variant: "progression",
    items: validItems,
    buildMedia: (index, wrapper) => {
      const item = validItems[index];
      if (item.image) {
        const img = createElement("img", {
          src: item.image,
          alt: `${item.year} release height progression`,
        });
        img.style.cssText =
          "position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; display: none;";
        wrapper.appendChild(img);
        return { type: "image", element: img };
      }
      const iframe = createElement("iframe");
      iframe.src = `https://player.vimeo.com/video/${item.vimeoId}?loop=1&sidedock=0&title=0&byline=0&portrait=0&quality=auto`;
      iframe.setAttribute("frameborder", "0");
      iframe.setAttribute(
        "allow",
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      );
      iframe.setAttribute("allowfullscreen", "");
      iframe.style.display = "none";
      wrapper.appendChild(iframe);
      return { type: "video", element: iframe };
    },
    buildLabel: (index, labelEl) => {
      const item = validItems[index];
      const metricValue = item[metricKey];
      labelEl.textContent = "";
      labelEl.appendChild(
        createElement("span", { className: "badge-year", textContent: item.year })
      );
      if (metricValue) {
        labelEl.appendChild(
          createElement("span", { className: "badge-separator", textContent: " · " })
        );
        labelEl.appendChild(
          createElement("span", {
            className: "badge-height",
            textContent: `${metricValue} ${metricUnit}`,
          })
        );
      }
    },
    buildDescription: (index) => validItems[index].description || null,
    navigable: true,
  });

  // Cards
  subsection.videos.forEach((video) => {
    const videoCard = createElement("div", { className: "video-progression-card" });

    const cardHeader = createElement("div", { className: "video-progression-header" });
    const badge = createElement("div", { className: "video-progression-badge" });
    badge.appendChild(createElement("span", { className: "badge-year", textContent: video.year }));
    const metricValue = video[metricKey];
    if (metricValue) {
      badge.appendChild(createElement("span", { className: "badge-separator", textContent: "·" }));
      badge.appendChild(createElement("span", {
        className: "badge-height",
        textContent: `${metricValue} ${metricUnit}`,
      }));
    }
    cardHeader.appendChild(badge);
    videoCard.appendChild(cardHeader);

    const videoWrapper = createElement("div", { className: "video-progression-wrapper" });

    if (video.image) {
      const img = createElement("img", {
        src: video.image,
        alt: `${video.year} release height progression`,
        loading: "lazy",
      });
      img.style.cssText =
        "position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;";
      videoWrapper.appendChild(img);

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

      const playOverlay = createElement("div", { className: "video-progression-play-overlay" });
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
      const validIndex = validItems.findIndex((v) => v.vimeoId === video.vimeoId);
      videoWrapper.addEventListener("click", () => openModal(validIndex));
    } else {
      const placeholder = createElement("div", { className: "video-placeholder" });
      placeholder.appendChild(createElement("span", { textContent: "Video coming soon" }));
      videoWrapper.appendChild(placeholder);
    }

    videoCard.appendChild(videoWrapper);

    if (video.description) {
      videoCard.appendChild(createElement("p", {
        className: "video-progression-description",
        textContent: video.description,
      }));
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
    header.appendChild(createElement("a", {
      href: subsection.viewAllUrl,
      className: "view-all-link",
      textContent: subsection.viewAllLabel || "View All",
    }));
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
          const cardContainer = createElement("div", { className: "training-card-container" });

          if (item.label) {
            cardContainer.appendChild(createElement("div", {
              className: "training-card-label",
              textContent: item.label,
            }));
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
            const imgWrapper = createElement("div", { className: "training-bg-wrapper" });
            const posterSrc = item.poster.startsWith("/") ? item.poster : "/" + item.poster;
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
            card.appendChild(createElement("div", { className: "training-bg-overlay" }));
          }

          const cardHeader = createElement("div", { className: "training-header" });
          if (item.credit) {
            cardHeader.appendChild(createElement("div", {
              className: "training-handle",
              textContent: `@${item.credit.handle}`,
            }));
          }
          if (item.date) {
            cardHeader.appendChild(createElement("span", {
              className: "training-date",
              textContent: formatDate(item.date),
            }));
          }
          card.appendChild(cardHeader);

          const cardContent = createElement("div", { className: "training-card-content" });
          if (item.caption) {
            const captionEl = createElement("p", { className: "training-caption" });
            renderCaption(captionEl, item.caption, "training-mention");
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
      initCarouselScrollDetection(trainingGrid);
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
    iconLink.appendChild(createIconElement(section.icon));
    sectionHeader.appendChild(iconLink);
  }

  const titleDiv = createElement("div");
  titleDiv.appendChild(createElement("h2", { textContent: section.title }));
  if (section.subtitle) {
    titleDiv.appendChild(createElement("p", {
      className: "section-subtitle",
      textContent: section.subtitle,
    }));
  }
  sectionHeader.appendChild(titleDiv);

  containerDiv.appendChild(sectionHeader);

  if (section.heroSection && section.heroVideo) {
    const showcase = createElement("div", { className: "hero-year-showcase" });

    const leftColumn = createElement("div", { className: "hero-year-left" });

    const yearTitle = createElement("h2", {
      className: "hero-year-title",
      textContent: section.title,
    });
    yearTitle.dataset.year = section.title;
    leftColumn.appendChild(yearTitle);

    if (section.description) {
      leftColumn.appendChild(createElement("p", {
        className: "hero-year-description",
        textContent: section.description,
      }));
    }

    if (section.focusMetrics) {
      const metricsContainer = createElement("div", { className: "hero-focus-metrics" });

      const supportsHover = window.matchMedia("(hover: hover)").matches;

      const addTooltip = (element, text) => {
        if (!text) return;
        element.classList.add("has-tooltip");
        const tooltip = createElement("div", {
          className: "hero-focus-tooltip",
          textContent: text,
        });
        element.appendChild(tooltip);

        if (!supportsHover) {
          element.addEventListener("click", (e) => {
            e.stopPropagation();
            document.querySelectorAll(".hero-focus-tooltip.active").forEach((t) => {
              if (t !== tooltip) t.classList.remove("active");
            });
            tooltip.classList.toggle("active");
          });
        }
      };

      // Register mobile tooltip close handlers once across all sections
      if (!supportsHover && !tooltipListenersRegistered) {
        tooltipListenersRegistered = true;
        document.addEventListener("click", closeAllTooltips);
        window.addEventListener("scroll", closeAllTooltips, { passive: true });
      }

      const groupedMetrics = section.focusMetrics.filter((m) => !m.standalone);
      const standaloneMetrics = section.focusMetrics.filter((m) => m.standalone);

      if (groupedMetrics.length > 0) {
        const group = createElement("div", { className: "hero-focus-group" });
        let groupNote = null;
        groupedMetrics.forEach((metric, i) => {
          if (i > 0) {
            group.appendChild(createElement("span", {
              className: "hero-focus-arrow",
              textContent: "→",
            }));
          }
          const metricEl = createElement("div", { className: "hero-focus-metric" });
          metricEl.appendChild(createElement("div", { className: "hero-focus-year", textContent: metric.year }));
          metricEl.appendChild(createElement("div", { className: "hero-focus-value", textContent: metric.value }));
          metricEl.appendChild(createElement("div", { className: "hero-focus-label", textContent: metric.label }));
          group.appendChild(metricEl);
          if (metric.groupNote) groupNote = metric.groupNote;
        });
        addTooltip(group, groupNote);
        metricsContainer.appendChild(group);
      }

      standaloneMetrics.forEach((metric) => {
        const metricEl = createElement("div", {
          className: "hero-focus-metric hero-focus-standalone",
        });
        metricEl.appendChild(createElement("div", { className: "hero-focus-year", textContent: metric.year }));
        metricEl.appendChild(createElement("div", { className: "hero-focus-value", textContent: metric.value }));
        metricEl.appendChild(createElement("div", { className: "hero-focus-label", textContent: metric.label }));
        addTooltip(metricEl, metric.note);
        metricsContainer.appendChild(metricEl);
      });

      leftColumn.appendChild(metricsContainer);
    }

    showcase.appendChild(leftColumn);

    const videoPair = createElement("div", { className: "hero-video-pair" });

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

    const { open: openHeroModal } = createVideoModal({
      variant: "vertical",
      items: heroVideos,
      buildMedia: (index, wrapper) => {
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
        wrapper.appendChild(iframe);
        return { type: "video", element: iframe };
      },
      navigable: true,
    });

    const createVideoCard = (label, vimeoId, cardIndex) => {
      const card = createElement("div", { className: "hero-video-card" });
      card.appendChild(createElement("div", { className: "hero-video-label", textContent: label }));

      const wrapper = createElement("div", {
        className: "hero-year-video-wrapper hero-video-clickable",
      });

      // Facade: static poster + play button; clicking opens the modal
      const facade = createVideoFacade({
        videoId: vimeoId,
        isVimeo: true,
        title: label,
        onClick: () => openHeroModal(cardIndex),
      });
      // Style facade to fill the wrapper (which uses aspect-ratio: 2/3, overflow: hidden)
      facade.style.cssText = "position:absolute;inset:0;";
      wrapper.appendChild(facade);

      card.appendChild(wrapper);

      return card;
    };

    heroVideos.forEach((video, i) => {
      videoPair.appendChild(createVideoCard(video.label, video.vimeoId, i));
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
    containerDiv.appendChild(createElement("p", {
      className: "section-description",
      textContent: section.description,
    }));
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

    const { open: openVideoModal } = createVideoModal({
      variant: section.video.vertical ? "vertical" : "",
      items: [section.video],
      buildMedia: (index, wrapper) => {
        const video = section.video;
        const iframe = createElement("iframe");
        if (video.vimeoId) {
          iframe.src = `https://player.vimeo.com/video/${video.vimeoId}?autoplay=1&loop=1`;
        } else if (video.youtubeId) {
          iframe.src = `https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&loop=1`;
        }
        iframe.setAttribute("frameborder", "0");
        iframe.setAttribute(
          "allow",
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        );
        iframe.setAttribute("allowfullscreen", "");
        wrapper.appendChild(iframe);
        return { type: "video", element: iframe };
      },
      navigable: false,
    });

    videoButton.addEventListener("click", () => openVideoModal(0));

    containerDiv.appendChild(videoButton);
  }

  // Append shell to the DOM before fetching so deterministic order is preserved
  // when multiple renderSection calls run concurrently via Promise.all.
  // Each subsection renderer also appends its own shell synchronously before
  // returning its fetch promise, so subsection order within a section is stable.
  sectionEl.appendChild(containerDiv);
  container.appendChild(sectionEl);

  // Dispatch subsections — all fetches fire concurrently, DOM insertion in order
  if (section.subsections) {
    const subsectionPromises = section.subsections.map((subsection) => {
      switch (subsection.type) {
        case "arsenal":
          return renderArsenalSubsection(subsection, containerDiv);
        case "leaderboards":
          return renderLeaderboardsSubsection(subsection, containerDiv);
        case "videos":
          renderVideosSubsection(subsection, containerDiv);
          return Promise.resolve();
        case "placeholder":
          renderPlaceholderSubsection(subsection, containerDiv);
          return Promise.resolve();
        case "stats":
          return renderStatsSubsection(subsection, containerDiv);
        case "training":
          return renderTrainingSubsection(subsection, containerDiv);
        case "video-progression":
          renderVideoProgressionSubsection(subsection, containerDiv);
          return Promise.resolve();
        default:
          console.warn("Unknown subsection type:", subsection.type);
          return Promise.resolve();
      }
    });

    await Promise.all(subsectionPromises);
  }
}
