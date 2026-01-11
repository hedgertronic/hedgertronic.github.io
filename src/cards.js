/**
 * Card rendering and display functions.
 */

import { ICONS } from "./icons.js";
import { setTrustedHTML, createIconElement } from "./dom.js";
import { initCarouselScrollDetection, displayEmptyState, formatDate, isWithinDays, sortByDate } from "./ui.js";

export function displayError(containerOrId) {
  const container =
    typeof containerOrId === "string"
      ? document.getElementById(containerOrId)
      : containerOrId;
  if (!container) return;

  const errorMsg = document.createElement("p");
  errorMsg.textContent = "Content not available.";
  errorMsg.style.color = "var(--text-muted)";
  errorMsg.style.fontStyle = "italic";
  container.appendChild(errorMsg);
}

/**
 * Unified display function for all card types.
 */
export function displayItems(containerOrId, items, options = {}) {
  const container =
    typeof containerOrId === "string"
      ? document.getElementById(containerOrId)
      : containerOrId;
  if (!container) return;
  container.textContent = "";

  // Apply optional container class override
  if (options.containerClass) {
    container.className = options.containerClass;
  }

  const emptyMessage = options.emptyMessage || "No items to display yet.";
  if (!items || items.length === 0) {
    displayEmptyState(container, emptyMessage);
    return;
  }

  // Sort items based on type
  let sortedItems;
  if (options.type === "projects") {
    sortedItems = items.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (b.stars || 0) - (a.stars || 0);
    });
  } else {
    sortedItems = sortByDate(items);
  }

  // Create and append cards based on type
  sortedItems.forEach((item) => {
    let card;
    switch (options.type) {
      case "projects":
        card = createProjectCard(item);
        break;
      case "tweets":
        card = createTweetCard(item, options.handle);
        break;
      default:
        card = createContentCard(item);
    }
    container.appendChild(card);
  });

  initCarouselScrollDetection(container);
}

// Legacy wrapper functions for backwards compatibility
export function displayProjects(containerOrId, projects) {
  displayItems(containerOrId, projects, {
    type: "projects",
    emptyMessage: "No projects to display yet."
  });
}

export function displayContent(containerOrId, items) {
  displayItems(containerOrId, items, {
    type: "content",
    emptyMessage: "No items to display yet."
  });
}

export function displayTweets(containerOrId, items, handle) {
  displayItems(containerOrId, items, {
    type: "tweets",
    emptyMessage: "No tweets to display yet.",
    handle: handle
  });
}

// GitHub language colors
const LANGUAGE_COLORS = {
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  TypeScript: "#3178c6",
  Swift: "#F05138",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Ruby: "#701516",
  Go: "#00ADD8",
  Rust: "#dea584",
  PHP: "#4F5D95",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Kotlin: "#A97BFF",
  R: "#198CE7",
  Jupyter: "#DA5B0B",
};

export function createProjectCard(project) {
  const card = document.createElement("a");
  card.className = project.pinned ? "content-card project-card pinned" : "content-card project-card";
  card.href = project.url;
  card.target = "_blank";
  card.rel = "noopener noreferrer";

  // Title at top
  const title = document.createElement("h3");
  title.textContent = project.title;
  card.appendChild(title);

  // Badge row (pinned/new/gist)
  const isNew = project.date && isWithinDays(project.date, 30);
  const isGist = project.url && project.url.includes("gist.github.com");
  if (isNew || project.pinned || isGist) {
    const badgeRow = document.createElement("div");
    badgeRow.className = "card-badge-row";

    if (project.pinned) {
      const pinnedBadge = document.createElement("span");
      pinnedBadge.className = "pinned-badge";
      pinnedBadge.textContent = "Pinned";
      badgeRow.appendChild(pinnedBadge);
    }

    if (isNew) {
      const newBadge = document.createElement("span");
      newBadge.className = "new-badge";
      newBadge.textContent = "New";
      badgeRow.appendChild(newBadge);
    }

    if (isGist) {
      const gistBadge = document.createElement("span");
      gistBadge.className = "gist-badge";
      gistBadge.textContent = "Gist";
      badgeRow.appendChild(gistBadge);
    }

    card.appendChild(badgeRow);
  }

  // Description (flex: 1 to fill space)
  const content = document.createElement("div");
  content.className = "project-content";

  if (project.description && project.description.trim()) {
    const desc = document.createElement("p");
    desc.className = "card-description";
    desc.textContent = project.description;
    content.appendChild(desc);
  }

  if (project.topics && project.topics.length > 0) {
    const topics = document.createElement("div");
    topics.className = "project-topics";
    project.topics.slice(0, 3).forEach((topic) => {
      const tag = document.createElement("span");
      tag.className = "project-topic";
      tag.textContent = topic;
      topics.appendChild(tag);
    });
    content.appendChild(topics);
  }

  card.appendChild(content);

  // Stats row at bottom (language, stars, forks)
  const hasStats = project.language || project.stars !== undefined || project.forks !== undefined;
  if (hasStats) {
    const statsRow = document.createElement("div");
    statsRow.className = "project-stats";

    if (project.language) {
      const language = document.createElement("span");
      language.className = "project-language";

      const langColor = LANGUAGE_COLORS[project.language] || "#858585";
      const langDot = document.createElement("span");
      langDot.className = "language-dot";
      langDot.style.backgroundColor = langColor;
      language.appendChild(langDot);

      language.appendChild(document.createTextNode(project.language));
      statsRow.appendChild(language);
    }

    if (project.stars !== undefined) {
      const stars = document.createElement("span");
      stars.className = "project-stat";

      const starIcon = document.createElement("span");
      starIcon.className = "icon-wrapper";
      setTrustedHTML(starIcon, '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/></svg>');
      stars.appendChild(starIcon);

      const starCount = document.createElement("span");
      starCount.textContent = project.stars;
      stars.appendChild(starCount);

      statsRow.appendChild(stars);
    }

    if (project.forks !== undefined) {
      const forks = document.createElement("span");
      forks.className = "project-stat";

      const forkIcon = document.createElement("span");
      forkIcon.className = "icon-wrapper";
      setTrustedHTML(forkIcon, '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/></svg>');
      forks.appendChild(forkIcon);

      const forkCount = document.createElement("span");
      forkCount.textContent = project.forks;
      forks.appendChild(forkCount);

      statsRow.appendChild(forks);
    }

    card.appendChild(statsRow);
  }

  return card;
}

