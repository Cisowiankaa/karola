# E-book: „Od zera do zespołu"

*Bez ściemy o łatwych pieniądzach*

Dwie publikacje na wspólnym stylu:

| Plik | Co to | Objętość |
|---|---|---|
| `Od-zera-do-zespolu.pdf` | płatny kurs | 170 stron A5 |
| `10-wiadomosci-ktore-sprzedaja.pdf` | bezpłatny lead magnet | 18 stron A5 |

Lead magnet kończy się odesłaniem do płatnego kursu — to jego zadanie.
Przed wysyłką uzupełnij w nim czerwoną ramkę: link do zakupu, kontakt
i ewentualny kod rabatowy.

## Jak to jest zrobione

Treść leży w `src/` (kurs) i `src-lead/` (lead magnet) jako fragmenty
HTML, wspólny wygląd w `src/style.css`. Skrypt `build.py` skleja
wybraną publikację w jeden dokument, renderuje przez Chromium
i nanosi numery stron.

```
src/
  style.css          wygląd obu publikacji (kolory, czcionki, ramki)
  00-front.html      okładka, strona redakcyjna, spis treści, wstęp
  10-czesc-1.html    Fundament (rozdz. 1–5)
  20-czesc-2.html    Klientki (6–10)
  30-czesc-3.html    Instagram (11–16)
  40-czesc-4.html    Oferta i sprzedaż (17–20)
  50-czesc-5.html    Zespół (21–25)
  60-czesc-6.html    System (26–29)
  65-bonus.html     Bonus: sprzedaż na żywo (rozdz. 30)
  70-zalaczniki.html Załączniki A–D + zakończenie

src-lead/
  00-lead.html       cały lead magnet (11 wiadomości + błędy + CTA)
```

## Przebudowanie po zmianach

```bash
python3 build.py         # płatny kurs (domyślnie)
python3 build.py lead    # lead magnet
```

Wymaga: `pypdf`, `reportlab` oraz Chromium (ścieżka w `CHROME_CANDIDATES`
w `build.py`).

Skrypt renderuje dwa razy: pierwszy przebieg ustala, na której stronie
zaczyna się każdy rozdział, drugi wstawia te numery do spisu treści.
Numery stron w spisie aktualizują się więc same.

## Co zmienić przed sprzedażą

1. **Nazwisko autorki i tytuł** — `src/00-front.html` (okładka i strona
   redakcyjna) oraz stałe `TITLE` / `AUTHOR` w `build.py`.
2. **Ramki „Uzupełnij własnymi danymi"** — czerwone, przerywane ramki
   w rozdziałach 1 i 4. Zostawione celowo puste: wpisz aktualne progi
   rabatowe, prowizje i warunki premii dla swojego rynku, albo zostaw
   jako pola do wypełnienia przez czytelniczkę.
3. **Przykłady produktów** — w tekście są w nawiasach kwadratowych
   `[produkt]`, `[cena]`. Podstaw konkretne nazwy, jeśli chcesz.

## Jak dodać rozdział

Nowy plik w `src/` z numerem w nazwie decydującym o kolejności
(np. `45-bonus.html`). Struktura rozdziału:

```html
<section class="chapter">
  <div class="ch-head">
    <div class="num">Rozdział 30</div>
    <h2>Tytuł</h2>
    <div class="ch-rule"></div>
  </div>
  <p>Treść…</p>
</section>
```

Dopisz też pozycję do spisu treści w `00-front.html` — numer strony
policzy się sam.

## Dostępne ramki

| Klasa | Zastosowanie |
|---|---|
| `box box--exercise` | ćwiczenie do wykonania |
| `box box--script` | gotowa wiadomość do skopiowania |
| `box box--note` | uwaga, częsty błąd |
| `box box--key` | ciemna ramka, najważniejsza myśl |
| `box box--fill` | czerwona ramka „uzupełnij danymi" |
| `ul class="check"` | checklista z kratkami |
| `div class="pull"` | wyróżniony cytat |
| `div class="recap"` | podsumowanie na końcu rozdziału |
| `span class="fill-line"` | linia do wpisania odręcznie |
