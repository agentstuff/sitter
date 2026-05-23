<p align="center">
  <img src="logo.png" alt="Sitter Logo">
</p>

<p align="center">
  <strong>Babysit Your AI.</strong>
</p>

---

<p align="center">
  <a href="https://github.com/agentstuff/sitter/actions/workflows/ci.yml"><img src="https://github.com/agentstuff/sitter/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://www.npmjs.com/package/@agentstuff/sitter"><img src="https://img.shields.io/npm/dt/@agentstuff/sitter.svg" alt="npm downloads"></a>
</p>

---
<p align="center">
  🇺🇸 <a href="../README.md">English</a> | 🇭🇺 <a href="README.hu-HU.md">Magyar</a> | 🇩🇪 <a href="README.de-DE.md">Deutsch</a> | 🇫🇷 <a href="README.fr-FR.md">Français</a> | 🇪🇸 <a href="README.es-ES.md">Español</a> | 🇯🇵 <a href="README.ja-JP.md">日本語</a> | 🇨🇳 <a href="README.zh-CN.md">简体中文</a>
</p>

---

<p align="center">
    <strong>Tetszik? Hívj meg egy kávéra!</strong> <br>
    <a href="https://www.paypal.com/donate/?hosted_button_id=ZHEVE2ZB69YR6" target="_blank"><img src="donate.png" alt="Vegyél egy kávét!" height="50"></a>
</p>

---

<p align="center">
    <a href="#telepítés">Telepítés</a>  |
    <a href="#folyamatábra">Folyamatábra</a> |
    <a href="#skillek">Skillek</a> 
</p>

---

## Mi ez?

A Sitter egy egyszerű, AI-natív munkafolyamat-kezelő eszköz, amellyel strukturált fejlesztési ciklusokat vezényelhetsz az AI kódoló agenteddel. A munkát víziókra, tervekre, feladatokra és review-kra bontja — mindezt a repód markdown fájljaiban követi nyomon.

## Milyen problémákra ad megoldást?

Nagy kódbázisok agent-alapú fejlesztése során rendre ugyanazokba a problémákba ütközünk:

- Elcsúszás (drifting)
- Túl későn érkező visszajelzés
- Hibás implementációk
- Előre nem lehet elég részletes specifikációt írni, a folyamatos finomítása viszont rengeteg időt emészt fel
- Túl sok generált kód, amit nehéz átnézni
- Nehézkes review, ahol alig lehet átlátni, hogy az LLM milyen megfontolások alapján hozta a döntéseit

**A Sitter ezekre a problémákra nyújt megoldást.**

A Sitterrel olyan fejlesztési ciklust kapsz, ahol a visszajelzés rendkívül korán megtörténik. Az eszköz apró feladatokra bontja a munkát, technikai kommenteket fűz a kódhoz — ezek mutatják be az implementáció mögötti gondolatmenetet és döntéseket —, végül pedig minden egyes feladat után review-t kér.

A review során — akár te nyúlsz bele a kódba, akár az AI-t kéred meg rá — a Sitter újratervezi a hátralévő feladatokat és frissíti a teljes tervet. Így a rendszer nem ragaszkodik mereven egy előre rögzített menetrendhez, hanem folyamatosan alkalmazkodik mindahhoz, ami a review alatt kiderül.

Implementáció közben az AI minden egyes kódváltoztatás elé egy-egy kommentet ír, ezzel átláthatóvá téve a gondolkodását, megkönnyítve a review-t, és lehetővé téve, hogy az elcsúszást már a legelején kiszúrd és korrigáld.

## Támogatott agentek

| Eszköz          | Telepítés                         |
|-----------------|-----------------------------------|
| **Claude Code** | `sitter install --agent=claude`   |
| **Kilo CLI**    | `sitter install --agent=kilo`     |
| **OpenCode**    | `sitter install --agent=opencode` |


## Telepítés

```bash
npm install -g @agentstuff/sitter
```

Ez globálisan telepíti a `sitter` CLI parancsot.
```bash
sitter install
```

Ez telepíti a Sitter skilleket az AI agentedbe.

## Hogyan használd?

```bash
sitter init
```

Ez inicializálja a `sitter/` könyvtárszerkezetet a projektedben.
Ezután a Sitter skilleket az alábbi sorrendben futtatva vezérelheted a projektedet:

1. `/sitter-vision` — Új projektvízió létrehozása.
2. `/sitter-brainstorm` — Követelmények tisztázása kérdésekkel.
3. `/sitter-plan` — Részletes implementációs terv és feladatlista generálása.
4. `/sitter-implement` — Feladatok egyenkénti végrehajtása, mindegyik után review-val.
5. `/sitter-apply` — Átnézett változtatások jóváhagyása és továbblépés.
6. `/sitter-done` — Kész projekt archiválása.


---

## Folyamatábra

