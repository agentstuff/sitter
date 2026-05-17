import { writeFile, rename, mkdir, unlink } from 'fs/promises';
import { dirname, join } from 'path';

export async function atomicWrite(filePath: string, content: string): Promise<void> {
  const parentDir = dirname(filePath);
  const tempPath = join(parentDir, `.tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  try {
    await mkdir(parentDir, { recursive: true });
    await writeFile(tempPath, content, 'utf-8');
    await rename(tempPath, filePath);
  } catch (err) {
    // Clean up temp file if it was created
    try {
      await unlink(tempPath);
    } catch {
      // ignore cleanup errors (temp file may not exist)
    }
    throw new Error(
      `Failed to write file ${filePath}: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
