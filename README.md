# Kviga-Koll

Webbverktyg för uppföljning av kvigor – vikt, uppgifter, foder och statistik.
Byggt med **Vite + React** (JavaScript). All data sparas i webbläsarens `localStorage`.

## Funktioner

| Flik | Beskrivning |
|------|-------------|
| **Lägg till djur** | Registrera kviga med ID, namn, födelsedatum, ras och måltillväxt |
| **Registrera vikt** | Logga vikter – daglig tillväxt (ADG) beräknas från de två senaste vägningarna |
| **Kommande uppgifter** | Vaccination (var 180:e dag), klövkontroll (var 90:e dag), brunst-/betäckningskontroll (13–15 månader) |
| **Foderplan** | Dagligt ts-intag = 2,2 % av kroppsvikt, fördelat 60 % grovfoder / 40 % kraftfoder |
| **Sammanfattning** | Antal djur, medelvikt, djur under måltillväxt |

## Kom igång

```bash
# Installera beroenden
npm install

# Starta utvecklingsserver
npm run dev

# Bygg för produktion
npm run build
```

## Kvalitetskontroll

```bash
# Kör ESLint, bygg och tester
npm run check

# Enbart lint
npm run lint

# Enbart tester
npm run test
```

Pre-commit-hooken (Husky) kör automatiskt `npm run lint && npm run build && npm run test` före varje commit.

## Tester

Enhetstest skrivna med **Vitest** finns i `tests/`. De täcker:

- **ADG-beräkning** – två poster, flera poster, osorterade, kantfall
- **Foderplan** – standardvikt, liten vikt, nollvikt
- **Uppgiftsschema** – vaccination, klövkontroll, brunst, horisont, fleruppgifter

```bash
npm run test
```

## Projektstruktur

```
src/
  main.jsx                  Ingångspunkt
  App.jsx                   Huvudkomponent med flikar
  index.css                 Global stil
  utils/
    calculations.js         ADG, foderplan, uppgiftsberäkning
    storage.js              localStorage-persistens
  components/
    AddAnimalForm.jsx       Formulär för nytt djur
    LogWeight.jsx           Viktregistrering + ADG
    DueTasks.jsx            Lista kommande uppgifter
    FeedPlan.jsx            Foderplan per djur
    Summary.jsx             Besättningsstatistik
tests/
  calculations.test.js     Enhetstest (Vitest)
```

## Licens

Privat projekt.
