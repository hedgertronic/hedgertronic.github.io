/**
 * Data loading utilities.
 */

export let siteConfig = null;

export async function loadSiteConfig() {
  const response = await fetch("/data/site.json");
  siteConfig = await response.json();
  return siteConfig;
}

export function getSiteConfig() {
  return siteConfig;
}

export function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",");
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    rows.push(row);
  }
  return rows;
}
