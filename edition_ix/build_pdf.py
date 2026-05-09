"""
build_pdf.py — render Edition IX markdown to a beautifully-styled PDF.

Pipeline:
  1. Read the manuscript markdown.
  2. Convert to HTML via python-markdown with extensions (fenced_code, tables,
     toc, attr_list, footnotes).
  3. Wrap with print-aware CSS using the Edition VIII colophon palette:
        Fraunces (display + body), JetBrains Mono (code),
        Inter Tight (tabular). Bone paper (#f5f1e8), ink (#1a1815),
        terracotta accent (#b8341d), warm sand (#d4a574).
  4. Render via headless Chromium (Google Chrome) to PDF.

The HTML is also saved to disk so a reader can preview / re-render.
"""
from __future__ import annotations
import os
import re
import subprocess
import sys
from pathlib import Path

import markdown


HERE = Path(__file__).parent
MD_PATH = HERE / "LLM_SYSTEMS_ENGINEERING_EDITION_IX.md"
HTML_PATH = HERE / "LLM_SYSTEMS_ENGINEERING_EDITION_IX.html"
PDF_PATH = HERE / "LLM_SYSTEMS_ENGINEERING_EDITION_IX.pdf"


# Edition VIII colophon palette + typography.
CSS = r"""
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,300..900,0..100,0..1&family=Inter+Tight:wght@300..800&family=JetBrains+Mono:wght@300..700&display=swap');

:root {
    --bone:       #f5f1e8;
    --ink:        #1a1815;
    --terracotta: #b8341d;
    --sand:       #d4a574;
    --rule:       #c8bfae;
    --code-bg:    #1a1815;
    --code-fg:    #f5f1e8;
    --code-com:   #968a72;
    --code-key:   #d4a574;
    --code-str:   #c4a896;
    --callout-bg: #efe6d2;
    --callout-bd: #b8341d;
    --hedge-bg:   #f4ecd6;
    --hedge-bd:   #d4a574;
    --rule-bg:    #1a1815;
    --rule-fg:    #f5f1e8;
}

@page {
    size: A4;
    margin: 22mm 18mm 22mm 18mm;
    background: var(--bone);

    @top-left {
        content: "LLM Systems Engineering";
        font-family: "Inter Tight", sans-serif;
        font-size: 8pt;
        color: var(--ink);
        opacity: 0.55;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }
    @top-right {
        content: "Edition IX · 2026";
        font-family: "Inter Tight", sans-serif;
        font-size: 8pt;
        color: var(--ink);
        opacity: 0.55;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }
    @bottom-center {
        content: counter(page);
        font-family: "JetBrains Mono", monospace;
        font-size: 9pt;
        color: var(--terracotta);
    }
}

@page :first {
    margin: 0 !important;
    background: var(--ink);
    @top-left { content: ""; }
    @top-right { content: ""; }
    @bottom-center { content: ""; }
}

* {
    box-sizing: border-box;
}

html {
    background: var(--bone);
}

body {
    font-family: "Fraunces", "Iowan Old Style", Georgia, serif;
    font-feature-settings: "kern" 1, "liga" 1, "calt" 1, "ss01" 1;
    font-variation-settings: "opsz" 18, "SOFT" 30;
    font-weight: 380;
    color: var(--ink);
    background: var(--bone);
    margin: 0;
    padding: 0;
    line-height: 1.55;
    font-size: 10.5pt;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    hyphens: auto;
    text-align: justify;
}

/* Cover page */
.cover {
    background: var(--ink);
    color: var(--bone);
    width: 210mm;
    height: 297mm;
    margin: 0;
    padding: 28mm 22mm 22mm 22mm;
    page-break-after: always;
    page-break-inside: avoid;
    text-align: left;
    hyphens: none;
    position: relative;
    overflow: hidden;
    box-sizing: border-box;
}

.cover .top {
    position: absolute;
    top: 28mm;
    left: 22mm;
    right: 22mm;
}

.cover .middle {
    position: absolute;
    top: 145mm;
    left: 22mm;
    right: 22mm;
}

.cover .bottom {
    position: absolute;
    bottom: 22mm;
    left: 22mm;
    right: 22mm;
}

.cover .label {
    font-family: "Inter Tight", sans-serif;
    font-size: 9pt;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--sand);
    opacity: 0.85;
}

.cover h1 {
    font-family: "Fraunces", serif;
    font-variation-settings: "opsz" 144, "SOFT" 100, "WONK" 1;
    font-weight: 600;
    font-size: 56pt;
    line-height: 0.95;
    letter-spacing: -0.02em;
    margin: 10mm 0 0 0;
    color: var(--bone);
    border: none;
    page-break-before: avoid;
}

.cover h1 em {
    color: var(--terracotta);
    font-style: italic;
    font-variation-settings: "opsz" 144, "SOFT" 100, "WONK" 1;
}

.cover .subtitle {
    font-family: "Fraunces", serif;
    font-variation-settings: "opsz" 36, "SOFT" 100;
    font-style: italic;
    font-weight: 320;
    font-size: 14pt;
    line-height: 1.4;
    color: var(--sand);
    max-width: 130mm;
    margin-top: 6mm;
}

.cover .horizontal-rule {
    height: 1px;
    background: var(--terracotta);
    width: 60mm;
    margin: 8mm 0;
}

.cover .meta {
    font-family: "Inter Tight", sans-serif;
    font-size: 9pt;
    line-height: 1.7;
    color: var(--sand);
    opacity: 0.85;
}

.cover .meta strong {
    color: var(--bone);
    font-weight: 500;
}

.cover .ed-num {
    font-family: "Fraunces", serif;
    font-variation-settings: "opsz" 144, "SOFT" 100;
    font-weight: 300;
    font-size: 80pt;
    color: var(--terracotta);
    line-height: 1;
    margin: 0;
}

.cover .quote {
    font-family: "Fraunces", serif;
    font-style: italic;
    font-size: 14pt;
    line-height: 1.4;
    color: var(--sand);
    border-left: 2px solid var(--terracotta);
    padding-left: 8mm;
    max-width: 130mm;
}

/* Body content wrapper */
main {
    padding: 0 0;
}

/* Headings */
h1, h2, h3, h4, h5, h6 {
    font-family: "Fraunces", serif;
    font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
    font-variation-settings: "opsz" 80, "SOFT" 50;
    color: var(--ink);
    line-height: 1.15;
    margin-top: 1.6em;
    margin-bottom: 0.5em;
    text-align: left;
    hyphens: none;
}

h1 {
    font-weight: 580;
    font-size: 30pt;
    letter-spacing: -0.012em;
    color: var(--ink);
    border-bottom: 0.6mm solid var(--terracotta);
    padding-bottom: 4mm;
    margin-top: 0;
    page-break-before: always;
    page-break-after: avoid;
}

h1:first-child {
    page-break-before: avoid;
}

h2 {
    font-weight: 540;
    font-size: 19pt;
    letter-spacing: -0.005em;
    color: var(--ink);
    margin-top: 1.4em;
    page-break-after: avoid;
}

/* Chapter titles "## NN — Title" get terracotta */
h2[id^="ch-"], h2:has(em:first-child) {
    color: var(--terracotta);
}

h3 {
    font-weight: 520;
    font-size: 14pt;
    color: var(--terracotta);
    text-transform: none;
    page-break-after: avoid;
    margin-top: 1.3em;
}

h4 {
    font-family: "Inter Tight", sans-serif;
    font-weight: 600;
    font-size: 10.5pt;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--terracotta);
    margin-top: 1.2em;
    margin-bottom: 0.4em;
}

h5, h6 {
    font-family: "Inter Tight", sans-serif;
    font-weight: 600;
    font-size: 9.5pt;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--ink);
    opacity: 0.7;
}

/* Part-divider style (h1 starting with "Part ") */
h1:has(em),
h1[id^="part-"] {
    text-align: center;
    font-variation-settings: "opsz" 144, "SOFT" 80;
    font-style: italic;
    color: var(--terracotta);
    border-bottom: none;
    border-top: 1px solid var(--rule);
    border-bottom: 1px solid var(--rule);
    padding: 14mm 0;
    margin: 6mm 0;
    font-weight: 350;
    font-size: 36pt;
    letter-spacing: -0.01em;
}

/* Paragraphs */
p {
    margin: 0 0 0.7em 0;
    orphans: 3;
    widows: 3;
}

p + p {
    text-indent: 0;
}

/* Lead paragraph after a chapter header */
h2 + p, h2 + blockquote + p {
    font-variation-settings: "opsz" 18, "SOFT" 30;
    font-size: 10.5pt;
}

/* Italic blockquote callouts (under-headers / chapter epigraphs) */
h2 + blockquote, h1 + blockquote {
    font-style: italic;
    font-variation-settings: "opsz" 36, "SOFT" 80;
    color: var(--terracotta);
    border-left: 2px solid var(--terracotta);
    background: transparent;
    margin: 0 0 1.5em 0;
    padding: 1mm 0 1mm 6mm;
    font-size: 12pt;
    line-height: 1.45;
}

/* Inline emphasis */
em, i {
    font-style: italic;
    font-variation-settings: "opsz" 18, "SOFT" 80;
}

strong, b {
    font-weight: 620;
    font-variation-settings: "opsz" 18, "SOFT" 30;
}

/* Links */
a {
    color: var(--terracotta);
    text-decoration: none;
    border-bottom: 0.3mm dotted var(--terracotta);
}

/* Horizontal rules */
hr {
    border: none;
    height: 1px;
    background: var(--rule);
    margin: 1.6em 0;
}

/* Quote callouts (the "Key takeaways", "Operational rule", "Hedge", "Production reality") */
blockquote {
    background: var(--callout-bg);
    border-left: 0.8mm solid var(--terracotta);
    padding: 4mm 6mm 4mm 7mm;
    margin: 1.2em 0;
    font-size: 9.8pt;
    line-height: 1.55;
    page-break-inside: avoid;
    border-radius: 0 1.5mm 1.5mm 0;
    color: var(--ink);
    font-style: normal;
    font-variation-settings: "opsz" 18, "SOFT" 30;
}

blockquote p {
    margin: 0 0 0.5em 0;
    text-align: left;
}

blockquote p:last-child {
    margin-bottom: 0;
}

/* Hedge variant */
blockquote:has(strong:first-child) {
    background: var(--callout-bg);
    border-left-color: var(--terracotta);
}

/* Lists */
ul, ol {
    margin: 0.5em 0 0.9em 0;
    padding-left: 5mm;
}

ul li {
    list-style: none;
    position: relative;
    padding-left: 5mm;
    margin-bottom: 0.3em;
}

ul li::before {
    content: "▸";
    color: var(--terracotta);
    position: absolute;
    left: 0;
    top: 0;
    font-size: 9pt;
}

ol li {
    margin-bottom: 0.3em;
    padding-left: 1mm;
}

ol li::marker {
    color: var(--terracotta);
    font-weight: 600;
    font-family: "Inter Tight", sans-serif;
    font-size: 9.5pt;
    font-variant-numeric: tabular-nums;
}

li > p { display: inline; }

/* Code */
code {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.85em;
    color: var(--terracotta);
    background: rgba(184, 52, 29, 0.08);
    padding: 0 0.3em;
    border-radius: 1.5px;
    font-feature-settings: "calt" 1, "ss01" 1;
}

pre {
    font-family: "JetBrains Mono", monospace;
    background: var(--code-bg);
    color: var(--code-fg);
    padding: 4mm 5mm;
    border-radius: 2mm;
    overflow: hidden;
    font-size: 8.0pt;
    line-height: 1.55;
    margin: 1em 0;
    page-break-inside: avoid;
    border-left: 0.8mm solid var(--terracotta);
    text-align: left;
    hyphens: none;
    white-space: pre-wrap;
    word-break: break-word;
    overflow-wrap: anywhere;
    tab-size: 2;
}

pre code {
    background: transparent;
    color: var(--code-fg);
    padding: 0;
    font-size: 1em;
    border-radius: 0;
    white-space: pre-wrap;
    word-break: break-word;
}

/* Tables */
table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.2em 0;
    font-family: "Inter Tight", sans-serif;
    font-size: 9pt;
    page-break-inside: avoid;
    border-top: 0.4mm solid var(--ink);
    border-bottom: 0.4mm solid var(--ink);
}

thead tr {
    border-bottom: 0.2mm solid var(--ink);
}

th {
    text-align: left;
    padding: 2.2mm 3mm;
    font-weight: 600;
    color: var(--ink);
    font-size: 8.6pt;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}

td {
    text-align: left;
    padding: 2mm 3mm;
    vertical-align: top;
    line-height: 1.45;
    font-variant-numeric: tabular-nums;
}

tbody tr {
    border-bottom: 0.1mm solid rgba(26, 24, 21, 0.08);
}

tbody tr:nth-child(even) {
    background: rgba(212, 165, 116, 0.07);
}

tbody tr:hover {
    background: rgba(184, 52, 29, 0.05);
}

td code {
    background: transparent;
    color: var(--ink);
}

/* Right-align numeric columns */
td:has(code), th[align="right"], td[align="right"] {
    text-align: right;
    font-variant-numeric: tabular-nums;
}

/* Equations / display math (markdown does not render TeX, but our manual uses
   text-form equations in indented code or at-sign comments — keep them in mono) */

/* Section anchors */
a.headerlink {
    visibility: hidden;
}

/* Print-tuned heading spacing */
@media print {
    h1 {
        page-break-before: always;
    }
    h2, h3, h4 {
        page-break-after: avoid;
    }
    pre, blockquote, table, figure {
        page-break-inside: avoid;
    }
    p {
        orphans: 3;
        widows: 3;
    }
}

/* Custom: TOC area */
.toc-section {
    column-count: 2;
    column-gap: 12mm;
    column-rule: 0.2mm dotted var(--rule);
    font-size: 9.5pt;
    margin: 2mm 0;
}

.toc-section ol {
    padding-left: 4mm;
}

.toc-section h2,
.toc-section h3,
.toc-section strong {
    column-span: none;
    break-inside: avoid;
}

/* Inline reference tags like [LMSYS-EP-2025], style as small caps */
.ref {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.7em;
    color: var(--terracotta);
    vertical-align: super;
    line-height: 0;
    text-decoration: none;
    border-bottom: none;
}

/* The 'Key takeaways' final paragraph in each chapter — extra emphasis */
blockquote p strong:first-child {
    color: var(--terracotta);
}

/* Drop-cap on first paragraph after a chapter epigraph (h2 + blockquote + p).
   Only applied when the chapter has an italic epigraph quote, ensuring TOC
   entries and other heading-then-paragraph patterns are unaffected. */
h2 + blockquote + p::first-letter {
    font-family: "Fraunces", serif;
    font-variation-settings: "opsz" 144, "SOFT" 100, "WONK" 1;
    font-weight: 580;
    color: var(--terracotta);
    float: left;
    font-size: 5.6em;
    line-height: 0.85;
    margin: 0.05em 0.12em -0.04em 0;
    padding: 0;
}

/* Code listings in dark mode look — mimic Hopper-inspired palette */
pre {
    box-shadow: 0 0 0 0.25mm rgba(184, 52, 29, 0.3);
}

/* Fancier first paragraph of preface */
.preface-first::first-line {
    font-variant: small-caps;
    letter-spacing: 0.05em;
    color: var(--terracotta);
}
"""


