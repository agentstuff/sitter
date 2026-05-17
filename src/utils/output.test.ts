import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { success, error, output } from './output.js';

describe('output utilities', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let logSpy: any;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('success outputs structured JSON with success: true', () => {
    success({ foo: 'bar', count: 42 });
    expect(logSpy).toHaveBeenCalledOnce();
    const parsed = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(parsed).toEqual({ success: true, foo: 'bar', count: 42 });
  });

  it('error outputs structured JSON with error code and message', () => {
    error('NOT_FOUND', 'Resource not found');
    expect(logSpy).toHaveBeenCalledOnce();
    const parsed = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(parsed).toEqual({ error: 'NOT_FOUND', message: 'Resource not found' });
  });

  it('output outputs raw data as JSON', () => {
    output({ projects: ['a', 'b'] });
    expect(logSpy).toHaveBeenCalledOnce();
    const parsed = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(parsed).toEqual({ projects: ['a', 'b'] });
  });

  it('success with empty data only contains success: true', () => {
    success({});
    const parsed = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(parsed).toEqual({ success: true });
  });
});
