import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as readline from 'readline';

// ---- Readline mock ----

vi.mock('readline', () => ({
  emitKeypressEvents: vi.fn(),
}));

import { promptForAgent, getAgentSelection } from './prompt.js';

// ---- Helpers ----

/**
 * Minimal readable stream that satisfies NodeJS.ReadableStream and also
 * exposes a mock setRawMode so raw-mode handling can be exercised.
 */
function fakeReadable(): NodeJS.ReadableStream & { setRawMode: ReturnType<typeof vi.fn> } {
  const { Readable } = require('stream');
  const stream = new Readable({ read() {} });
  (stream as any).setRawMode = vi.fn();
  return stream as NodeJS.ReadableStream & { setRawMode: ReturnType<typeof vi.fn> };
}

/**
 * Minimal writable stream that collects written data for assertion.
 */
function fakeWritable(): NodeJS.WritableStream & { getData: () => string } {
  const { Writable } = require('stream');
  let data = '';
  const stream = new Writable({
    write(chunk: unknown, _encoding: string, callback: () => void) {
      data += String(chunk);
      callback();
    },
  });
  (stream as any).getData = () => data;
  return stream as NodeJS.WritableStream & { getData: () => string };
}

function emitKeypress(stream: NodeJS.EventEmitter, str: string, key: { name?: string; ctrl?: boolean }) {
  stream.emit('keypress', str, key);
}

// ---- Test setup / teardown ----

beforeEach(() => {
  vi.clearAllMocks();
});

// ---- Tests ----

