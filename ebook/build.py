#!/usr/bin/env python3
"""
Buduje e-book PDF z fragmentów HTML.

    python3 build.py

Kroki:
  1. skleja src/*.html w jeden dokument (wg numeracji nazw plików)
  2. renderuje do PDF przez Chromium (headless)
  3. nanosi numery stron na strony treściowe
     (okładka, strona redakcyjna, spis treści i przekładki są pomijane —
      rozpoznawane po ukrytym znaczniku NOFOLIO_TOKEN)
"""

import io
import re
import shutil
import subprocess
import sys
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = Path(__file__).parent
BUILD = ROOT / "build"
STYLE = ROOT / "src" / "style.css"  # wspólny arkusz stylów dla obu publikacji

AUTHOR = "Karolina Gleinert"

BOOKS = {
    "ebook": {
        "src": ROOT / "src",
        "out": ROOT / "Biznes-Oriflame-od-zera-do-zespolu.pdf",
        "title": "Od zera do zespołu",
        "subject": "Praktyczny kurs sprzedaży i social sellingu dla konsultantek",
    },
    "lead": {
        "src": ROOT / "src-lead",
        "out": ROOT / "10-wiadomosci-ktore-sprzedaja.pdf",
        "title": "10 wiadomości, które sprzedają",
        "subject": "Gotowe wiadomości dla konsultantek — materiał bezpłatny",
    },
}

BOOK = BOOKS["ebook"]  # nadpisywane w main() na podstawie argumentu

NOFOLIO_TOKEN = "§§NF§§"

CHROME_CANDIDATES = [
    "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    "/opt/pw-browsers/chromium/chrome-linux/chrome",
    shutil.which("chromium") or "",
    shutil.which("google-chrome") or "",
]

FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

FOLIO_COLOR = HexColor("#A8792F")
RULE_COLOR = HexColor("#E3D5C5")


def find_chrome() -> str:
    for c in CHROME_CANDIDATES:
        if c and Path(c).exists():
            return c
    sys.exit("Nie znaleziono przeglądarki Chromium do renderowania PDF.")


def slug(label: str) -> str:
    """'Rozdział 12' -> '12', 'Załącznik B' -> 'B', 'Wstęp' -> 'W'."""
    label = label.strip()
    m = re.search(r"(\d+|[A-D])\s*$", label)
    if m:
        return m.group(1)
    return {"Wstęp": "W", "Na koniec": "K"}.get(label, label[:3])


def add_anchors(body: str) -> str:
    """Wstawia niewidoczne kotwice przy nagłówkach rozdziałów."""

    def repl(m: re.Match) -> str:
        return m.group(0) + f'<span class="anch">§§A:{slug(m.group(1))}§§</span>'

    return re.sub(r'<div class="num">(.*?)</div>', repl, body)


def add_toc_slots(body: str) -> str:
    """Dodaje wiodące kropki i miejsce na numer strony w spisie treści."""
    body = re.sub(
        r'(<div class="item"><span class="n">([^<]+)</span><span>[^<]*</span>)</div>',
        lambda m: f'{m.group(1)}<span class="leader"></span>'
        f'<span class="pnum">{{{{P:{m.group(2).strip()}}}}}</span></div>',
        body,
    )
    body = re.sub(
        r'(<div class="plain">Wstęp[^<]*)</div>',
        r'\1<span class="leader"></span><span class="pnum">{{P:W}}</span></div>',
        body,
    )
    return body


def assemble(page_map: dict[str, int] | None = None) -> Path:
    """Skleja fragmenty HTML w jeden dokument."""
    css = STYLE.read_text(encoding="utf-8")
    parts = sorted(p for p in BOOK["src"].glob("*.html"))
    if not parts:
        sys.exit("Brak fragmentów HTML w src/.")

    body = "\n\n".join(p.read_text(encoding="utf-8") for p in parts)
    body = add_anchors(body)
    body = add_toc_slots(body)

    # podstawienie numerów stron (2. przebieg) albo pusto (1. przebieg)
    def fill(m: re.Match) -> str:
        key = m.group(1)
        if page_map is None:
            return "&nbsp;"
        return str(page_map.get(key, ""))

    body = re.sub(r"\{\{P:([^}]+)\}\}", fill, body)

    doc = f"""<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<title>{BOOK["title"]}</title>
<style>
{css}
/* znacznik stron bez numeracji – niewidoczny w druku */
.nofolio {{ font-size: 3pt; color: rgba(0,0,0,0.004); letter-spacing: 0; }}
</style>
</head>
<body>
{body}
</body>
</html>
"""
    BUILD.mkdir(exist_ok=True)
    out = BUILD / "doc.html"
    out.write_text(doc, encoding="utf-8")
    print(f"  złożono {len(parts)} fragmentów -> {out.name}")
    return out


