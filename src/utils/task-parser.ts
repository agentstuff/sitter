export interface TaskStep {
  checked: boolean;
  text: string;
}

export interface Task {
  id: number;
  title: string;
  body: string;
  steps: TaskStep[];
}

const MAX_CONTENT_LENGTH = 10 * 1024 * 1024; // 10MB

export function parseTasks(content: string): Task[] {
  if (content.length > MAX_CONTENT_LENGTH) {
    throw new Error('Content too large to parse');
  }

  const tasks: Task[] = [];

  // Find all ## headings to determine task boundaries
  const headingRegex = /^##\s+(.+)$/gm;
  const headings: { index: number; line: string; titleText: string }[] = [];
  let headingMatch: RegExpExecArray | null;

  while ((headingMatch = headingRegex.exec(content)) !== null) {
    const rawTitle = headingMatch[1];

    // Strip leading checkbox from title text if present
    const titleMatch = rawTitle.match(/^\[\s*([ xX]?)\s*\]\s*(.*)$/);
    const titleText = titleMatch ? titleMatch[2].trim() : rawTitle.trim();

    headings.push({ index: headingMatch.index, line: headingMatch[0], titleText });
  }

  for (let i = 0; i < headings.length; i++) {
    const startIndex = headings[i].index;
    const endIndex = i + 1 < headings.length ? headings[i + 1].index : content.length;
    const rawBody = content.slice(startIndex, endIndex).trim();

    const title = headings[i].titleText;

    // Extract ID from title if it matches "Task N", otherwise use sequential numbering
    const idMatch = title.match(/Task\s+(\d+)/i);
    const id = idMatch ? parseInt(idMatch[1], 10) : i + 1;

    // Parse steps: lines matching - [ ] step or - [X] step
    const steps: TaskStep[] = [];
    const stepRegex = /^\s*-\s*\[\s*([ xX]?)\s*\]\s*(.+)$/gm;
    let stepMatch: RegExpExecArray | null;
    while ((stepMatch = stepRegex.exec(rawBody)) !== null) {
      steps.push({
        checked: stepMatch[1].toUpperCase() === 'X',
        text: stepMatch[2].trim(),
      });
    }

    tasks.push({
      id,
      title,
      body: rawBody,
      steps,
    });
  }

  return tasks;
}

export function markTaskComplete(content: string, taskId: number): string {
  const tasks = parseTasks(content);
  const taskIndex = tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) return content;

  // Find all ## headings to locate task boundaries
  const headingRegex = /^##\s+(.+)$/gm;
  const headings: { index: number; length: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(content)) !== null) {
    headings.push({ index: match.index, length: match[0].length });
  }

  if (taskIndex >= headings.length) return content;

  const start = headings[taskIndex].index;
  const end = taskIndex + 1 < headings.length ? headings[taskIndex + 1].index : content.length;

  let section = content.slice(start, end);

  // Mark title checkbox as [X] if present, or add [X] if absent
  if (/^##\s*\[\s*[ xX]?\s*\]/.test(section)) {
    section = section.replace(/^(##\s*\[)\s*[ xX]?\s*(\])/, '$1X$2');
  } else {
    section = section.replace(/^(##\s*)/, '$1[X] ');
  }

  return content.slice(0, start) + section + content.slice(end);
}

export function findNextTask(tasks: Task[]): Task | null {
  for (const task of tasks) {
    const titleLineMatch = task.body.match(/^##\s*\[\s*([ xX]?)\s*\]\s*/);
    const hasTitleCheckbox = titleLineMatch !== null;
    const titleChecked = hasTitleCheckbox && titleLineMatch[1].toUpperCase() === 'X';
    const hasUncheckedSteps = task.steps.some(step => !step.checked);

    // Return task if:
    // 1. Title checkbox is unchecked, OR
    // 2. No title checkbox AND at least one unchecked step, OR
    // 3. Title checkbox is checked BUT there are unchecked steps
    if (hasTitleCheckbox && !titleChecked) {
      return task;
    }

    if (!hasTitleCheckbox && hasUncheckedSteps) {
      return task;
    }

    if (hasTitleCheckbox && titleChecked && hasUncheckedSteps) {
      return task;
    }
  }

  return null;
}
