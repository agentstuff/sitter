import { install } from './install.js';
import { getAgentSelection } from '../utils/prompt.js';
import { error } from '../utils/output.js';

/**
 * Orchestrates the install action with interactive agent selection.
 *
 * - If --agent is specified, that agent is installed directly.
 * - If no --agent and running in a TTY, an interactive prompt asks the user
 *   to choose opencode, claude, or both.
 * - If both is chosen, opencode is installed first; claude is installed second.
 */
export async function handleInstall(options: { agent?: string }): Promise<void> {
  try {
    const selection = await getAgentSelection(options.agent);

    if (selection === 'both') {
      const opencodeOk = await install({ agent: 'opencode' });
      if (!opencodeOk) return;
      await install({ agent: 'claude' });
    } else {
      await install({ agent: selection });
    }
  } catch (err) {
    if (err instanceof Error && err.message === 'unsupported_agent') {
      error('UNSUPPORTED_AGENT', err.message);
    } else {
      error(
        'MISSING_AGENT',
        err instanceof Error ? err.message : String(err),
      );
    }
  }
}
