import { readFileSync } from 'fs';
import yaml from 'js-yaml';
import { settingsPath } from './paths.js';

export interface SitterConfig {
  review: {
    ai_comments: boolean;
  };
}

const DEFAULT_CONFIG: SitterConfig = {
  review: {
    ai_comments: true,
  },
};

export function loadConfig(): SitterConfig {
  const path = settingsPath();

  try {
    const content = readFileSync(path, 'utf-8');
    const parsed = yaml.load(content);

    if (parsed === null || parsed === undefined) {
      return DEFAULT_CONFIG;
    }

    if (typeof parsed !== 'object') {
      throw new Error(`Invalid settings.yaml: expected object, got ${typeof parsed}`);
    }

    return mergeDefaults(
      parsed as unknown as Record<string, unknown>,
      DEFAULT_CONFIG as unknown as Record<string, unknown>
    ) as unknown as SitterConfig;
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') {
      return DEFAULT_CONFIG;
    }

    if (err instanceof yaml.YAMLException) {
      throw new Error(`Malformed settings.yaml: ${err.message}`);
    }

    throw err;
  }
}

function mergeDefaults(
  parsed: Record<string, unknown>,
  defaults: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...defaults };

  for (const key of Object.keys(parsed)) {
    const value = parsed[key];
    if (value !== undefined && value !== null) {
      if (
        typeof value === 'object' &&
        !Array.isArray(value) &&
        typeof result[key] === 'object' &&
        result[key] !== null &&
        !Array.isArray(result[key])
      ) {
        result[key] = mergeDefaults(
          value as Record<string, unknown>,
          result[key] as Record<string, unknown>
        );
      } else {
        result[key] = value;
      }
    }
  }

  return result;
}
