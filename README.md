# hedgertronic.com

A portfolio website showcasing my career highlights across baseball, research, writing, and media. Built with vanilla HTML/CSS/JS and hosted on GitHub Pages.

The home page features five subsections:
- **On the Field**: Highlights from my baseball career, including stats, videos, and training content.
- **In the Lab**: Research projects, presentations, and code, showcasing my technical contributions.
- **On the Page**: My articles and analysis in both long-form and short-form mediums.
- **In the Media**: Podcasts, interviews, and features.
- **Off the Clock**: Personal hobbies and interests.

Additionally, the website includes a resume page along with a downloadable PDF version that is automatically generated to ensure information consistency.

## Structure

```
/assets      Fonts, images, documents
/data        JSON content to define each website section
/tools       Python scripts for automation
```

## Features

- **Responsive design**: Full-screen hero page with five subsections. Hero section adapts to screen size and orientation for consistent experience across devices.
- **JSON content approach**: Manages website content through JSON files, allowing for easy updates and version control.
- **Theme switcher**: Four color schemes based on a "team colors" concept. Can choose Driveline, Hopkins, Mets, or Phillies to update website accent colors and my photo headshot.
- **Automated workflows**: Resume PDF automatically generates from resume webpage content. Open Graph image automatically generates from hero section content. Career stats automatically processed from Baseball Reference CSV data.

## Future Plans

Automate data fetching to reduce manual updates:

- **MiLB**: Pull career and season stats.
- **Twitter/X**: Sync likes, retweets, and bookmarks for content curation.
- **GitHub**: Fetch repo stats and descriptions.
- **Instagram**: Pull cover images for training section.
- **Substack**: Fetch new blog posts and cover images.
- **Goodreads**: Get books that I am currently reading.
- **Spotify**: Pull most listened to album over the recent past.
- **USCF/Chess.com**: Update chess ratings.
