/**
 * Section rendering functions.
 */

import { createElement, createIconElement } from "./dom.js";
import { parseCSV } from "./data.js";
import { initCarouselScrollDetection, formatDate, isWithinDays, sortByDate } from "./ui.js";
import { displayProjects, displayContent, displayTweets, displayError } from "./cards.js";
import { buildStatsTable } from "./stats-table.js";
import { renderCaption } from "./training-card.js";

export async function renderSections(config) {
  const main = document.querySelector("main");

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

  const sections = await Promise.all(sectionPromises);
  sections.forEach((sectionEl) => main.appendChild(sectionEl));
}

export async function renderStatsSection(container, section, config) {
  // Start the stats CSV and training JSON fetches concurrently
  const csvFetch = fetch("/" + section.statsFile).then((r) => r.text());
  const trainingFetch = section.trainingFile
    ? fetch("/" + section.trainingFile)
        .then((r) => r.json())
        .catch((error) => {
          console.error("Error loading training data:", error);
          return null;
        })
    : Promise.resolve(null);

  const [csvText, trainingData] = await Promise.all([csvFetch, trainingFetch]);
  const statsData = parseCSV(csvText);

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
  const iconLink = createElement("a", {
    href: `#${section.id}`,
    className: `section-icon ${section.id}-icon`,
  });
  iconLink.appendChild(createIconElement(section.icon));
  sectionHeader.appendChild(iconLink);

  const headerText = createElement("div");
  headerText.appendChild(createElement("h2", { textContent: section.title }));
  headerText.appendChild(createElement("p", {
    className: "section-subtitle",
    textContent: section.subtitle,
  }));
  sectionHeader.appendChild(headerText);
  containerDiv.appendChild(sectionHeader);

  if (section.description) {
    containerDiv.appendChild(createElement("p", {
      className: "section-intro",
      textContent: section.description,
    }));
  }

  const subsection = createElement("div", { className: "subsection" });
  const subsectionHeader = createElement("div", { className: "subsection-header" });
  subsectionHeader.appendChild(createElement("h3", { textContent: "Career Stats" }));
  subsection.appendChild(subsectionHeader);

  buildStatsTable(subsection, statsData, section.statsLinks, {
    headerEl: subsectionHeader,
    statsHighlights: section.statsHighlights,
    highlightLabels,
  });

  containerDiv.appendChild(subsection);

  // My Training subsection (data already pre-fetched)
  if (trainingData && trainingData.length > 0) {
    const trainingSubsection = createElement("div", { className: "subsection" });
    const trainingHeader = createElement("div", { className: "subsection-header" });
    trainingHeader.appendChild(createElement("h3", { textContent: "My Training" }));
    trainingHeader.appendChild(createElement("a", {
      href: "/evolution",
      className: "view-all-link",
      textContent: "View Evolution",
    }));
    trainingSubsection.appendChild(trainingHeader);

    const trainingGrid = createElement("div", { className: "content-grid" });
    sortByDate(trainingData).forEach((item) => {
      if (item.type === "video") {
        const cardLink = item.url
          ? createElement("a", {
              href: item.url,
              target: "_blank",
              rel: "noopener noreferrer",
              className: "training-card-link",
            })
          : null;

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
          card.appendChild(createElement("div", { className: "training-bg-overlay" }));
        }

        const header = createElement("div", { className: "training-header" });
        if (item.credit) {
          header.appendChild(createElement("div", {
            className: "training-handle",
            textContent: `@${item.credit.handle}`,
          }));
        }
        if (item.date) {
          header.appendChild(createElement("span", {
            className: "training-date",
            textContent: formatDate(item.date),
          }));
        }
        card.appendChild(header);

        const isNew = item.date && isWithinDays(item.date, 30);
        if (isNew || item.pinned) {
          const badgeRow = createElement("div", { className: "card-badge-row" });
          if (item.pinned) {
            badgeRow.appendChild(createElement("span", {
              className: "pinned-badge",
              textContent: "Pinned",
            }));
          }
          if (isNew) {
            badgeRow.appendChild(createElement("span", {
              className: "new-badge",
              textContent: "New",
            }));
          }
          card.appendChild(badgeRow);
        }

        const cardContent = createElement("div", { className: "training-card-content" });
        if (item.caption) {
          const captionEl = createElement("p", { className: "training-caption" });
          renderCaption(captionEl, item.caption, "training-mention");
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
    initCarouselScrollDetection(trainingGrid);
    containerDiv.appendChild(trainingSubsection);
  }

  container.appendChild(containerDiv);
}

export async function renderContentSection(container, section, config) {
  const containerDiv = createElement("div", { className: "container" });

  const sectionHeader = createElement("div", { className: "section-header" });
  const iconLink = createElement("a", {
    href: `#${section.id}`,
    className: `section-icon ${section.id}-icon`,
  });
  iconLink.appendChild(createIconElement(section.icon));
  sectionHeader.appendChild(iconLink);

  const headerText = createElement("div");
  headerText.appendChild(createElement("h2", { textContent: section.title }));
  headerText.appendChild(createElement("p", {
    className: "section-subtitle",
    textContent: section.subtitle,
  }));
  sectionHeader.appendChild(headerText);
  containerDiv.appendChild(sectionHeader);

  if (section.description) {
    containerDiv.appendChild(createElement("p", {
      className: "section-intro",
      textContent: section.description,
    }));
  }

  if (section.topics && section.topics.length > 0) {
    const topicsContainer = createElement("div", { className: "section-topics" });

    if (section.topicsLabel) {
      topicsContainer.appendChild(createElement("span", {
        className: "section-topics-label",
        textContent: section.topicsLabel,
      }));
    }

    const tagsContainer = createElement("div", { className: "section-topics-tags" });
    section.topics.forEach((topic) => {
      tagsContainer.appendChild(createElement("span", {
        className: "section-topic-tag",
        textContent: topic,
      }));
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

    const gridClassName =
      subsection.displayType === "projects"
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
  const iconLink = createElement("a", {
    href: `#${section.id}`,
    className: `section-icon ${section.id}-icon`,
  });
  iconLink.appendChild(createIconElement(section.icon));
  sectionHeader.appendChild(iconLink);

  const headerText = createElement("div");
  headerText.appendChild(createElement("h2", { textContent: section.title }));
  headerText.appendChild(createElement("p", {
    className: "section-subtitle",
    textContent: section.subtitle,
  }));
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

      readingCard.appendChild(createElement("h3", {
        className: "personal-card-title",
        textContent: data.reading.title,
      }));

      readingCard.appendChild(createElement("img", {
        src: data.reading.book.cover,
        alt: data.reading.book.title,
        className: "personal-cover",
        loading: "lazy",
      }));

      readingCard.appendChild(createElement("p", {
        className: "personal-item-title",
        textContent: data.reading.book.title,
      }));
      readingCard.appendChild(createElement("p", {
        className: "personal-item-subtitle",
        textContent: data.reading.book.author,
      }));

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

      listeningCard.appendChild(createElement("h3", {
        className: "personal-card-title",
        textContent: data.listening.title,
      }));

      listeningCard.appendChild(createElement("img", {
        src: data.listening.album.cover,
        alt: data.listening.album.title,
        className: "personal-cover",
        loading: "lazy",
      }));

      listeningCard.appendChild(createElement("p", {
        className: "personal-item-title",
        textContent: data.listening.album.title,
      }));
      listeningCard.appendChild(createElement("p", {
        className: "personal-item-subtitle",
        textContent: data.listening.album.artist,
      }));

      personalGrid.appendChild(listeningCard);
    }

    if (data.chess) {
      const chessCard = createElement("div", {
        className: "personal-card personal-card-multi",
      });

      const cardIcon = createElement("div", { className: "personal-card-icon" });
      cardIcon.appendChild(createIconElement("chess"));
      chessCard.appendChild(cardIcon);

      chessCard.appendChild(createElement("h3", {
        className: "personal-card-title",
        textContent: data.chess.title,
      }));

      const linksContainer = createElement("div", { className: "personal-card-links" });

      Object.values(data.chess.links).forEach((linkData) => {
        const link = createElement("a", {
          href: linkData.url,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "personal-card-link",
        });

        link.appendChild(createElement("span", {
          className: "personal-link-label",
          textContent: linkData.label,
        }));

        const ratingContainer = createElement("span", {
          className: "personal-link-rating-container",
        });
        ratingContainer.appendChild(createElement("span", {
          className: "personal-link-type",
          textContent: linkData.ratingType,
        }));
        ratingContainer.appendChild(createElement("span", {
          className: "personal-link-rating",
          textContent: linkData.rating,
        }));
        link.appendChild(ratingContainer);

        linksContainer.appendChild(link);
      });

      chessCard.appendChild(linksContainer);
      personalGrid.appendChild(chessCard);
    }

    containerDiv.appendChild(personalGrid);
    initCarouselScrollDetection(personalGrid);
  } catch (error) {
    displayError(containerDiv);
  }

  container.appendChild(containerDiv);
}
