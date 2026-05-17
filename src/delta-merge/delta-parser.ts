/**
 * Delta Spec Parser
 *
 * Parses delta specification files that describe changes to target specs.
 */

export interface Requirement {
  name: string;
  content: string;
}

export interface Rename {
  from: string;
  to: string;
}

export interface DeltaPlan {
  added: Requirement[];
  modified: Requirement[];
  removed: Requirement[];
  renamed: Rename[];
}

const SECTION_HEADERS = {
  ADDED: '## ADDED Requirements',
  MODIFIED: '## MODIFIED Requirements',
  REMOVED: '## REMOVED Requirements',
  RENAMED: '## RENAMED Requirements',
};

const REQUIREMENT_HEADER_PREFIX = '### Requirement:';

/**
 * Parse a delta spec into a structured DeltaPlan.
 */
export function parseDeltaSpec(content: string): DeltaPlan {
  const lines = content.split('\n');
  const plan: DeltaPlan = {
    added: [],
    modified: [],
    removed: [],
    renamed: [],
  };

  let currentSection: keyof typeof SECTION_HEADERS | null = null;
  let currentRequirement: Requirement | null = null;

  function flushRequirement() {
    if (!currentRequirement || !currentSection) return;

    const trimmedContent = currentRequirement.content.trimEnd();
    const req = { ...currentRequirement, content: trimmedContent };

    switch (currentSection) {
      case 'ADDED':
        plan.added.push(req);
        break;
      case 'MODIFIED':
        plan.modified.push(req);
        break;
      case 'REMOVED':
        // For removed, we only need the name, but we store content too for consistency
        plan.removed.push({ name: req.name, content: '' });
        break;
    }
    currentRequirement = null;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for section headers
    if (line.startsWith('## ')) {
      flushRequirement();

      if (line === SECTION_HEADERS.ADDED) {
        currentSection = 'ADDED';
        continue;
      }
      if (line === SECTION_HEADERS.MODIFIED) {
        currentSection = 'MODIFIED';
        continue;
      }
      if (line === SECTION_HEADERS.REMOVED) {
        currentSection = 'REMOVED';
        continue;
      }
      if (line === SECTION_HEADERS.RENAMED) {
        currentSection = 'RENAMED';
        continue;
      }

      // Unknown section — reset current section if we encounter another ## header
      currentSection = null;
      continue;
    }

    if (!currentSection) continue;

    if (currentSection === 'RENAMED') {
      const fromMatch = line.match(/^- FROM:\s*`?### Requirement:\s*(.+?)`?\s*$/);
      const toMatch = line.match(/^- TO:\s*`?### Requirement:\s*(.+?)`?\s*$/);

      if (fromMatch) {
        plan.renamed.push({ from: fromMatch[1].trim(), to: '' });
      } else if (toMatch && plan.renamed.length > 0) {
        plan.renamed[plan.renamed.length - 1].to = toMatch[1].trim();
      }
      continue;
    }

    // For ADDED, MODIFIED, REMOVED sections
    if (line.startsWith(REQUIREMENT_HEADER_PREFIX)) {
      flushRequirement();
      const name = line.slice(REQUIREMENT_HEADER_PREFIX.length).trim();
      currentRequirement = { name, content: line + '\n' };
      continue;
    }

    if (currentRequirement) {
      currentRequirement.content += line + '\n';
    }
  }

  flushRequirement();

  return plan;
}