def render(html: Path) -> Path:
    raw = BUILD / "raw.pdf"
    cmd = [
        find_chrome(),
        "--headless",
        "--disable-gpu",
        "--no-sandbox",
        "--no-pdf-header-footer",
        "--run-all-compositor-stages-before-draw",
        "--virtual-time-budget=10000",
        f"--print-to-pdf={raw}",
        str(html),
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if not raw.exists():
        sys.exit(f"Render nie powiódł się:\n{res.stderr[-2000:]}")
    return raw


def stamp(raw: Path) -> None:
    """Nanosi numery stron; pomija strony ze znacznikiem NOFOLIO."""
    pdfmetrics.registerFont(TTFont("Folio", FONT_REG))
    pdfmetrics.registerFont(TTFont("Folio-Bold", FONT_BLD))

    reader = PdfReader(str(raw))
    writer = PdfWriter()

    folio = 0
    numbered = 0
    for page in reader.pages:
        try:
            text = page.extract_text() or ""
        except Exception:
            text = ""
        skip = NOFOLIO_TOKEN in text

        w = float(page.mediabox.width)
        h = float(page.mediabox.height)

        if not skip:
            folio += 1
            numbered += 1
            buf = io.BytesIO()
            c = canvas.Canvas(buf, pagesize=(w, h))
            y = 30
            c.setStrokeColor(RULE_COLOR)
            c.setLineWidth(0.5)
            c.line(w / 2 - 22, y + 9, w / 2 - 9, y + 9)
            c.line(w / 2 + 9, y + 9, w / 2 + 22, y + 9)
            c.setFillColor(FOLIO_COLOR)
            c.setFont("Folio-Bold", 8)
            c.drawCentredString(w / 2, y + 6.2, str(folio))
            c.save()
            buf.seek(0)
            page.merge_page(PdfReader(buf).pages[0])

        writer.add_page(page)

    writer.add_metadata(
        {
            "/Title": BOOK["title"],
            "/Author": AUTHOR,
            "/Subject": BOOK["subject"],
            "/Creator": "HTML + Chromium",
        }
    )
    with open(BOOK["out"], "wb") as fh:
        writer.write(fh)

    print(f"  stron w PDF: {len(reader.pages)}  (numerowanych: {numbered})")


def scan_pages(raw: Path) -> dict[str, int]:
    """Mapuje kotwicę rozdziału na numer strony widoczny w stopce."""
    reader = PdfReader(str(raw))
    page_map: dict[str, int] = {}
    folio = 0
    for page in reader.pages:
        try:
            text = page.extract_text() or ""
        except Exception:
            text = ""
        if NOFOLIO_TOKEN not in text:
            folio += 1
        for key in re.findall(r"§§A:([^§]+)§§", text):
            page_map.setdefault(key, folio)
    return page_map


def main() -> None:
    global BOOK
    key = sys.argv[1] if len(sys.argv) > 1 else "ebook"
    if key not in BOOKS:
        sys.exit(f"Nieznana publikacja: {key}. Dostępne: {', '.join(BOOKS)}")
    BOOK = BOOKS[key]
    print(f"Budowanie: {BOOK['title']}…")

    # przebieg 1 — ustalenie numerów stron dla spisu treści
    raw = render(assemble())
    page_map = scan_pages(raw)
    print(f"  rozpoznano {len(page_map)} rozdziałów do spisu treści")

    # przebieg 2 — właściwy dokument
    html = assemble(page_map)
    raw = render(html)
    stamp(raw)
    size_mb = BOOK["out"].stat().st_size / 1024 / 1024
    print(f"Gotowe: {BOOK['out'].name}  ({size_mb:.2f} MB)")


if __name__ == "__main__":
    main()
