import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, existsSync, readdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { atomicWrite } from './atomic-write.js';

let originalCwd: string;

describe('atomicWrite', () => {
  let tempDir: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), 'sitter-atomic-test-'));
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('writes content to a file', async () => {
    const filePath = join(tempDir, 'test.txt');
    await atomicWrite(filePath, 'hello world');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toBe('hello world');
  });

  it('creates parent directories if they do not exist', async () => {
    const filePath = join(tempDir, 'nested', 'deep', 'file.txt');
    await atomicWrite(filePath, 'deep content');
    expect(existsSync(filePath)).toBe(true);
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toBe('deep content');
  });

  it('overwrites existing files', async () => {
    const filePath = join(tempDir, 'existing.txt');
    await atomicWrite(filePath, 'first');
    await atomicWrite(filePath, 'second');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toBe('second');
  });

  it('does not leave temp files behind', async () => {
    const filePath = join(tempDir, 'clean.txt');
    await atomicWrite(filePath, 'data');
    const files = tempDir;
    // There should be no .tmp-* files
    const entries = readdirSync(tempDir);
    const tmpFiles = entries.filter((f: string) => f.startsWith('.tmp-'));
    expect(tmpFiles.length).toBe(0);
  });
});
