#!/usr/bin/env python3
"""Generate a PDF resume from resume.json data."""

import json
import urllib.request
from pathlib import Path
from fpdf import FPDF
from fpdf.enums import XPos, YPos

# Project root (one level up from scripts/)
PROJECT_ROOT = Path(__file__).parent.parent

# Design constants
ACCENT_COLOR = (37, 99, 235)
DARK_TEXT = (17, 24, 39)
MEDIUM_TEXT = (75, 85, 99)
LIGHT_TEXT = (107, 114, 128)
RULE_COLOR = (229, 231, 235)

FONTS_DIR = PROJECT_ROOT / "assets" / "fonts"


def ensure_fonts():
    """Download DM Sans font if not present."""
    dm_sans = FONTS_DIR / "DMSans.ttf"

    if dm_sans.exists():
        return True

    print("Downloading DM Sans font...")
    FONTS_DIR.mkdir(exist_ok=True)

    # Download DM Sans variable font from Google Fonts
    url = "https://github.com/googlefonts/dm-fonts/raw/main/Sans/variable/DMSans%5Bopsz%2Cwght%5D.ttf"

    try:
        urllib.request.urlretrieve(url, dm_sans)
        print("Font downloaded successfully.")
        return True
    except Exception as e:
        print(f"Could not download font: {e}")
        print("Falling back to Helvetica.")
        return False


class ResumePDF(FPDF):
    def __init__(self, use_custom_fonts: bool = True):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=18)
        self.set_margins(18, 18, 18)
        self.use_custom_fonts = use_custom_fonts

        if use_custom_fonts:
            self.add_font("DMSans", "", str(FONTS_DIR / "DMSans.ttf"))
            self.add_font("DMSans", "B", str(FONTS_DIR / "DMSans.ttf"))
            self.add_font("DMSans", "I", str(FONTS_DIR / "DMSans.ttf"))
            self.font_family = "DMSans"
        else:
            self.font_family = "Helvetica"

    def header_section(self, name: str, contact: dict):
        # Name - compact
        self.set_font(self.font_family, "B", 18)
        self.set_text_color(*DARK_TEXT)
        self.cell(0, 8, name, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        self.ln(1)

        # Contact info: email, phone, twitter
        all_parts = []
        if contact.get("email"):
            all_parts.append(contact["email"])
        if contact.get("phone"):
            all_parts.append(contact["phone"])
        if contact.get("twitter"):
            all_parts.append(contact["twitter"])

        self.set_font(self.font_family, "", 8)
        self.set_text_color(*MEDIUM_TEXT)
        self.cell(0, 4, "  |  ".join(all_parts), new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")

        self.ln(4)

    def section_title(self, title: str):
        self.ln(3)

        # Section title with accent styling
        self.set_font(self.font_family, "B", 11)
        self.set_text_color(*ACCENT_COLOR)
        self.cell(0, 7, title.upper(), new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        # Full-width subtle line
        self.set_draw_color(*RULE_COLOR)
        self.line(18, self.get_y(), 192, self.get_y())
        self.ln(5)

    def experience_entry(self, title: str, company: str, location: str, dates: str, highlights: list):
        # Job title - prominent
        self.set_font(self.font_family, "B", 11)
        self.set_text_color(*DARK_TEXT)
        title_width = self.get_string_width(title) + 4
        self.cell(title_width, 6, title)

        # Dates - right aligned, lighter
        self.set_font(self.font_family, "", 9)
        self.set_text_color(*LIGHT_TEXT)
        self.cell(0, 6, dates, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="R")

        # Company & Location - secondary info
        self.set_font(self.font_family, "", 10)
        self.set_text_color(*MEDIUM_TEXT)
        self.cell(0, 5, f"{company}  |  {location}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        # Highlights with custom bullet
        if highlights:
            self.ln(2)
            self.set_font(self.font_family, "", 9)
            for highlight in highlights:
                # Draw bullet
                self.set_x(22)
                self.set_text_color(*ACCENT_COLOR)
                self.cell(5, 4.5, ">")

                # Temporarily adjust left margin so wrapped lines align
                old_l_margin = self.l_margin
                self.set_left_margin(27)
                self.set_text_color(*DARK_TEXT)
                self.multi_cell(0, 4.5, highlight)
                self.set_left_margin(old_l_margin)
        self.ln(5)

    def project_entry(self, name: str, description: str, technologies: list, url: str = None):
        # Project name
        self.set_font(self.font_family, "B", 10)
        self.set_text_color(*DARK_TEXT)
        self.cell(0, 6, name, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        # Description
        self.set_font(self.font_family, "", 9)
        self.set_text_color(*MEDIUM_TEXT)
        self.multi_cell(0, 4.5, description)

        # Technologies as inline tags
        if technologies:
            self.set_x(18)
            self.set_font(self.font_family, "I", 8)
            self.set_text_color(*LIGHT_TEXT)
            tech_text = " / ".join(technologies)
            self.multi_cell(0, 4, tech_text)
        self.ln(4)

    def skills_section(self, skills: list):
        # Skills in a wrapped format with visual separators
        self.set_font(self.font_family, "", 10)
        self.set_text_color(*DARK_TEXT)

        # Create skill groups - split into rows for better readability
        skills_text = "   /   ".join(skills)
        self.multi_cell(0, 5.5, skills_text, align="C")
        self.ln(2)

    def education_entry(self, institution: str, degree: str, dates: str):
        # Institution + dates
        self.set_font(self.font_family, "B", 11)
        self.set_text_color(*DARK_TEXT)
        inst_width = self.get_string_width(institution) + 4
        self.cell(inst_width, 6, institution)

        self.set_font(self.font_family, "", 9)
        self.set_text_color(*LIGHT_TEXT)
        self.cell(0, 6, dates, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="R")

        # Degree
        self.set_font(self.font_family, "", 10)
        self.set_text_color(*MEDIUM_TEXT)
        self.cell(0, 5, degree, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(3)


def load_resume():
    with open(PROJECT_ROOT / "data/resume.json", "r") as f:
        return json.load(f)


def generate_pdf(resume: dict, output_path: str, use_custom_fonts: bool = True):
    pdf = ResumePDF(use_custom_fonts=use_custom_fonts)
    pdf.add_page()

    # Header
    pdf.header_section("Josh Hejka", resume.get("contact", {}))

    # Experience
    if resume.get("experience"):
        pdf.section_title("Experience")
        for exp in resume["experience"]:
            pdf.experience_entry(
                exp["title"],
                exp["company"],
                exp["location"],
                exp["dates"],
                exp.get("highlights", [])
            )

    # Education
    if resume.get("education"):
        pdf.section_title("Education")
        for edu in resume["education"]:
            pdf.education_entry(edu["institution"], edu["degree"], edu["dates"])

    # Skills
    if resume.get("skills", {}).get("technical"):
        pdf.section_title("Skills")
        pdf.skills_section(resume["skills"]["technical"])

    # Projects
    if resume.get("projects"):
        pdf.section_title("Projects")
        for proj in resume["projects"]:
            pdf.project_entry(
                proj["name"],
                proj["description"],
                proj.get("technologies", []),
                proj.get("url")
            )

    pdf.output(output_path)
    print(f"PDF generated: {output_path}")


def main():
    resume = load_resume()

    docs_dir = PROJECT_ROOT / "assets" / "documents"
    docs_dir.mkdir(parents=True, exist_ok=True)

    use_custom_fonts = ensure_fonts()
    generate_pdf(resume, str(docs_dir / "resume.pdf"), use_custom_fonts=use_custom_fonts)


if __name__ == "__main__":
    main()
