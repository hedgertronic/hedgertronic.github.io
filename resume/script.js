/**
 * =============================================================================
 * RESUME PAGE SCRIPT
 * =============================================================================
 *
 * Handles rendering of the resume page from JSON data.
 *
 * DEPENDENCIES (from script.js):
 * - createElement()      - DOM element factory
 * - createIconElement()  - Icon span factory
 * - renderFooter()       - Footer with theme switcher
 * - initThemeSwitcher()  - Theme toggle functionality
 *
 * DATA SOURCES:
 * - /data/resume.json    - Resume content (experience, education, skills)
 * - /data/site.json      - Profile info and social links
 *
 * =============================================================================
 */

/**
 * Initialize the resume page by loading data and rendering content.
 */
async function initResume() {
    try {
        const response = await fetch('/data/resume.json');
        const resume = await response.json();

        const siteResponse = await fetch('/data/site.json');
        const siteConfig = await siteResponse.json();

        renderResume(resume, siteConfig);
        renderFooter(siteConfig);
        initThemeSwitcher();

        const downloadBtn = document.getElementById('download-pdf');
        if (downloadBtn && resume.pdfUrl) {
            downloadBtn.href = resume.pdfUrl;
        }
    } catch (error) {
        console.error('Error loading resume:', error);
        const errorMsg = document.createElement('p');
        errorMsg.textContent = 'Error loading resume content.';
        document.getElementById('resume-content').appendChild(errorMsg);
    }
}

/**
 * Render resume content into the page.
 * Creates hero section, experience, education, skills, and projects.
 *
 * @param {Object} resume - Resume data from resume.json
 * @param {Object} siteConfig - Site config from site.json (for profile/socials)
 */
function renderResume(resume, siteConfig) {
    const container = document.getElementById('resume-content');
    if (!container) return;

    container.textContent = '';

    const heroIntro = createElement('div', { className: 'hero-intro resume-hero-intro' });

    heroIntro.appendChild(createElement('img', {
        src: siteConfig.profile.headshot,
        alt: siteConfig.profile.name,
        className: 'hero-headshot'
    }));

    heroIntro.appendChild(createElement('h1', { className: 'hero-name', textContent: siteConfig.profile.name }));
    heroIntro.appendChild(createElement('p', { className: 'hero-description', textContent: siteConfig.profile.bio }));

    const socialLinks = createElement('div', { className: 'social-links' });
    siteConfig.socials.forEach(social => {
        if (social.platform === 'resume') return;

        const link = createElement('a', {
            href: social.url,
            target: '_blank',
            rel: 'noopener noreferrer'
        });
        link.setAttribute('aria-label', social.label);
        link.appendChild(createIconElement(social.platform));
        socialLinks.appendChild(link);
    });
    heroIntro.appendChild(socialLinks);
    container.appendChild(heroIntro);

    const mainGrid = createElement('div', { className: 'resume-grid' });
    const leftCol = createElement('div', { className: 'resume-col resume-col-main' });

    const expSection = createElement('section', { className: 'resume-section' });
    expSection.appendChild(createElement('h2', { className: 'resume-section-title', textContent: 'Experience' }));

    resume.experience.forEach(job => {
        const jobEl = createElement('div', { className: 'resume-item' });

        const jobHeader = createElement('div', { className: 'resume-item-header' });
        jobHeader.appendChild(createElement('h3', { className: 'resume-item-title', textContent: job.company }));
        jobHeader.appendChild(createElement('span', { className: 'resume-item-dates', textContent: job.dates }));
        jobEl.appendChild(jobHeader);

        const roleRow = createElement('div', { className: 'resume-item-role' });
        roleRow.appendChild(createElement('span', { className: 'resume-role-title', textContent: job.title }));
        if (job.location) {
            roleRow.appendChild(createElement('span', { className: 'resume-item-location', textContent: job.location }));
        }
        jobEl.appendChild(roleRow);

        if (job.highlights && job.highlights.length > 0) {
            const highlights = createElement('ul', { className: 'resume-highlights' });
            job.highlights.forEach(h => {
                highlights.appendChild(createElement('li', { textContent: h }));
            });
            jobEl.appendChild(highlights);
        }

        expSection.appendChild(jobEl);
    });
    leftCol.appendChild(expSection);
    mainGrid.appendChild(leftCol);

    const rightCol = createElement('div', { className: 'resume-col resume-col-side' });

    const eduSection = createElement('section', { className: 'resume-section' });
    eduSection.appendChild(createElement('h2', { className: 'resume-section-title', textContent: 'Education' }));

    resume.education.forEach(edu => {
        const eduEl = createElement('div', { className: 'resume-item' });
        eduEl.appendChild(createElement('h3', { className: 'resume-item-title', textContent: edu.institution }));
        eduEl.appendChild(createElement('p', { className: 'resume-item-subtitle', textContent: edu.degree }));
        eduEl.appendChild(createElement('span', { className: 'resume-item-dates', textContent: edu.dates }));
        eduSection.appendChild(eduEl);
    });
    rightCol.appendChild(eduSection);

    const skillsSection = createElement('section', { className: 'resume-section' });
    skillsSection.appendChild(createElement('h2', { className: 'resume-section-title', textContent: 'Skills' }));

    const techSkills = createElement('div', { className: 'resume-skills-group' });
    const techTags = createElement('div', { className: 'resume-skill-tags' });
    resume.skills.technical.forEach(skill => {
        techTags.appendChild(createElement('span', { className: 'resume-skill-tag', textContent: skill }));
    });
    techSkills.appendChild(techTags);
    skillsSection.appendChild(techSkills);
    rightCol.appendChild(skillsSection);

    const projSection = createElement('section', { className: 'resume-section' });
    projSection.appendChild(createElement('h2', { className: 'resume-section-title', textContent: 'Projects' }));

    resume.projects.forEach(proj => {
        // Make whole card a link if URL exists, otherwise use div
        const projEl = proj.url
            ? createElement('a', {
                href: proj.url,
                target: '_blank',
                rel: 'noopener noreferrer',
                className: 'resume-item resume-project resume-project-link'
            })
            : createElement('div', { className: 'resume-item resume-project' });

        const projHeader = createElement('div', { className: 'resume-project-header' });
        projHeader.appendChild(createElement('span', { className: 'resume-project-title', textContent: proj.name }));
        if (proj.date) {
            projHeader.appendChild(createElement('span', { className: 'resume-project-date', textContent: proj.date }));
        }
        projEl.appendChild(projHeader);

        projEl.appendChild(createElement('p', { className: 'resume-project-desc', textContent: proj.description }));

        if (proj.technologies && proj.technologies.length > 0) {
            const techRow = createElement('div', { className: 'resume-project-tech' });
            proj.technologies.forEach(tech => {
                techRow.appendChild(createElement('span', { className: 'resume-tech-tag', textContent: tech }));
            });
            projEl.appendChild(techRow);
        }

        projSection.appendChild(projEl);
    });
    rightCol.appendChild(projSection);

    mainGrid.appendChild(rightCol);
    container.appendChild(mainGrid);
}

document.addEventListener('DOMContentLoaded', initResume);