COVER_HTML = r"""
<section class="cover">
    <div class="top">
        <div class="label">A FIELD MANUAL · EDITION IX · 2026</div>
        <h1>LLM Systems<br/><em>Engineering.</em></h1>
        <div class="horizontal-rule"></div>
        <p class="subtitle">Inside modern inference, serving, and GPU execution
        pipelines, for engineers who build the substrate, not the surface.</p>
    </div>
    <div class="middle">
        <p class="quote">The GPU is not an accelerator, it is the runtime.<br/>
        The CPU-side serving code is little more than a controller for a state
        machine that lives entirely in HBM.</p>
    </div>
    <div class="bottom">
        <div class="ed-num">IX</div>
        <div class="meta">
            <strong>Lorenzo Bradanini</strong> &nbsp;·&nbsp;
            <strong>Lorenzo Tettamanti</strong><br/>
            THE SOFTWARE FRONTIER &nbsp;·&nbsp; 40 CHAPTERS &nbsp;·&nbsp; 76 SOURCES<br/>
            REVISED FROM EDITION VIII THROUGH PRIMARY-SOURCE AUDIT
        </div>
    </div>
</section>
"""


def md_to_html(md_text: str) -> str:
    """Convert markdown to HTML using python-markdown."""
    md = markdown.Markdown(
        extensions=[
            "fenced_code",
            "tables",
            "toc",
            "attr_list",
            "footnotes",
            "md_in_html",
            "smarty",
        ],
        extension_configs={
            "smarty": {
                "smart_dashes": False,  # we handle this ourselves
                "smart_quotes": True,
                "smart_ellipses": True,
                "smart_angled_quotes": False,
            },
        },
    )
    html = md.convert(md_text)

    # Style reference tags like [LMSYS-EP-2025] / [NVIDIA-MLPerf-v4.1] / [V1-detok]
    # as superscripted small caps.
    html = re.sub(
        r"\[([A-Z][A-Za-z0-9._\-]*)\]",
        r'<sup class="ref">[\1]</sup>',
        html,
    )

    # Replace the first H1 (the cover/title) with our cover section.
    # Skip everything until the "## Contents" or the first ## section.
    return html


