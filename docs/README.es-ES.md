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
    <strong>¿Te gusta? ¡Invítame un café!</strong> <br>
    <a href="https://www.paypal.com/donate/?hosted_button_id=ZHEVE2ZB69YR6" target="_blank"><img src="donate.png" alt="¡Invítame un café!" height="50"></a>
</p>

---

<p align="center">
    <a href="#instalación">Instalación</a>  |
    <a href="#diagrama-de-flujo">Diagrama de flujo</a> |
    <a href="#skills">Skills</a> 
</p>

---

## ¿Qué es?

Sitter es un gestor de flujo de trabajo nativo de IA y ligero que le ayuda a ejecutar ciclos de desarrollo estructurados con su agente de programación de IA. Divide el trabajo en visiones, planes, tareas y revisiones — todo registrado en archivos markdown dentro de su repositorio.

## ¿Qué problemas resuelve?

Al trabajar con bases de código extensas en desarrollo agéntico, nos enfrentamos a varios problemas:

- Deriva
- Ciclos de retroalimentación que ocurren demasiado tarde
- Implementaciones incorrectas
- No es posible crear una especificación suficientemente detallada desde el principio, y refinarla continuamente consume muchísimo tiempo.
- Cantidades excesivas de código generado, difícil de revisar
- Revisiones difíciles, donde es difícil entender el razonamiento y las motivaciones detrás de las decisiones del LLM

**Sitter tiene como objetivo ayudar a resolver estos problemas.**

Con Sitter, puede utilizar un ciclo de desarrollo con ciclos de retroalimentación extremadamente tempranos. Sitter divide el trabajo en tareas pequeñas, deja comentarios técnicos en el código para explicar el razonamiento y las decisiones detrás de la implementación, y solicita una revisión después de cada tarea.

Durante el proceso de revisión, ya sea que modifique el código usted mismo o le pida a la IA que lo haga, Sitter replanifica las tareas restantes y actualiza el plan general en consecuencia. Esto evita que el sistema siga rígidamente un plan inicial y, en cambio, le permite adaptarse continuamente según lo que se aclare durante el proceso de revisión.

Durante la implementación, la IA añade un comentario antes de cada cambio de código, lo que hace transparente el razonamiento del LLM, simplifica la revisión y permite que la deriva se detecte y corrija a tiempo.

## Herramientas compatibles

| Herramienta     | Instalar                          |
|-----------------|-----------------------------------|
| **Claude Code** | `sitter install --agent=claude`   |
| **Kilo CLI**    | `sitter install --agent=kilo`     |
| **OpenCode**    | `sitter install --agent=opencode` |


## Instalación

```bash
npm install -g @agentstuff/sitter
```

Esto instala el comando CLI `sitter` de forma global.
```bash
sitter install
```

Esto instala las skills de Sitter en su agente de IA.

## ¿Cómo usarlo?

```bash
sitter init
```

Esto inicializa la estructura de directorios `sitter/` en su proyecto.
Luego ejecute las skills de Sitter en orden para gestionar su proyecto:

1. `/sitter-vision` — Cree una nueva visión del proyecto.
2. `/sitter-brainstorm` — Clarifique los requisitos haciendo preguntas.
3. `/sitter-plan` — Genere un plan de implementación detallado y una lista de tareas.
4. `/sitter-implement` — Ejecute las tareas una a una con revisión después de cada una.
5. `/sitter-apply` — Aplique los cambios revisados y continúe.
6. `/sitter-done` — Archive el proyecto completado.


---

## Diagrama de flujo

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

| Skill | Descripción |
|-------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `/sitter-vision` | Crea una nueva visión del proyecto e inicializa la carpeta del proyecto. Crea el archivo `vision.md`. Después de esto, puede describir su visión en detalle en este archivo — exactamente cuál es la tarea y qué quiere lograr en última instancia. |
| `/sitter-brainstorm` | Hace preguntas aclaratorias y refina el documento de visión. Este comando funciona basándose en el archivo vision.md. Si el archivo está vacío, seguirá haciéndole preguntas hasta que comprenda completamente lo que quiere construir. Evalúa principalmente el plan desde una perspectiva de producto más que técnica, e intenta identificar posibles casos extremos. |
| `/sitter-plan` | Construye un `plan.md` detallado y divide el trabajo en `tasks.md`. Basándose en vision.md, genera una especificación técnica y una serie de tareas pequeñas y lógicamente secuenciales. Estas pueden modificarse si es necesario. |
| `/sitter-implement` | Implementa la siguiente tarea pendiente, la marca como completada y espera la revisión. Encuentra la siguiente tarea sin terminar y la implementa. Al terminar, solicita una revisión del usuario. Si el valor `ai_comments` en `sitter/settings.yaml` está configurado como true, añade comentarios con el prefijo `@@AI@@:` a cada cambio de código, explicando en detalle por qué ese cambio específico era necesario y qué hace. Durante la fase de revisión, si alguna modificación solicitada afecta al plan o a las próximas tareas (por ejemplo, renombrar una librería o refactorizar la estructura del código), las actualiza automáticamente según los nuevos requisitos. Si modifica el código usted mismo — por ejemplo editando o renombrando variables — asegúrese de informar a la IA al respecto. Esta revisará los cambios y, si es necesario, actualizará el plan y las tareas restantes en consecuencia. En la fase de revisión, usted demuestra que ha revisado correctamente el código eliminando todos los comentarios `@@AI@@` de todas partes. No se puede solicitar una nueva implementación hasta que este paso se haya completado. |
| `/sitter-yolo` | Implementa todas las tareas restantes de forma continua, revisando solo al final. |
| `/sitter-apply` | Valida que no queden comentarios de IA y devuelve el proyecto a IMPLEMENT. Puede aceptar los cambios de la IA con el comando Apply. Es importante que Apply solo se pueda solicitar si **NO HAY** comentarios `@@AI@@` en ninguna parte de la base de código. Usted demuestra que la revisión se ha completado eliminando todos estos comentarios de todas partes del código. Una vez hecho esto, Apply vuelve a habilitar a la IA para continuar la implementación, lo que significa que `/sitter-implement` vuelve a estar disponible para que la IA pueda comenzar a trabajar en el siguiente lote de tareas. |
| `/sitter-done` | Archiva el proyecto en la carpeta de archivo y limpia. |

---

## Comentarios @@AI@@

Si `review/ai_comments` está configurado como `true` en `sitter/settings.yaml`, entonces durante la implementación la IA debe anteponer un comentario @@AI@@ a cada cambio de código, explicando en detalle por qué el cambio era necesario, el razonamiento técnico detrás de él y exactamente qué hace. El propósito es facilitar la fase de revisión asegurando que el revisor — usted — pueda comprender claramente el proceso de toma de decisiones de la IA detrás de cada modificación.

Durante la fase de revisión, usted demuestra que realmente ha revisado el código eliminando todos los comentarios @@AI@@. Si queda algún comentario @@AI@@ en cualquier parte del código, el paso Apply no será aceptado, ya que indica que la revisión no se ha completado correctamente.

Si no le gusta esta funcionalidad, puede simplemente configurar su valor como `false` en `settings.yaml`.

---

## TASK.md

Hay un archivo `TASK.md` dentro del directorio `sitter`. Antes de comenzar cada tarea, la IA lee este archivo y también tiene en cuenta las instrucciones que contiene durante la implementación.

Está vacío por defecto, pero puede usarse para proporcionar instrucciones adicionales específicas de implementación a los agentes.

---
## Licencia

MIT - Free as 🇭🇺Hungary🇭🇺
