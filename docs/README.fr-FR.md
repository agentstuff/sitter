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
    <strong>Ça vous plaît ? Offrez-moi un café !</strong> <br>
    <a href="https://www.paypal.com/donate/?hosted_button_id=ZHEVE2ZB69YR6" target="_blank"><img src="donate.png" alt="Offrez-moi un café !" height="50"></a>
</p>

---

<p align="center">
    <a href="#installation">Installation</a>  |
    <a href="#organigramme">Organigramme</a> |
    <a href="#skills">Skills</a> 
</p>

---

## Qu'est-ce que c'est ?

Sitter est un gestionnaire de flux de travail léger, natif IA, qui vous aide à piloter des cycles de développement structurés avec votre agent de codage IA. Il décompose le travail en visions, plans, tâches et revues — le tout suivi dans des fichiers markdown au sein de votre dépôt.

## Quels problèmes résout-il ?

Lorsque l'on travaille sur de grandes bases de code en développement agentique, on rencontre plusieurs problèmes :

- La dérive
- Des boucles de rétroaction qui arrivent trop tard
- Des implémentations incorrectes
- Il est impossible de créer une spécification suffisamment détaillée à l'avance, et l'affiner en continu prend énormément de temps.
- Une quantité excessive de code généré, difficile à passer en revue
- Des revues difficiles, où il est compliqué de comprendre le raisonnement et les motivations derrière les décisions du LLM

**Sitter vise à résoudre ces problèmes.**

Avec Sitter, vous pouvez utiliser une boucle de développement avec des cycles de rétroaction extrêmement précoces. Sitter décompose le travail en petites tâches, laisse des commentaires techniques dans le code pour expliquer le raisonnement et les décisions derrière l'implémentation, et demande une revue après chaque tâche.

Pendant le processus de revue, que vous modifiiez le code vous-même ou demandiez à l'IA de le faire, Sitter replanifie les tâches restantes et met à jour le plan global en conséquence. Cela empêche le système de suivre rigidement un plan préétabli et lui permet au contraire de s'adapter en continu en fonction de ce qui a été clarifié lors de la revue.

Pendant l'implémentation, l'IA ajoute un commentaire avant chaque modification de code, rendant le raisonnement du LLM transparent, simplifiant la revue et permettant de détecter et de corriger la dérive rapidement.

## Outils supportés

| Outil           | Installation                      |
|-----------------|-----------------------------------|
| **Claude Code** | `sitter install --agent=claude`   |
| **Kilo CLI**    | `sitter install --agent=kilo`     |
| **OpenCode**    | `sitter install --agent=opencode` |


## Installation

```bash
npm install -g @agentstuff/sitter
```

Cela installe la commande CLI `sitter` de manière globale.
```bash
sitter install
```

Cela installe les skills Sitter dans votre agent IA.

## Comment utiliser ?

```bash
sitter init
```

Cela initialise la structure de répertoires `sitter/` dans votre projet.
Exécutez ensuite les skills Sitter dans l'ordre pour gérer votre projet :

1. `/sitter-vision` — Créer une nouvelle vision du projet.
2. `/sitter-brainstorm` — Clarifier les exigences en posant des questions.
3. `/sitter-plan` — Générer un plan d'implémentation détaillé et une liste de tâches.
4. `/sitter-implement` — Exécuter les tâches une par une avec une revue après chacune.
5. `/sitter-apply` — Appliquer les modifications revues et continuer.
6. `/sitter-done` — Archiver le projet terminé.


---

## Organigramme

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
       YOLO  │   │    IMPLEMENT   ◄────────┐              
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

