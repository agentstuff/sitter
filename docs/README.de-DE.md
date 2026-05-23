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
    <strong>Gefällt es dir? Kauf mir einen Kaffee!</strong> <br>
    <a href="https://www.paypal.com/donate/?hosted_button_id=ZHEVE2ZB69YR6" target="_blank"><img src="donate.png" alt="Kauf mir einen Kaffee!" height="50"></a>
</p>

---

<p align="center">
    <a href="#installation">Installation</a>  |
    <a href="#flowchart">Flowchart</a> |
    <a href="#skills">Skills</a>
</p>

---

## Was ist das?

Sitter ist ein schlanker AI-nativer Workflow-Manager, der Ihnen hilft, strukturierte Entwicklungszyklen mit Ihrem AI-Coding-Agenten durchzuführen. Er unterteilt die Arbeit in Visionen, Pläne, Aufgaben und Reviews – alles in Markdown-Dateien innerhalb Ihres Repos nachverfolgt.

## Welche Probleme löst es?

Bei der Arbeit mit großen Codebasen in der agentenbasierten Entwicklung stehen wir vor mehreren Problemen:

- Abdriften
- Feedback-Schleifen, die zu spät stattfinden
- Fehlerhafte Implementierungen
- Es ist nicht möglich, im Voraus eine ausreichend detaillierte Spezifikation zu erstellen, und deren kontinuierliche Verfeinerung ist extrem zeitaufwendig.
- Übermäßige Mengen an generiertem Code, die schwer zu reviewen sind
- Schwierige Reviews, bei denen es schwerfällt, die Überlegungen und Beweggründe hinter den Entscheidungen des LLM nachzuvollziehen

**Sitter zielt darauf ab, diese Probleme zu lösen.**

Mit Sitter können Sie eine Entwicklungsschleife mit extrem frühen Feedback-Zyklen nutzen. Sitter unterteilt die Arbeit in kleine Aufgaben, hinterlässt technische Kommentare im Code, um die Überlegungen und Entscheidungen hinter der Implementierung zu erläutern, und fordert nach jeder Aufgabe ein Review an.

Während des Review-Prozesses – egal ob Sie den Code selbst ändern oder die KI damit beauftragen – plant Sitter die verbleibenden Aufgaben neu und aktualisiert den Gesamtplan entsprechend. Dies verhindert, dass das System starr einem vorab erstellten Plan folgt, und ermöglicht stattdessen eine kontinuierliche Anpassung basierend auf dem, was während des Reviews geklärt wurde.

Während der Implementierung fügt die KI vor jeder Code-Änderung einen Kommentar hinzu, der die Überlegungen des LLM transparent macht, das Review vereinfacht und es ermöglicht, Abdriften frühzeitig zu erkennen und zu korrigieren.

## Unterstützte Agents

| Tool             | Installieren                      |
|------------------|-----------------------------------|
| **Claude Code**  | `sitter install --agent=claude`   |
| **Kilo CLI**    | `sitter install --agent=kilo`     |
| **Opencode**     | `sitter install --agent=opencode` |

## Installation

```bash
npm install -g @agentstuff/sitter
```

Dies installiert den `sitter` CLI-Befehl global.
```bash
sitter install
```

Dies installiert die Sitter-Skills in Ihren AI-Agenten.

## Wie verwendet man es?

```bash
sitter init
```

Dies initialisiert die `sitter/`-Verzeichnisstruktur in Ihrem Projekt.
Führen Sie dann die Sitter-Skills in dieser Reihenfolge aus, um Ihr Projekt zu verwalten:

1. `/sitter-vision` — Erstellt eine neue Projekt-Vision.
2. `/sitter-brainstorm` — Klärt Anforderungen durch gezielte Fragen.
3. `/sitter-plan` — Erstellt einen detaillierten Implementierungsplan und eine Aufgabenliste.
4. `/sitter-implement` — Führt Aufgaben nacheinander aus, mit Review nach jeder Aufgabe.
5. `/sitter-apply` — Wendet geprüfte Änderungen an und fährt fort.
6. `/sitter-done` — Archiviert das abgeschlossene Projekt.

---

## Flowchart

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

## Skills

