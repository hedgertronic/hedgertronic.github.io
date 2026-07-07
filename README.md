# hedgertronic.com

A portfolio website showcasing my career highlights across baseball, research, writing, and media. Built with vanilla HTML/CSS/JS and hosted on GitHub Pages.

The home page features five subsections:
- **On the Field**: Highlights from my baseball career, including stats, videos, and training content.
- **In the Lab**: Research projects, presentations, and code, showcasing my technical contributions.
- **On the Page**: My articles and analysis in both long-form and short-form mediums.
- **In the Media**: Podcasts, interviews, and features.
- **Off the Clock**: Personal hobbies and interests.

Additionally, the website includes a resume page along with a downloadable PDF version that is automatically generated to ensure information consistency.

Designed to be lightweight and responsive on the front-end, though admittedly a bit over-engineered on the back-end with JS builds and various testing mechanisms.

## Structure

```
/assets      Fonts, images, documents
/css         Stylesheets
/data        JSON content to define each website section
/src         JavaScript modules (bundled with esbuild)
/tests       Unit and E2E tests
/tools       Python scripts for automation
```

## Development

**Build**
```bash
npm install
npm run build      # Bundle JS and CSS
npm run dev        # Watch mode for development
```

**Test**
```bash
npm test           # JS unit tests (Vitest)
npm run test:e2e   # E2E browser tests (Playwright)
uv run pytest      # Python unit tests
```

## Features

- **Responsive design**: Full-screen hero page with five subsections. Hero section adapts to screen size and orientation for consistent experience across devices.
- **JSON content approach**: Manages website content through JSON files, allowing for easy updates and version control.
- **Theme switcher**: Four color schemes based on a "team colors" concept. Can choose Driveline, Hopkins, Mets, or Phillies to update website accent colors and my photo headshot.
- **Automated workflows**: Resume webpage and PDF automatically generates from JSON file. Open Graph image automatically generates from hero section content and theme. Career stats automatically processed from Baseball Reference data.

## Automated Data Pipeline

A daily GitHub Actions workflow (`.github/workflows/update-data.yml`, cron `17 9 * * *`) fetches fresh data and commits changes to main, then triggers the deploy workflow to publish immediately.

**Automated sources** (`tools/fetch/`):

- **MiLB** (`fetch_milb.py`): Pulls per-team pitching stats from the MLB Stats API across all affiliated levels (AAA–Rk). Writes `assets/documents/milb_api_stats.csv`; `tools/process_stats.py` merges this with Baseball Reference data (college/summer/independent rows stay in bbref; milb rows replace bbref for covered seasons to avoid double-counting).
- **Twitter/X** (`fetch_tweets.py`): Updates retweet, like, and bookmark counts in `data/writing-shortform.json` via the fxtwitter unofficial API.
- **GitHub** (`fetch_github.py`): Syncs stars, forks, language, and description for repos in `data/lab-projects.json` via the GitHub REST API.
- **Substack** (`fetch_substack.py`): Appends new posts from the RSS feed to `data/writing-longform.json`. New entries are appended; existing entries are never removed or reordered.
- **Goodreads** (`fetch_goodreads.py`): Updates the currently-reading book in `data/personal.json` via the shelf RSS feed. Requires `GOODREADS_USER_ID` secret or a `goodreadsUserId` key in `data/site.json`.
- **Chess.com / USCF** (`fetch_chess.py`): Refreshes rapid and regular ratings in `data/personal.json`.

**Interactive helper** (`tools/add_training_post.py`): Assists with adding Instagram training posts — extracts the shortcode, compresses and copies the cover image, and prints a ready-to-paste JSON entry for `data/field-training.json`.

**Not yet automated** (future work):

- **Spotify**: Pull most-listened-to album — requires OAuth flow not feasible in CI.
- **Instagram API**: Automated cover image fetching — Instagram's API requires app review and does not expose public post media to third parties.