export function createTweetCard(item, handle) {
  const card = document.createElement("a");
  card.className = item.pinned ? "tweet-card pinned" : "tweet-card";
  card.href = item.url;
  card.target = "_blank";
  card.rel = "noopener noreferrer";

  // Header with X logo and handle
  const header = document.createElement("div");
  header.className = "tweet-header";

  const handleEl = document.createElement("div");
  handleEl.className = "tweet-handle";
  handleEl.textContent = `@${handle}`;
  header.appendChild(handleEl);

  const date = document.createElement("span");
  date.className = "tweet-date";
  date.textContent = formatDate(item.date);
  header.appendChild(date);

  card.appendChild(header);

  const isNew = isWithinDays(item.date, 30);
  if (isNew || item.pinned) {
    const badgeRow = document.createElement("div");
    badgeRow.className = "card-badge-row";

    if (item.pinned) {
      const pinnedBadge = document.createElement("span");
      pinnedBadge.className = "pinned-badge";
      pinnedBadge.textContent = "Pinned";
      badgeRow.appendChild(pinnedBadge);
    }

    if (isNew) {
      const newBadge = document.createElement("span");
      newBadge.className = "new-badge";
      newBadge.textContent = "New";
      badgeRow.appendChild(newBadge);
    }

    card.appendChild(badgeRow);
  }

  // Tweet content
  const content = document.createElement("div");
  content.className = "tweet-content";

  const textEl = document.createElement("p");
  textEl.className = "tweet-text";

  // Truncate to 280 characters
  let tweetText = item.text || item.title;
  const isTruncated = tweetText.length > 280;
  if (isTruncated) {
    tweetText = tweetText.substring(0, 280).trim() + "...";
  }

  // Parse @mentions and create styled spans
  const parts = tweetText.split(/(@\w+)/g);
  parts.forEach((part) => {
    if (part.startsWith("@")) {
      const mention = document.createElement("span");
      mention.className = "tweet-mention";
      mention.textContent = part;
      textEl.appendChild(mention);
    } else {
      textEl.appendChild(document.createTextNode(part));
    }
  });

  content.appendChild(textEl);
  card.appendChild(content);

  // Stats row (retweets, likes, bookmarks)
  if (item.retweets !== undefined || item.likes !== undefined || item.bookmarks !== undefined) {
    const stats = document.createElement("div");
    stats.className = "tweet-stats";

    if (item.retweets !== undefined) {
      const stat = document.createElement("span");
      stat.className = "tweet-stat";
      stat.appendChild(createIconElement("retweet"));
      stat.appendChild(document.createTextNode(item.retweets.toLocaleString()));
      stats.appendChild(stat);
    }
    if (item.likes !== undefined) {
      const stat = document.createElement("span");
      stat.className = "tweet-stat";
      stat.appendChild(createIconElement("heart"));
      stat.appendChild(document.createTextNode(item.likes.toLocaleString()));
      stats.appendChild(stat);
    }
    if (item.bookmarks !== undefined) {
      const stat = document.createElement("span");
      stat.className = "tweet-stat";
      stat.appendChild(createIconElement("bookmark"));
      stat.appendChild(document.createTextNode(item.bookmarks.toLocaleString()));
      stats.appendChild(stat);
    }

    card.appendChild(stats);
  }

  return card;
}

