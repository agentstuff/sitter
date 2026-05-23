import { install } from './install.js';
import { getAgentSelection } from '../utils/prompt.js';
import { error } from '../utils/output.js';
import { checkForUpdate } from '../utils/npm-registry.js';
import { packageVersion } from '../utils/version.js';
import chalk from 'chalk';

/**
 * Orchestrates the install action with interactive agent selection.
 *
 * - If --agent is specified, that agent is installed directly.
 * - If no --agent and running in a TTY, an interactive prompt asks the user
 *   to choose one or more agents.
 * - All selected agents are installed sequentially.
 */
export async function handleInstall(options: { agent?: string }): Promise<void> {
  try {
    // Check for updates first, before any prompt
    const newerVersion = await checkForUpdate();
    if (newerVersion) {
      console.log(chalk.yellow(`A new version of Sitter is available: ${newerVersion} (you have ${packageVersion}).`));
      console.log(chalk.yellow('Run: npm install -g @agentstuff/sitter'));
      console.log(chalk.yellow('Note: After updating, run `sitter install` again to refresh your skills.'));
      console.log(''); // empty line for spacing
    }

    const selection = await getAgentSelection(options.agent);

    if (selection.length === 0) {
      console.log('Installation cancelled.');
      return;
    }

    for (const agent of selection) {
      const ok = await install({ agent });
      if (!ok) return;
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
