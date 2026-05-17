/**
 * Target Spec Parser
 *
 * Parses target specification files into structured components.
 */

export interface TargetSpec {
  header: string;
  requirements: Map<string, string>;
  order: string[]; // preserves original order of requirement names
}

const REQUIREMENTS_HEADER = '## Requirements';
const REQUIREMENT_HEADER_PREFIX = '### Requirement:';

/**
 * Parse a target spec into header, requirements map, and order.
 */
export function parseTargetSpec(content: string): TargetSpec {
  const lines = content.split('\n');

  // Find the ## Requirements line
  let requirementsLineIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === REQUIREMENTS_HEADER) {
      requirementsLineIndex = i;
      break;
    }
  }

  // If no ## Requirements found, everything is the header
  if (requirementsLineIndex === -1) {
    return {
      header: content.trimEnd(),
      requirements: new Map(),
      order: [],
    };
  }

  const header = lines.slice(0, requirementsLineIndex).join('\n').trimEnd();
  const requirementsLines = lines.slice(requirementsLineIndex + 1);

  const requirements = new Map<string, string>();
  const order: string[] = [];

  let currentName: string | null = null;
  let currentContent: string[] = [];

  function flushRequirement() {
    if (currentName !== null) {
      const content = currentContent.join('\n').trimEnd();
      requirements.set(currentName, content);
      order.push(currentName);
    }
    currentName = null;
    currentContent = [];
  }

  for (const line of requirementsLines) {
    if (line.startsWith(REQUIREMENT_HEADER_PREFIX)) {
      flushRequirement();
      currentName = line.slice(REQUIREMENT_HEADER_PREFIX.length).trim();
      currentContent.push(line);
    } else if (currentName !== null) {
      currentContent.push(line);
    }
    // Ignore lines before the first requirement
  }

  flushRequirement();

  return { header, requirements, order };
}