export function createContentCard(item) {
  const card = document.createElement("a");
  card.className = item.pinned ? "content-card pinned" : "content-card";
  card.href = item.url;
  card.target = "_blank";
  card.rel = "noopener noreferrer";

  const isNew = isWithinDays(item.date, 30);
  const hasBadges = isNew || item.pinned;

  if (item.thumbnail) {
    const thumbWrapper = document.createElement("div");
    thumbWrapper.className = "thumbnail-wrapper";

    const thumb = document.createElement("img");
    thumb.className = "thumbnail";
    thumb.src = item.thumbnail;
    thumb.alt = item.title;
    thumb.loading = "lazy";
    thumb.referrerPolicy = "no-referrer";
    thumbWrapper.appendChild(thumb);

    if (hasBadges) {
      const badgeContainer = document.createElement("div");
      badgeContainer.className = "card-badge-overlay";

      if (item.pinned) {
        const pinnedBadge = document.createElement("span");
        pinnedBadge.className = "pinned-badge";
        pinnedBadge.textContent = "Pinned";
        badgeContainer.appendChild(pinnedBadge);
      }

      if (isNew) {
        const newBadge = document.createElement("span");
        newBadge.className = "new-badge";
        newBadge.textContent = "New";
        badgeContainer.appendChild(newBadge);
      }

      thumbWrapper.appendChild(badgeContainer);
    }

    card.appendChild(thumbWrapper);
  }

  const metaRow = document.createElement("div");
  metaRow.className = "card-meta-row";

  const metaLeft = document.createElement("div");
  metaLeft.className = "card-meta-left";

  const date = document.createElement("span");
  date.className = "date";
  date.textContent = formatDate(item.date);
  metaLeft.appendChild(date);

  // Show badges in meta row only if there's no thumbnail
  if (!item.thumbnail && hasBadges) {
    if (item.pinned) {
      const pinnedBadge = document.createElement("span");
      pinnedBadge.className = "pinned-badge";
      pinnedBadge.textContent = "Pinned";
      metaLeft.appendChild(pinnedBadge);
    }

    if (isNew) {
      const newBadge = document.createElement("span");
      newBadge.className = "new-badge";
      newBadge.textContent = "New";
      metaLeft.appendChild(newBadge);
    }
  }

  metaRow.appendChild(metaLeft);

  if (item.source) {
    const source = document.createElement("span");
    source.className = "source";
    source.textContent = item.source;
    metaRow.appendChild(source);
  }

  card.appendChild(metaRow);

  const title = document.createElement("h3");
  title.textContent = item.title;
  card.appendChild(title);

  if (item.authors && item.authors.length > 0) {
    const authors = document.createElement("div");
    authors.className = "authors";
    authors.textContent = item.authors.join(", ");
    card.appendChild(authors);
  }

  if (
    item.retweets !== undefined ||
    item.likes !== undefined ||
    item.bookmarks !== undefined
  ) {
    const statsRow = document.createElement("div");
    statsRow.className = "tweet-stats";

    if (item.retweets !== undefined) {
      const retweets = document.createElement("span");
      retweets.className = "tweet-stat";
      const retweetIcon = document.createElement("span");
      retweetIcon.className = "tweet-stat-icon";
      setTrustedHTML(retweetIcon, ICONS.retweet);
      retweets.appendChild(retweetIcon);
      retweets.appendChild(
        document.createTextNode(item.retweets.toLocaleString()),
      );
      statsRow.appendChild(retweets);
    }

    if (item.likes !== undefined) {
      const likes = document.createElement("span");
      likes.className = "tweet-stat";
      const likeIcon = document.createElement("span");
      likeIcon.className = "tweet-stat-icon";
      setTrustedHTML(likeIcon, ICONS.heart);
      likes.appendChild(likeIcon);
      likes.appendChild(document.createTextNode(item.likes.toLocaleString()));
      statsRow.appendChild(likes);
    }

    if (item.bookmarks !== undefined) {
      const bookmarks = document.createElement("span");
      bookmarks.className = "tweet-stat";
      const bookmarkIcon = document.createElement("span");
      bookmarkIcon.className = "tweet-stat-icon";
      setTrustedHTML(bookmarkIcon, ICONS.bookmark);
      bookmarks.appendChild(bookmarkIcon);
      bookmarks.appendChild(
        document.createTextNode(item.bookmarks.toLocaleString()),
      );
      statsRow.appendChild(bookmarks);
    }

    card.appendChild(statsRow);
  }

  if (item.description && item.description.trim()) {
    const desc = document.createElement("p");
    desc.className = "card-description";
    desc.textContent = item.description;
    card.appendChild(desc);
  }

  return card;
}