| Skill | Beschreibung |
|-------|--------------|
| `/sitter-vision` | Erstellt eine neue Projekt-Vision und initialisiert den Projektordner. Erstellt die `vision.md`. Anschließend können Sie Ihre Vision in dieser Datei detailliert beschreiben – genau, worum es bei der Aufgabe geht und was Sie letztendlich erreichen möchten. Anschließend können Sie Ihre Vision in dieser Datei detailliert beschreiben – genau, worum es bei der Aufgabe geht und was Sie letztendlich erreichen möchten. |
| `/sitter-brainstorm` | Stellt klärende Fragen und verfeinert das Vision-Dokument. Dieser Befehl arbeitet auf Basis der vision.md-Datei. Wenn die Datei leer ist, wird er Ihnen so lange Fragen stellen, bis er vollständig versteht, was Sie bauen möchten. Er bewertet den Plan in erster Linie aus Produktperspektive und nicht aus technischer Sicht und versucht, potenzielle Randfälle zu identifizieren. |
| `/sitter-plan` | Erstellt einen detaillierten `plan.md` und unterteilt die Arbeit in `tasks.md`. Basierend auf der vision.md generiert er eine technische Spezifikation und eine Reihe kleiner, logisch aufeinanderfolgender Aufgaben. Diese können bei Bedarf überschrieben werden. |
| `/sitter-implement` | Implementiert die nächste ausstehende Aufgabe, markiert sie als erledigt und wartet auf das Review. Er findet die nächste unerledigte Aufgabe und implementiert sie. Nach Abschluss fordert er ein Review vom Benutzer an. Wenn der Wert `ai_comments` in `sitter/settings.yaml` auf true gesetzt ist, fügt er jeder Code-Änderung Kommentare mit dem Präfix `@@AI@@:` hinzu, die detailliert erklären, warum diese spezifische Änderung notwendig war und was sie bewirkt. Wenn während der Review-Phase eine angeforderte Änderung den Plan oder anstehende Aufgaben betrifft (z. B. Umbenennung einer Bibliothek oder Refactoring der Code-Struktur), aktualisiert er diese automatisch gemäß den neuen Anforderungen. Wenn Sie den Code selbst ändern – zum Beispiel durch Bearbeiten oder Umbenennen von Variablen –, informieren Sie die KI unbedingt darüber. Sie wird die Änderungen prüfen und bei Bedarf den Plan und die verbleibenden Aufgaben entsprechend aktualisieren. In der Review-Phase beweisen Sie, dass Sie den Code ordnungsgemäß geprüft haben, indem Sie alle `@@AI@@`-Kommentare überall entfernen. Eine neue Implementierung kann erst angefordert werden, wenn dieser Schritt abgeschlossen ist. |
| `/sitter-yolo` | Implementiert alle verbleibenden Aufgaben kontinuierlich und führt das Review erst am Ende durch. |
| `/sitter-apply` | Validiert, dass keine KI-Kommentare mehr vorhanden sind, und setzt das Projekt zurück auf IMPLEMENT. Mit dem Apply-Befehl können Sie die Änderungen der KI akzeptieren. Wichtig ist, dass Apply nur angefordert werden kann, wenn **es KEINE** `@@AI@@`-Kommentare irgendwo in der Codebasis gibt. Sie beweisen, dass das Review abgeschlossen wurde, indem Sie alle diese Kommentare überall aus dem Code entfernen. Sobald dies erledigt ist, ermöglicht Apply der KI die Fortsetzung der Implementierung, d. h. `/sitter-implement` wird wieder verfügbar, sodass die KI mit der nächsten Aufgabengruppe beginnen kann. |
| `/sitter-done` | Archiviert das Projekt in den Archivordner und räumt auf. |

---

## @@AI@@-Kommentare

Wenn `review/ai_comments` in `sitter/settings.yaml` auf `true` gesetzt ist, muss die KI während der Implementierung jeder Code-Änderung einen @@AI@@-Kommentar voranstellen, der detailliert erklärt, warum die Änderung notwendig war, die technische Begründung dahinter und was genau sie bewirkt. Der Zweck ist, die Review-Phase zu erleichtern, indem sichergestellt wird, dass der Reviewer – Sie – den Entscheidungsprozess der KI hinter jeder Änderung klar nachvollziehen kann.

Während der Review-Phase beweisen Sie, dass Sie den Code tatsächlich geprüft haben, indem Sie alle @@AI@@-Kommentare entfernen. Wenn irgendwo im Code ein @@AI@@-Kommentar verbleibt, wird der Apply-Schritt nicht akzeptiert, da dies darauf hindeutet, dass das Review nicht ordnungsgemäß abgeschlossen wurde.

Wenn Ihnen diese Funktion nicht zusagt, können Sie ihren Wert in `settings.yaml` einfach auf `false` setzen.

---

## TASK.md

Im `sitter`-Verzeichnis gibt es eine `TASK.md`-Datei. Bevor sie mit jeder Aufgabe beginnt, liest die KI diese Datei und berücksichtigt auch die darin enthaltenen Anweisungen bei der Implementierung.

Sie ist standardmäßig leer, kann aber verwendet werden, um den Agenten zusätzliche implementierungsspezifische Anweisungen zu geben.

---
## Lizenz

MIT – Frei wie 🇭🇺Ungarn🇭🇺