describe('promptForAgent', () => {
  it('selects only claude with space, enter', async () => {
    const input = fakeReadable();
    const output = fakeWritable();
    const promise = promptForAgent(input, output);
    emitKeypress(input, '', { name: 'space' });
    emitKeypress(input, '', { name: 'return' });
    const result = await promise;
    expect(result).toEqual(['claude']);
    expect(readline.emitKeypressEvents).toHaveBeenCalledWith(input);
  });

  it('selects only kilo with down, space, enter', async () => {
    const input = fakeReadable();
    const output = fakeWritable();
    const promise = promptForAgent(input, output);
    emitKeypress(input, '', { name: 'down' });
    emitKeypress(input, '', { name: 'space' });
    emitKeypress(input, '', { name: 'return' });
    const result = await promise;
    expect(result).toEqual(['kilo']);
  });

  it('selects claude and kilo with space, down, space, enter', async () => {
    const input = fakeReadable();
    const output = fakeWritable();
    const promise = promptForAgent(input, output);
    emitKeypress(input, '', { name: 'space' });
    emitKeypress(input, '', { name: 'down' });
    emitKeypress(input, '', { name: 'space' });
    emitKeypress(input, '', { name: 'return' });
    const result = await promise;
    expect(result).toEqual(['claude', 'kilo']);
  });

  it('wraps cursor from top to bottom on up arrow', async () => {
    const input = fakeReadable();
    const output = fakeWritable();
    const promise = promptForAgent(input, output);
    emitKeypress(input, '', { name: 'up' });
    await new Promise((r) => setTimeout(r, 0));
    const data = output.getData();
    expect(data).toContain('> [ ] OpenCode');
    // Resolve promise so test completes cleanly.
    emitKeypress(input, '', { name: 'space' });
    emitKeypress(input, '', { name: 'return' });
    await promise;
  });

  it('wraps cursor from bottom to top on down arrow', async () => {
    const input = fakeReadable();
    const output = fakeWritable();
    const promise = promptForAgent(input, output);
    emitKeypress(input, '', { name: 'down' }); // cursor → kilo
    emitKeypress(input, '', { name: 'down' }); // cursor → opencode
    emitKeypress(input, '', { name: 'down' }); // cursor wraps → claude
    await new Promise((r) => setTimeout(r, 0));
    const data = output.getData();
    expect(data).toContain('> [ ] Claude Code');
    // Resolve promise so test completes cleanly.
    emitKeypress(input, '', { name: 'space' });
    emitKeypress(input, '', { name: 'return' });
    await promise;
  });

  it('toggles checkbox twice back to unchecked', async () => {
    const input = fakeReadable();
    const output = fakeWritable();
    const promise = promptForAgent(input, output);
    emitKeypress(input, '', { name: 'space' }); // check claude
    emitKeypress(input, '', { name: 'space' }); // uncheck claude
    emitKeypress(input, '', { name: 'down' }); // move to kilo
    emitKeypress(input, '', { name: 'space' }); // check kilo
    emitKeypress(input, '', { name: 'return' }); // confirm
    const result = await promise;
    expect(result).toEqual(['kilo']);
    const data = output.getData();
    // Verify the FINAL rendered state for claude is unchecked (not [x]).
    const lastClaudeIdx = data.lastIndexOf('Claude Code');
    expect(data.slice(lastClaudeIdx - 4, lastClaudeIdx)).not.toBe('[x] ');
  });

  it('shows warning on empty submit and resolves after selection', async () => {
    const input = fakeReadable();
    const output = fakeWritable();
    const promise = promptForAgent(input, output);
    emitKeypress(input, '', { name: 'return' });
    await new Promise((r) => setTimeout(r, 0));
    expect(output.getData()).toContain('⚠ Please select at least one agent.');
    emitKeypress(input, '', { name: 'space' });
    emitKeypress(input, '', { name: 'return' });
    const result = await promise;
    expect(result).toEqual(['claude']);
  });

  it('dismisses warning after space press', async () => {
    const input = fakeReadable();
    const output = fakeWritable();
    const promise = promptForAgent(input, output);
    emitKeypress(input, '', { name: 'return' });
    await new Promise((r) => setTimeout(r, 0));
    const afterEnter = output.getData();
    expect(afterEnter).toContain('⚠ Please select at least one agent.');

    emitKeypress(input, '', { name: 'space' });
    await new Promise((r) => setTimeout(r, 0));
    const afterSpace = output.getData();
    // The newly written bytes after the space press should not contain the warning.
    const delta = afterSpace.slice(afterEnter.length);
    expect(delta).not.toContain('⚠ Please select at least one agent.');

    emitKeypress(input, '', { name: 'return' });
    const result = await promise;
    expect(result).toEqual(['claude']);
  });

  it('calls process.exit(0) on ctrl+c and performs cleanup', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      /* swallowed — test should not actually exit */
    }) as never);

    const input = fakeReadable();
    const output = fakeWritable();

    // Fire and forget — the promise will never resolve because exit(0)
    // is called (mocked to no-op) and cleanup is performed.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    promptForAgent(input, output);

    // Wait a micro-tick so the keypress listener is registered.
    await new Promise((r) => setTimeout(r, 0));

    emitKeypress(input, '', { name: 'c', ctrl: true });

    expect(exitSpy).toHaveBeenCalledWith(0);
    expect(input.setRawMode).toHaveBeenCalledWith(false);
    expect(output.getData()).toContain('\x1B[?25h');

    exitSpy.mockRestore();
  });

  it('quits and returns empty array when q is pressed', async () => {
    const input = fakeReadable();
    const output = fakeWritable();
    const promise = promptForAgent(input, output);
    emitKeypress(input, '', { name: 'q' });
    const result = await promise;
    expect(result).toEqual([]);
    expect(input.setRawMode).toHaveBeenCalledWith(false);
    expect(output.getData()).toContain('\x1B[?25h');
  });

  it('quits and returns empty array when escape is pressed', async () => {
    const input = fakeReadable();
    const output = fakeWritable();
    const promise = promptForAgent(input, output);
    emitKeypress(input, '', { name: 'escape' });
    const result = await promise;
    expect(result).toEqual([]);
    expect(input.setRawMode).toHaveBeenCalledWith(false);
    expect(output.getData()).toContain('\x1B[?25h');
  });

  it('cleans up on successful selection', async () => {
    const input = fakeReadable();
    const output = fakeWritable();
    const promise = promptForAgent(input, output);
    emitKeypress(input, '', { name: 'space' });
    emitKeypress(input, '', { name: 'return' });
    await promise;
    expect(input.setRawMode).toHaveBeenCalledWith(false);
    expect(output.getData()).toContain('\x1B[?25h');
  });

  it('cleans up when input stream ends', async () => {
    const input = fakeReadable();
    const output = fakeWritable();

    // Fire and forget — cleanup on 'end' does not resolve the promise.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    promptForAgent(input, output);

    // Wait a micro-tick so listeners are registered.
    await new Promise((r) => setTimeout(r, 0));

    input.emit('end');

    expect(input.setRawMode).toHaveBeenCalledWith(false);
    expect(output.getData()).toContain('\x1B[?25h');
  });

  it('handles non-TTY input stream safely', async () => {
    const { Readable } = require('stream');
    const input: NodeJS.ReadableStream = new Readable({ read() {} });
    const output = fakeWritable();
    const promise = promptForAgent(input, output);
    emitKeypress(input, '', { name: 'space' });
    emitKeypress(input, '', { name: 'return' });
    const result = await promise;
    expect(result).toEqual(['claude']);
  });

  it('selects only opencode with down, down, space, enter', async () => {
    const input = fakeReadable();
    const output = fakeWritable();
    const promise = promptForAgent(input, output);
    emitKeypress(input, '', { name: 'down' });
    emitKeypress(input, '', { name: 'down' });
    emitKeypress(input, '', { name: 'space' });
    emitKeypress(input, '', { name: 'return' });
    const result = await promise;
    expect(result).toEqual(['opencode']);
  });

  it('selects all three with space, down, space, down, space, enter', async () => {
    const input = fakeReadable();
    const output = fakeWritable();
    const promise = promptForAgent(input, output);
    emitKeypress(input, '', { name: 'space' });
    emitKeypress(input, '', { name: 'down' });
    emitKeypress(input, '', { name: 'space' });
    emitKeypress(input, '', { name: 'down' });
    emitKeypress(input, '', { name: 'space' });
    emitKeypress(input, '', { name: 'return' });
    const result = await promise;
    expect(result).toEqual(['claude', 'kilo', 'opencode']);
  });
});