def assemble_full_html(body_html: str) -> str:
    """Wrap body in a complete HTML document with embedded CSS."""
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>LLM Systems Engineering — Edition IX</title>
<style>
{CSS}
</style>
</head>
<body>
{COVER_HTML}
<main>
{body_html}
</main>
</body>
</html>
"""


def render_to_pdf(html_path: Path, pdf_path: Path) -> None:
    """Render HTML → PDF via headless Google Chrome."""
    cmd = [
        "google-chrome",
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--no-pdf-header-footer",
        "--print-to-pdf=" + str(pdf_path),
        "--print-to-pdf-no-header",
        "--virtual-time-budget=10000",  # let fonts/CSS settle
        "file://" + str(html_path),
    ]
    print("[build_pdf]", " ".join(cmd))
    subprocess.run(cmd, check=True)


def strip_cover_h1(md_text: str) -> str:
    """Remove the first H1 line ('# LLM Systems Engineering — A Field Manual')
    since the cover provides the title."""
    lines = md_text.splitlines()
    out = []
    skipped_h1 = False
    for line in lines:
        if not skipped_h1 and line.lstrip().startswith("# "):
            skipped_h1 = True
            continue
        out.append(line)
    return "\n".join(out)


def main() -> int:
    md_text = MD_PATH.read_text(encoding="utf-8")
    md_text = strip_cover_h1(md_text)
    body_html = md_to_html(md_text)
    full_html = assemble_full_html(body_html)
    HTML_PATH.write_text(full_html, encoding="utf-8")
    print(f"[build_pdf] wrote {HTML_PATH} ({len(full_html):,} bytes)")
    render_to_pdf(HTML_PATH, PDF_PATH)
    if PDF_PATH.exists():
        size_mb = PDF_PATH.stat().st_size / 1e6
        print(f"[build_pdf] PDF generated: {PDF_PATH} ({size_mb:.2f} MB)")
        return 0
    print("[build_pdf] ERROR: PDF was not generated.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
