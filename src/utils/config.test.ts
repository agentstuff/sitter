import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { loadConfig } from './config.js';

let originalCwd: string;

describe('config loader', () => {
  let tempDir: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), 'sitter-config-test-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns defaults when settings.yaml does not exist', () => {
    const config = loadConfig();
    expect(config).toEqual({ review: { ai_comments: true } });
  });

  it('loads config from settings.yaml', () => {
    const sitterDirPath = join(tempDir, 'sitter');
    mkdirSync(sitterDirPath, { recursive: true });
    const settingsFile = join(sitterDirPath, 'settings.yaml');
    writeFileSync(settingsFile, 'review:\n  ai_comments: false\n', 'utf-8');

    const config = loadConfig();
    expect(config.review.ai_comments).toBe(false);
  });

  it('merges partial config with defaults', () => {
    const sitterDirPath = join(tempDir, 'sitter');
    mkdirSync(sitterDirPath, { recursive: true });
    const settingsFile = join(sitterDirPath, 'settings.yaml');
    writeFileSync(settingsFile, 'review:\n  ai_comments: false\n', 'utf-8');

    const config = loadConfig();
    expect(config).toEqual({ review: { ai_comments: false } });
  });

  it('throws on malformed YAML', () => {
    const sitterDirPath = join(tempDir, 'sitter');
    mkdirSync(sitterDirPath, { recursive: true });
    const settingsFile = join(sitterDirPath, 'settings.yaml');
    writeFileSync(settingsFile, '{{{invalid yaml', 'utf-8');

    expect(() => loadConfig()).toThrow('Malformed settings.yaml');
  });

  it('returns defaults for empty yaml file', () => {
    const sitterDirPath = join(tempDir, 'sitter');
    mkdirSync(sitterDirPath, { recursive: true });
    const settingsFile = join(sitterDirPath, 'settings.yaml');
    writeFileSync(settingsFile, '', 'utf-8');

    const config = loadConfig();
    expect(config).toEqual({ review: { ai_comments: true } });
  });
});