describe('getAgentSelection', () => {
  it('returns ["opencode"] immediately when optionsAgent is "opencode"', async () => {
    const result = await getAgentSelection('opencode');
    expect(result).toEqual(['opencode']);
  });

  it('returns ["claude"] immediately when optionsAgent is "claude"', async () => {
    const result = await getAgentSelection('claude');
    expect(result).toEqual(['claude']);
  });

  it('returns ["kilo"] immediately when optionsAgent is "kilo"', async () => {
    const result = await getAgentSelection('kilo');
    expect(result).toEqual(['kilo']);
  });

  it('throws "unsupported_agent" for invalid optionsAgent', async () => {
    await expect(getAgentSelection('invalid')).rejects.toThrow('unsupported_agent');
  });

  it('throws non-interactive error when isTTY is false and no agent given', async () => {
    // Force both stdin and stdout to appear non-TTY.
    // Use Object.defineProperty because vitest's forked process may not have
    // a spy-able getter for isTTY on process.stdin / process.stdout.
    const originalStdinTTY = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY');
    const originalStdoutTTY = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY');

    Object.defineProperty(process.stdin, 'isTTY', {
      get: () => false,
      configurable: true,
    });
    Object.defineProperty(process.stdout, 'isTTY', {
      get: () => false,
      configurable: true,
    });

    try {
      await expect(getAgentSelection()).rejects.toThrow('No --agent specified');
    } finally {
      // Restore original descriptors.
      if (originalStdinTTY) {
        Object.defineProperty(process.stdin, 'isTTY', originalStdinTTY);
      } else {
        Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
      }
      if (originalStdoutTTY) {
        Object.defineProperty(process.stdout, 'isTTY', originalStdoutTTY);
      } else {
        Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true });
      }
    }
  });
});
