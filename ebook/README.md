# E-book: „Od zera do zespołu"

Kurs sprzedaży i social sellingu dla konsultantek. Format A5, 137 stron.

Gotowy plik: **`Biznes-Oriflame-od-zera-do-zespolu.pdf`**

## Jak to jest zrobione

Treść leży w `src/` jako fragmenty HTML, wygląd w `src/style.css`.
Skrypt `build.py` skleja to w jeden dokument, renderuje przez Chromium
i nanosi numery stron.

```
src/
  style.css          wygląd całości (kolory, czcionki, ramki)
  00-front.html      okładka, strona redakcyjna, spis treści, wstęp
  10-czesc-1.html    Fundament (rozdz. 1–5)
  20-czesc-2.html    Klientki (6–10)
  30-czesc-3.html    Instagram (11–16)
  40-czesc-4.html    Oferta i sprzedaż (17–20)
  50-czesc-5.html    Zespół (21–25)
  60-czesc-6.html    System (26–29)
  70-zalaczniki.html Załączniki A–D + zakończenie
```

## Przebudowanie po zmianach

```bash
python3 build.py
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
