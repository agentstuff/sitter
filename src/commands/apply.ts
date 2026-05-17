import { assertActiveProject } from '../state/validation.js';
import { readProjectStatus, writeProjectStatus } from '../state/project-status.js';
import { success, error } from '../utils/output.js';
import { scanFiles } from '../utils/file-scanner.js';
import { findAiComments } from '../utils/ai-detector.js';

export async function apply(): Promise<void> {
  let projectName: string;
  try {
    projectName = await assertActiveProject();
  } catch (err) {
    error('NO_ACTIVE_PROJECT', err instanceof Error ? err.message : String(err));
    return;
  }

  const projectStatus = await readProjectStatus(projectName);
  if (projectStatus.status !== 'REVIEW') {
    error('NOT_REVIEW_PHASE', 'Project is not in review phase');
    return;
  }

  const aiComments: { file: string; line: number }[] = [];

  for await (const file of scanFiles(process.cwd())) {
    const comments = findAiComments(file.path, file.content);
    aiComments.push(...comments);
  }

  if (aiComments.length > 0) {
    success({ clean: false, ai_comments: aiComments });
    return;
  }

  await writeProjectStatus(projectName, { status: 'IMPLEMENT', currentTask: null });
  success({ clean: true, status: 'IMPLEMENT' });
}