| Skill | Description |
|-------|-------------|
| `/sitter-vision` | Crée une nouvelle vision du projet et initialise le dossier du projet. Génère le fichier `vision.md`. Ensuite, vous pouvez décrire votre vision en détail dans ce fichier — exactement ce qu'est la tâche et ce que vous souhaitez accomplir au final. |
| `/sitter-brainstorm` | Pose des questions de clarification et affine le document de vision. Cette commande fonctionne à partir du fichier vision.md. Si le fichier est vide, elle continuera à vous poser des questions jusqu'à ce qu'elle comprenne parfaitement ce que vous voulez construire. Elle évalue principalement le plan d'un point de vue produit plutôt que technique, et essaie d'identifier les cas limites potentiels. |
| `/sitter-plan` | Élabore un `plan.md` détaillé et décompose le travail en `tasks.md`. Sur la base du fichier vision.md, il génère une spécification technique et une série de petites tâches logiquement séquentielles. Celles-ci peuvent être modifiées si nécessaire. |
| `/sitter-implement` | Implémente la prochaine tâche en attente, la marque comme terminée et attend la revue. Il trouve la prochaine tâche non terminée et l'implémente. Une fois terminé, il demande une revue à l'utilisateur. Si la valeur `ai_comments` dans `sitter/settings.yaml` est définie sur `true`, il ajoute des commentaires préfixés par `@@AI@@:` à chaque modification de code, expliquant en détail pourquoi ce changement spécifique était nécessaire et ce qu'il fait. Pendant la phase de revue, si une modification demandée affecte le plan ou les tâches à venir (par exemple, renommer une bibliothèque ou restructurer du code), il les met automatiquement à jour selon les nouvelles exigences. Si vous modifiez le code vous-même — par exemple en éditant ou en renommant des variables — assurez-vous d'en informer l'IA. Elle examinera les modifications et, si nécessaire, mettra à jour le plan et les tâches restantes en conséquence. Dans la phase de revue, vous prouvez que vous avez correctement passé en revue le code en supprimant tous les commentaires `@@AI@@` partout. Une nouvelle implémentation ne peut pas être demandée tant que cette étape n'a pas été terminée. |
| `/sitter-yolo` | Implémente toutes les tâches restantes en continu, en ne faisant la revue qu'à la fin. |
| `/sitter-apply` | Valide qu'aucun commentaire IA ne subsiste et fait passer le projet en mode IMPLEMENT. Vous pouvez accepter les modifications de l'IA avec la commande Apply. Il est important de noter que Apply ne peut être demandé que s'il n'y a **AUCUN** commentaire `@@AI@@` nulle part dans la base de code. Vous prouvez que la revue a été effectuée en supprimant tous ces commentaires partout dans le code. Une fois cela fait, Apply réactive l'IA pour continuer l'implémentation, ce qui signifie que `/sitter-implement` redevient disponible afin que l'IA puisse commencer à travailler sur le prochain lot de tâches. |
| `/sitter-done` | Archive le projet dans le dossier d'archive et nettoie. |

---

## Commentaires @@AI@@

Si `review/ai_comments` est défini sur `true` dans `sitter/settings.yaml`, alors pendant l'implémentation, l'IA doit précéder chaque modification de code d'un commentaire `@@AI@@`, expliquant en détail pourquoi le changement était nécessaire, le raisonnement technique derrière celui-ci, et exactement ce qu'il fait. L'objectif est de faciliter la phase de revue en s'assurant que vous, le relecteur, pouvez clairement comprendre le processus de décision de l'IA derrière chaque modification.

Pendant la phase de revue, vous prouvez que vous avez effectivement passé en revue le code en supprimant tous les commentaires `@@AI@@`. S'il reste un commentaire `@@AI@@` n'importe où dans le code, l'étape Apply ne sera pas acceptée, car cela indique que la revue n'a pas été correctement effectuée.

Si cette fonctionnalité ne vous convient pas, vous pouvez simplement définir sa valeur sur `false` dans `settings.yaml`.

---

## TASK.md

Il existe un fichier `TASK.md` dans le répertoire `sitter`. Avant de commencer chaque tâche, l'IA lit ce fichier et prend également en compte les instructions qu'il contient lors de l'implémentation.

Il est vide par défaut, mais il peut être utilisé pour fournir des instructions supplémentaires spécifiques à l'implémentation aux agents.

---
## Licence

MIT - Free as 🇭🇺Hungary🇭🇺
