import { emitKeypressEvents } from 'readline';

interface AgentItem {
  label: string;
  value: 'opencode' | 'claude';
}

/**
 * Displays an interactive checkbox menu and returns the user's agent selection.
 *
 * @param input - Readable stream for reading user input (default: process.stdin)
 * @param output - Writable stream for writing prompts (default: process.stdout)
 * @returns The selected agent string: 'opencode', 'claude', or 'both'
 */
export async function promptForAgent(
  input: NodeJS.ReadableStream = process.stdin,
  output: NodeJS.WritableStream = process.stdout,
): Promise<'opencode' | 'claude' | 'both'> {
  const items: AgentItem[] = [
    { label: 'opencode', value: 'opencode' },
    { label: 'claude', value: 'claude' },
  ];

  return new Promise<'opencode' | 'claude' | 'both'>((resolve) => {
    let cursorIndex = 0;
    const checked = new Set<number>();
    let warning = false;
    let lastRenderedLines = 0;
    let resolved = false;
    let rawModeEnabled = false;

    const hasSetRawMode =
      'setRawMode' in input && typeof (input as any).setRawMode === 'function';

    function cleanup(): void {
      if (resolved) return;
      resolved = true;

      input.removeListener('keypress', onKeypress);
      process.removeListener('SIGINT', onSigint);
      input.removeListener('end', cleanup);
      input.removeListener('error', cleanup);

      if (rawModeEnabled && hasSetRawMode) {
        (input as NodeJS.ReadStream).setRawMode(false);
        rawModeEnabled = false;
      }

      // Stop the stream from keeping the event loop alive
      if ('pause' in input && typeof (input as any).pause === 'function') {
        (input as NodeJS.ReadStream).pause();
      }

      output.write('\x1B[?25h');
      output.write('\n');
    }

    function computeResult(): 'opencode' | 'claude' | 'both' {
      const opencodeChecked = checked.has(0);
      const claudeChecked = checked.has(1);
      if (opencodeChecked && claudeChecked) return 'both';
      if (claudeChecked) return 'claude';
      return 'opencode';
    }

    function render(): void {
      const lines: string[] = [];
      lines.push('? Select target AI agent(s):');

      for (let i = 0; i < items.length; i++) {
        const isCursor = i === cursorIndex;
        const isChecked = checked.has(i);
        const prefix = isCursor ? '>' : '  ';
        const checkbox = isChecked ? '[x]' : '[ ]';
        lines.push(`${prefix} ${checkbox} ${items[i].label}`);
      }

      lines.push(
        '(Use \u2191/\u2193 to navigate, space to select, enter to confirm)',
      );

      if (warning) {
        lines.push('\u26A0 Please select at least one agent.');
      }

      if (lastRenderedLines > 0) {
        output.write(`\x1B[${lastRenderedLines}A`);
      }

      for (const line of lines) {
        output.write(line + '\x1B[K\n');
      }

      if (lastRenderedLines > lines.length) {
        output.write('\x1B[J');
      }

      lastRenderedLines = lines.length;
    }

    function onKeypress(
      _str: string,
      key: { name?: string; ctrl?: boolean },
    ): void {
      if (resolved) return;

      if (key.ctrl && key.name === 'c') {
        cleanup();
        process.exit(0);
        return;
      }

      let needsRender = false;

      if (key.name === 'up') {
        cursorIndex = cursorIndex === 0 ? items.length - 1 : cursorIndex - 1;
        needsRender = true;
      } else if (key.name === 'down') {
        cursorIndex = cursorIndex === items.length - 1 ? 0 : cursorIndex + 1;
        needsRender = true;
      } else if (key.name === 'space') {
        if (checked.has(cursorIndex)) {
          checked.delete(cursorIndex);
        } else {
          checked.add(cursorIndex);
        }
        warning = false;
        needsRender = true;
      } else if (key.name === 'return') {
        if (checked.size > 0) {
          cleanup();
          resolve(computeResult());
          return;
        } else {
          warning = true;
          needsRender = true;
        }
      }

      if (needsRender) {
        render();
      }
    }

    function onSigint(): void {
      cleanup();
      process.exit(0);
    }

    // Hide cursor
    output.write('\x1B[?25l');

    // Setup keypress events
    emitKeypressEvents(input);

    if (hasSetRawMode) {
      (input as NodeJS.ReadStream).setRawMode(true);
      rawModeEnabled = true;
    }

    input.on('keypress', onKeypress);
    process.once('SIGINT', onSigint);
    input.once('end', cleanup);
    input.once('error', cleanup);

    // Initial render
    render();
  });
}

/**
 * Resolves the target agent(s) from either a CLI flag or interactive prompt.
 *
 * Decision logic:
 * 1. If `optionsAgent` is provided (--agent flag), validate and return it directly.
 * 2. If running in a TTY, launch the interactive `promptForAgent()` menu.
 * 3. Otherwise (non-interactive/no flag), throw an error asking the user to supply --agent.
 *
 * @param optionsAgent - Agent string from the `--agent` CLI option, or undefined.
 * @returns The resolved agent: 'opencode', 'claude', or 'both'.
 * @throws Error with message 'unsupported_agent' for invalid --agent values.
 * @throws Error describing the non-interactive-mode requirement when no TTY is present.
 */
export async function getAgentSelection(
  optionsAgent?: string,
): Promise<'opencode' | 'claude' | 'both'> {
  if (optionsAgent) {
    if (optionsAgent === 'opencode' || optionsAgent === 'claude') {
      return optionsAgent;
    }
    throw new Error('unsupported_agent');
  }

  if (process.stdin.isTTY && process.stdout.isTTY) {
    return promptForAgent();
  }

  throw new Error(
    'No --agent specified and running in non-interactive mode. Use --agent <opencode|claude>.',
  );
}