```                                                            
                 ┌────────────────┐              
                 │                │              
                 │     VISION     │              
                 │                │────┐              
                 └───────┬────────┘    │                                                       
                         │             │              
                 ┌───────▼────────┐    │              
                 │                │    │              
                 │    BRAINSTORM  │    │
                 │                │    │              
                 └───────┬────────┘    │                                   
                         │             │              
                 ┌───────▼────────┐    │              
                 │                │    │              
                 │     PLAN       │    │              
             ┌───┼                ◄────┘              
             │   └───────┬────────┘              
             │           │              
             │   ┌───────▼────────┐              
             │   │                │              
      YOLO   │   │    IMPLEMENT   ◄────────┐              
             │   │                │        │               
             │   └───────┬────────┘        │                      
             │           │                 │ CHANGE
             │   ┌───────▼────────┐        │
             │   │                │        │
             └───►     REVIEW     │────────┘
                 │                │                     
                 └───────┬────────┘                                       
                         │                     
                 ┌───────▼────────┐                     
                 │                │                     
                 │     DONE       │                     
                 │                │                     
                 └────────────────┘                                                                     
                       
```

---

## Skillek

| Skill              | Leírás                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
|--------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `/sitter-vision`     | Létrehoz egy új projektvíziót, inicializálja a projekt mappát, valamint a `vision.md` fájlt. Ezután ebben a fájlban részletesen kifejtheted a víziódat — pontosan mi a feladat, és mit szeretnél vele elérni.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `/sitter-brainstorm` | Tisztázó kérdéseket tesz fel, és finomítja a vízió dokumentumot. A parancs a vision.md alapján dolgozik — ha a fájl üres, addig kérdez, amíg pontosan meg nem érti, mit szeretnél létrehozni. Elsősorban termékszempontból vizsgálja a tervet (nem technikai oldalról), és feltárja a lehetséges szélsőséges eseteket.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `/sitter-plan`       | Részletes `plan.md`-t készít, a munkát pedig `tasks.md`-ben rögzített feladatokra bontja. A vision.md alapján technikai specifikációt és kis, logikailag egymásra épülő feladatok sorozatát generálja. Ezek szükség esetén felülírhatók.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `/sitter-implement`  | Megvalósítja a soron következő várakozó feladatot, késznek jelöli, majd review-t vár a felhasználótól. Ha a `sitter/settings.yaml` fájlban az `ai_comments` értéke `true`, akkor minden kódváltoztatáshoz `@@AI@@:` előtagú kommenteket fűz, amelyek részletesen elmagyarázzák, miért volt szükség az adott változtatásra és pontosan mit csinál. A review fázis alatt, ha bármely kért módosítás érinti a tervet vagy a hátralévő feladatokat (például egy library átnevezése vagy a kódstruktúra átalakítása), azokat automatikusan frissíti az új követelmények szerint. Ha saját magad módosítod a kódot — például változókat nevezel át vagy fájlokat szerkesztesz —, feltétlenül tájékoztasd róla az AI-t, ami átnézi a változtatásokat, és szükség esetén frissíti a tervet és a hátralévő feladatokat. A review fázis akkor zárul le, amikor az összes `@@AI@@` kommentet eltávolítottad a kódbázisból — ezzel igazolod, hogy valóban áttekintetted a kódot. Amíg ez nem történik meg, új implementáció nem kérhető. |
| `/sitter-yolo`       | Sorban megvalósítja az összes hátralévő feladatot, és csak a legvégén kér review-t.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `/sitter-apply`      | Ellenőrzi, hogy nem maradt-e `@@AI@@` komment a kódbázisban, majd visszaállítja a projektet IMPLEMENT állapotba. Az Apply paranccsal fogadhatod el az AI változtatásait. Az Apply **kizárólag** akkor hajtható végre, ha a kódbázisban **SEHOL** nincs `@@AI@@` komment — ezek eltávolításával bizonyítod, hogy a review-t maradéktalanul elvégezted. Ezután az Apply újra engedélyezi az implementáció folytatását, vagyis a `/sitter-implement` ismét elérhetővé válik, és az AI nekiláthat a következő feladatoknak.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `/sitter-done`       | Archiválja a projektet az archive mappába, és kitakarít.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

---

## @@AI@@ kommentek

Ha a `sitter/settings.yaml` fájlban a `review/ai_comments` értéke `true`, akkor az implementáció során az AI-nak minden kódváltoztatás elé `@@AI@@` kommentet kell írnia, amelyben részletesen kifejti, miért volt szükség a változtatásra, mi a technikai indoklása, és pontosan mit csinál. Ennek célja, hogy megkönnyítse a review-t: te, az átnéző, tisztán láthatod, hogy az AI milyen gondolatmenet alapján hozta meg az adott döntést.

A review fázisban azzal igazolod, hogy ténylegesen átnézted a kódot, hogy eltávolítod az összes `@@AI@@` kommentet. Ha bárhol egyetlen `@@AI@@` komment is megmarad, az Apply lépést a rendszer visszautasítja, mert ez azt jelzi, hogy a review nem történt meg rendesen.

Ha nem szimpatikus ez a funkció, egyszerűen állítsd az értékét `false`-ra a `settings.yaml` fájlban.

---

## TASK.md

A `sitter` könyvtárban található egy `TASK.md` fájl. Minden feladat megkezdése előtt az AI elolvassa ezt a fájlt, és az abban található utasításokat is figyelembe veszi a megvalósítás során.

Alapértelmezetten üres, de további, megvalósításspecifikus utasítások megadására használható az agentek számára.

---
## Licenc

MIT - Free as 🇭🇺Hungary🇭🇺
