/**
 * Section rendering functions.
 */

import { createElement, createIconElement } from "./dom.js";
import { parseCSV } from "./data.js";
import { formatDate, isWithinDays, sortByDate } from "./ui.js";
import { displayProjects, displayContent, displayTweets, displayError } from "./cards.js";

export async function renderSections(config) {
  const main = document.querySelector("main");

  // Start all section renders in parallel for faster loading
  const sectionPromises = config.sections.map(async (section, index) => {
    const sectionEl = createElement("section", {
      id: section.id,
      className: "content-section" + (index % 2 === 0 ? " alt-bg" : ""),
    });

    if (section.type === "stats") {
      await renderStatsSection(sectionEl, section, config);
    } else if (section.type === "personal") {
      await renderPersonalSection(sectionEl, section, config);
    } else {
      await renderContentSection(sectionEl, section, config);
    }

    return sectionEl;
  });

  // Wait for all sections to complete, then append in order
  const sections = await Promise.all(sectionPromises);
  sections.forEach((sectionEl) => main.appendChild(sectionEl));
}

export async function renderStatsSection(container, section, config) {
  const csvResponse = await fetch("/" + section.statsFile);
  const csvText = await csvResponse.text();
  const statsData = parseCSV(csvText);

  // Find all career total rows
  const careerRows = {
    College: statsData.find((row) => row.Season === "College Career"),
    Summer: statsData.find((row) => row.Season === "Summer Career"),
    Independent: statsData.find((row) => row.Season === "Independent Career"),
    Minors: statsData.find((row) => row.Season === "Minors Career"),
  };

  // Filter for season aggregate rows (includes "team" or "teams")
  const seasonRows = statsData.filter(
    (row) => /^\d{4}$/.test(row.Season) && /\d+\s*teams?$/i.test(row.Team),
  );

  const levelClasses = {
    "Rk+": "level-roa",
    "A-": "level-a-short",
    "A+": "level-a-plus",
    AA: "level-aa",
    AAA: "level-aaa",
    NCAA: "level-ncaa",
    Summer: "level-summer",
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
    Mets: "New York Mets",
    Phillies: "Philadelphia Phillies",
    "Johns Hopkins": "Johns Hopkins Blue Jays",
    Westside: "Westside Woolly Mammoths",
    Baltimore: "Baltimore Dodgers",
  };

  // Map individual levels to their category
  const levelToCategory = {
    NCAA: "College",
    Summer: "Summer",
    Independent: "Independent",
    "Rk+": "Minors",
    "A-": "Minors",
    "A+": "Minors",
    AA: "Minors",
    AAA: "Minors",
  };

  // Group levels by year AND category
  const seasonCategoryLevels = {};
  statsData.forEach((row) => {
    if (/^\d{4}$/.test(row.Season) && !/\d+\s*teams?$/i.test(row.Team)) {
      const category = levelToCategory[row.Level] || row.Level;
      const key = `${row.Season}-${category}`;
      if (!seasonCategoryLevels[key]) {
        seasonCategoryLevels[key] = [];
      }
      const level = row.Level;
      if (!seasonCategoryLevels[key].includes(level)) {
        seasonCategoryLevels[key].push(level);
      }
    }
  });

  const highlightLabels = {
    ERA: "ERA",
    "W-L": "W-L Record",
    G: "Games",
    IP: "Innings",
    SO: "Strikeouts",
    WHIP: "WHIP",
  };

  const containerDiv = createElement("div", { className: "container" });

  const sectionHeader = createElement("div", { className: "section-header" });
  const iconDiv = createElement("div", {
    className: `section-icon ${section.id}-icon`,
  });
  iconDiv.appendChild(createIconElement(section.icon));
  sectionHeader.appendChild(iconDiv);

  const headerText = createElement("div");
  headerText.appendChild(createElement("h2", { textContent: section.title }));
  headerText.appendChild(
    createElement("p", {
      className: "section-subtitle",
      textContent: section.subtitle,
    }),
  );
  sectionHeader.appendChild(headerText);
  containerDiv.appendChild(sectionHeader);

  if (section.description) {
    containerDiv.appendChild(
      createElement("p", {
        className: "section-intro",
        textContent: section.description,
      }),
    );
  }

  const subsection = createElement("div", { className: "subsection" });
  const subsectionHeader = createElement("div", {
    className: "subsection-header",
  });
  subsectionHeader.appendChild(
    createElement("h3", { textContent: "Career Stats" }),
  );

  // Dynamic stats link
  const statsLinkConfig = {
    Minors: section.statsLinks.find((l) => l.name === "MiLB"),
    College: section.statsLinks.find((l) => l.name === "BBRef"),
    Summer: section.statsLinks.find((l) => l.name === "BBRef"),
    Independent: section.statsLinks.find((l) => l.name === "BBRef"),
  };

  const viewStatsLink = createElement("a", {
    href: statsLinkConfig.Minors?.url || "#",
    target: "_blank",
    rel: "noopener noreferrer",
    className: "view-all-link",
    textContent: "View MiLB",
  });
  subsectionHeader.appendChild(viewStatsLink);
  subsection.appendChild(subsectionHeader);

  // Calculate year ranges for each category
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
    const maxYearShort = String(maxYear).slice(-2);
    return `${minYear}-${maxYearShort}`;
  };

  // Category selector
  const categorySelector = createElement("div", { className: "stats-category-selector" });
  const categoryOrder = ["College", "Summer", "Independent", "Minors"];
  categoryOrder.forEach((category) => {
    const btn = createElement("button", {
      className: `stats-category-btn${category === "Minors" ? " active" : ""}`,
    });
    btn.dataset.category = category;

    const nameSpan = createElement("span", {
      className: "stats-category-name",
      textContent: category,
    });
    const yearsSpan = createElement("span", {
      className: "stats-category-years",
      textContent: getCategoryYearRange(category),
    });
    btn.appendChild(nameSpan);
    btn.appendChild(yearsSpan);
    categorySelector.appendChild(btn);
  });
  subsection.appendChild(categorySelector);

  // Helper to get highlight values for a category
  const getHighlightValues = (category) => {
    const careerRow = careerRows[category];
    return {
      ERA: careerRow?.ERA || "-",
      "W-L": careerRow ? `${careerRow.W}-${careerRow.L}` : "-",
      G: careerRow?.G || "-",
      IP: careerRow?.IP || "-",
      SO: careerRow?.SO || "-",
      WHIP: careerRow?.WHIP || "-",
    };
  };

  // Overview cards
  const statsOverview = createElement("div", { className: "stats-overview" });
  const initialHighlights = getHighlightValues("Minors");
  section.statsHighlights.forEach((stat) => {
    const card = createElement("div", { className: "stat-card-large" });
    const statValue = createElement("div", {
      className: "stat-value",
      textContent: initialHighlights[stat],
    });
    statValue.dataset.stat = stat;
    card.appendChild(statValue);
    card.appendChild(
      createElement("div", {
        className: "stat-label",
        textContent: highlightLabels[stat],
      }),
    );
    statsOverview.appendChild(card);
  });
  subsection.appendChild(statsOverview);

  // League info for non-Minors categories
  const categoryLeagues = {
    College: { name: "NCAA D3", className: "league-ncaa" },
    Summer: { name: "Cal Ripken", className: "league-summer" },
    Independent: { name: "USPBL", className: "league-independent" },
  };

  const tableWrapper = createElement("div", { className: "stats-table-wrapper" });
  const table = createElement("table", { className: "stats-table" });

  const thead = createElement("thead");
  const headerRow = createElement("tr");
  const headers = ["Year", "Organization", "Levels", "W", "L", "ERA", "G", "SV", "IP", "H", "SO", "BB", "WHIP"];
  headers.forEach((header) => {
    const th = createElement("th", { textContent: header });
    if (header === "Organization") th.dataset.column = "team";
    if (header === "Levels") th.dataset.column = "levels";
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

    // Team/Org badge
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

    // Levels/League cell
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
        const leagueBadge = createElement("span", {
          className: `league-badge ${leagueInfo.className}`,
          textContent: leagueInfo.name,
        });
        levelsCell.appendChild(leagueBadge);
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
  const footerCategoryOrder = ["College", "Summer", "Independent", "Minors"];
  footerCategoryOrder.forEach((category) => {
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
  subsection.appendChild(tableWrapper);

  // Category selector event handler
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
      teamHeader.textContent = selectedCategory === "Minors" ? "Organization" : "Team";
    }
    if (levelsHeader) {
      levelsHeader.textContent = selectedCategory === "Minors" ? "Levels" : "League";
    }

    const newHighlights = getHighlightValues(selectedCategory);
    statsOverview.querySelectorAll(".stat-value").forEach((el) => {
      const stat = el.dataset.stat;
      el.textContent = newHighlights[stat];
    });

    const linkConfig = statsLinkConfig[selectedCategory];
    if (linkConfig) {
      viewStatsLink.href = linkConfig.url;
      viewStatsLink.textContent = selectedCategory === "Minors" ? "View MiLB" : "View BBRef";
    }

    tbody.querySelectorAll("tr").forEach((row) => {
      row.style.display = row.dataset.category === selectedCategory ? "" : "none";
    });

    tfoot.querySelectorAll("tr").forEach((row) => {
      row.style.display = row.dataset.category === selectedCategory ? "" : "none";
    });
  });

  containerDiv.appendChild(subsection);

  // My Training subsection
  if (section.trainingFile) {
    try {
      const trainingResponse = await fetch("/" + section.trainingFile);
      const trainingData = await trainingResponse.json();

      if (trainingData && trainingData.length > 0) {
        const trainingSubsection = createElement("div", { className: "subsection" });
        const trainingHeader = createElement("div", { className: "subsection-header" });
        trainingHeader.appendChild(createElement("h3", { textContent: "My Training" }));
        trainingSubsection.appendChild(trainingHeader);

        const trainingGrid = createElement("div", { className: "content-grid" });
        sortByDate(trainingData).forEach((item) => {
          if (item.type === "video") {
            const cardLink = item.url ? createElement("a", {
              href: item.url,
              target: "_blank",
              rel: "noopener noreferrer",
              className: "training-card-link",
            }) : null;

            const card = createElement("div", { className: "training-card" });

            if (item.poster) {
              const imgWrapper = createElement("div", { className: "training-bg-wrapper" });
              const img = createElement("img", {
                src: item.poster,
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

            const header = createElement("div", { className: "training-header" });
            if (item.credit) {
              const handleEl = createElement("div", { className: "training-handle", textContent: `@${item.credit.handle}` });
              header.appendChild(handleEl);
            }
            if (item.date) {
              const dateEl = createElement("span", {
                className: "training-date",
                textContent: formatDate(item.date),
              });
              header.appendChild(dateEl);
            }
            card.appendChild(header);

            const isNew = item.date && isWithinDays(item.date, 30);
            if (isNew || item.pinned) {
              const badgeRow = createElement("div", { className: "card-badge-row" });

              if (item.pinned) {
                const pinnedBadge = createElement("span", { className: "pinned-badge", textContent: "Pinned" });
                badgeRow.appendChild(pinnedBadge);
              }

              if (isNew) {
                const newBadge = createElement("span", { className: "new-badge", textContent: "New" });
                badgeRow.appendChild(newBadge);
              }

              card.appendChild(badgeRow);
            }

            const cardContent = createElement("div", { className: "training-card-content" });
            if (item.caption) {
              const captionEl = createElement("p", { className: "training-caption" });

              let captionText = item.caption;
              if (captionText.length > 280) {
                captionText = captionText.substring(0, 280).trim() + "...";
              }

              const parts = captionText.split(/(@\w+)/g);
              parts.forEach((part) => {
                if (part.startsWith("@")) {
                  const mention = createElement("span", { className: "training-mention" });
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
              trainingGrid.appendChild(cardLink);
            } else {
              trainingGrid.appendChild(card);
            }
          }
        });
        trainingSubsection.appendChild(trainingGrid);
        containerDiv.appendChild(trainingSubsection);
      }
    } catch (error) {
      console.error("Error loading training data:", error);
    }
  }

  container.appendChild(containerDiv);
}

export async function renderContentSection(container, section, config) {
  const containerDiv = createElement("div", { className: "container" });

  const sectionHeader = createElement("div", { className: "section-header" });
  const iconDiv = createElement("div", {
    className: `section-icon ${section.id}-icon`,
  });
  iconDiv.appendChild(createIconElement(section.icon));
  sectionHeader.appendChild(iconDiv);

  const headerText = createElement("div");
  headerText.appendChild(createElement("h2", { textContent: section.title }));
  headerText.appendChild(
    createElement("p", {
      className: "section-subtitle",
      textContent: section.subtitle,
    }),
  );
  sectionHeader.appendChild(headerText);
  containerDiv.appendChild(sectionHeader);

  if (section.description) {
    containerDiv.appendChild(
      createElement("p", {
        className: "section-intro",
        textContent: section.description,
      }),
    );
  }

  if (section.topics && section.topics.length > 0) {
    const topicsContainer = createElement("div", { className: "section-topics" });

    if (section.topicsLabel) {
      topicsContainer.appendChild(
        createElement("span", {
          className: "section-topics-label",
          textContent: section.topicsLabel,
        }),
      );
    }

    const tagsContainer = createElement("div", { className: "section-topics-tags" });
    section.topics.forEach((topic) => {
      tagsContainer.appendChild(
        createElement("span", {
          className: "section-topic-tag",
          textContent: topic,
        }),
      );
    });
    topicsContainer.appendChild(tagsContainer);
    containerDiv.appendChild(topicsContainer);
  }

  // Build DOM structure and start all fetches in parallel
  const subsectionFetches = section.subsections.map((subsection) => {
    const subsectionDiv = createElement("div", { className: "subsection" });

    const subsectionHeader = createElement("div", { className: "subsection-header" });
    subsectionHeader.appendChild(createElement("h3", { textContent: subsection.title }));

    if (subsection.viewAllUrl) {
      const viewAllLink = createElement("a", {
        href: subsection.viewAllUrl,
        target: "_blank",
        className: "view-all-link",
        textContent: subsection.viewAllLabel,
      });
      subsectionHeader.appendChild(viewAllLink);
    }
    subsectionDiv.appendChild(subsectionHeader);

    const gridClassName = subsection.displayType === "projects"
      ? "content-grid content-grid--projects"
      : "content-grid";
    const contentGrid = createElement("div", { className: gridClassName });
    subsectionDiv.appendChild(contentGrid);
    containerDiv.appendChild(subsectionDiv);

    return fetch("/" + subsection.dataFile)
      .then((response) => response.json())
      .then((items) => {
        if (subsection.displayType === "projects") {
          displayProjects(contentGrid, items);
        } else if (subsection.displayType === "tweets") {
          displayTweets(contentGrid, items, subsection.handle);
        } else {
          displayContent(contentGrid, items);
        }
      })
      .catch(() => {
        displayError(contentGrid);
      });
  });

  await Promise.all(subsectionFetches);
  container.appendChild(containerDiv);
}

export async function renderPersonalSection(container, section, config) {
  const containerDiv = createElement("div", { className: "container" });

  const sectionHeader = createElement("div", { className: "section-header" });
  const iconDiv = createElement("div", {
    className: `section-icon ${section.id}-icon`,
  });
  iconDiv.appendChild(createIconElement(section.icon));
  sectionHeader.appendChild(iconDiv);

  const headerText = createElement("div");
  headerText.appendChild(createElement("h2", { textContent: section.title }));
  headerText.appendChild(
    createElement("p", {
      className: "section-subtitle",
      textContent: section.subtitle,
    }),
  );
  sectionHeader.appendChild(headerText);
  containerDiv.appendChild(sectionHeader);

  try {
    const dataResponse = await fetch("/" + section.dataFile);
    const data = await dataResponse.json();

    const personalGrid = createElement("div", { className: "content-grid" });

    if (data.reading) {
      const readingCard = createElement("a", {
        href: data.reading.book.url,
        target: "_blank",
        rel: "noopener noreferrer",
        className: "personal-card",
      });

      const cardIcon = createElement("div", { className: "personal-card-icon" });
      cardIcon.appendChild(createIconElement("book"));
      readingCard.appendChild(cardIcon);

      readingCard.appendChild(
        createElement("h3", {
          className: "personal-card-title",
          textContent: data.reading.title,
        }),
      );

      const coverImg = createElement("img", {
        src: data.reading.book.cover,
        alt: data.reading.book.title,
        className: "personal-cover",
        loading: "lazy",
      });
      readingCard.appendChild(coverImg);

      readingCard.appendChild(
        createElement("p", {
          className: "personal-item-title",
          textContent: data.reading.book.title,
        }),
      );
      readingCard.appendChild(
        createElement("p", {
          className: "personal-item-subtitle",
          textContent: data.reading.book.author,
        }),
      );

      personalGrid.appendChild(readingCard);
    }

    if (data.listening) {
      const listeningCard = createElement("a", {
        href: data.listening.album.url,
        target: "_blank",
        rel: "noopener noreferrer",
        className: "personal-card",
      });

      const cardIcon = createElement("div", { className: "personal-card-icon" });
      cardIcon.appendChild(createIconElement("headphones"));
      listeningCard.appendChild(cardIcon);

      listeningCard.appendChild(
        createElement("h3", {
          className: "personal-card-title",
          textContent: data.listening.title,
        }),
      );

      const coverImg = createElement("img", {
        src: data.listening.album.cover,
        alt: data.listening.album.title,
        className: "personal-cover",
        loading: "lazy",
      });
      listeningCard.appendChild(coverImg);

      listeningCard.appendChild(
        createElement("p", {
          className: "personal-item-title",
          textContent: data.listening.album.title,
        }),
      );
      listeningCard.appendChild(
        createElement("p", {
          className: "personal-item-subtitle",
          textContent: data.listening.album.artist,
        }),
      );

      personalGrid.appendChild(listeningCard);
    }

    if (data.chess) {
      const chessCard = createElement("div", {
        className: "personal-card personal-card-multi",
      });

      const cardIcon = createElement("div", { className: "personal-card-icon" });
      cardIcon.appendChild(createIconElement("chess"));
      chessCard.appendChild(cardIcon);

      chessCard.appendChild(
        createElement("h3", {
          className: "personal-card-title",
          textContent: data.chess.title,
        }),
      );

      const linksContainer = createElement("div", { className: "personal-card-links" });

      Object.values(data.chess.links).forEach((linkData) => {
        const link = createElement("a", {
          href: linkData.url,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "personal-card-link",
        });

        link.appendChild(
          createElement("span", {
            className: "personal-link-label",
            textContent: linkData.label,
          }),
        );

        const ratingContainer = createElement("span", {
          className: "personal-link-rating-container",
        });
        ratingContainer.appendChild(
          createElement("span", {
            className: "personal-link-type",
            textContent: linkData.ratingType,
          }),
        );
        ratingContainer.appendChild(
          createElement("span", {
            className: "personal-link-rating",
            textContent: linkData.rating,
          }),
        );
        link.appendChild(ratingContainer);

        linksContainer.appendChild(link);
      });

      chessCard.appendChild(linksContainer);
      personalGrid.appendChild(chessCard);
    }

    containerDiv.appendChild(personalGrid);
  } catch (error) {
    displayError(containerDiv);
  }

  container.appendChild(containerDiv);
}
