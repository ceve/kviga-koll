# kviga-koll

Praktiskt CLI-verktyg for kviguppfodare. Haller koll pa besattningen, viktutveckling, kommande uppgifter och foderplanering.

## Funktioner

- **add-animal** -- Lagg till en ny kviga i besattningen
- **log-weight** -- Registrera viktvagning och se daglig tillvaxttakt (ADG)
- **due-tasks** -- Visa kommande uppgifter (vaccination, klovvard, brunst)
- **feed-plan** -- Berakna foderplan baserad pa senaste vikt
- **summary** -- Sammanfattning: antal, medelvikt, djur under maltillvaxt

## Installation

Inga externa beroenden kravs -- enbart Python 3 standardbibliotek.

```bash
cd kviga-koll
```

## Anvandning

### Lagg till en kviga

```bash
python -m kviga_koll add-animal \
  --id K001 \
  --name Bella \
  --birth-date 2024-06-15 \
  --breed SRB \
  --target-gain 0.85
```

### Registrera vikt

```bash
python -m kviga_koll log-weight --id K001 --kg 180 --date 2025-01-15
python -m kviga_koll log-weight --id K001 --kg 205 --date 2025-02-15
```

Utmatning visar registrerad vikt samt beraknad daglig tillvaxt (ADG) fran de
tva senaste vagningarna.

### Visa kommande uppgifter

```bash
python -m kviga_koll due-tasks --days 30
```

Listar uppgifter som ar aktuella inom angivet antal dagar:

- **Vaccination** -- var 180:e dag fran fodsel
- **Klovvard** -- var 90:e dag fran fodsel
- **Brunstkontroll** -- nar kvigan ar 13-15 manader gammal

### Foderplan

```bash
python -m kviga_koll feed-plan --id K001
```

Beraknar dagligt torrsubstansintag (2,2 % av kroppsvikt) och fordelar:

- 60 % grovfoder
- 40 % kraftfoder

### Sammanfattning

```bash
python -m kviga_koll summary
```

Visar antal kvigor, medelvikt och listar djur som inte uppnar sin maltillvaxt.

## Datalagring

All data sparas i `data/herd.json` i projektmappen. Filen skapas automatiskt
vid forsta anvandningen.

## Tester

```bash
python -m pytest tests/ -v
```

eller med enbart standardbiblioteket:

```bash
python -m unittest discover -s tests -v
```

## Exempel pa arbetsflode

```bash
# Lagg till tva kvigor
python -m kviga_koll add-animal --id K001 --name Bella --birth-date 2024-06-15 --breed SRB
python -m kviga_koll add-animal --id K002 --name Stella --birth-date 2024-08-01 --breed Holstein

# Registrera vikter
python -m kviga_koll log-weight --id K001 --kg 180 --date 2025-01-15
python -m kviga_koll log-weight --id K001 --kg 205 --date 2025-02-15
python -m kviga_koll log-weight --id K002 --kg 160 --date 2025-01-15
python -m kviga_koll log-weight --id K002 --kg 175 --date 2025-02-15

# Kolla uppgifter
python -m kviga_koll due-tasks --days 60

# Foderplan for Bella
python -m kviga_koll feed-plan --id K001

# Sammanfattning
python -m kviga_koll summary
```
