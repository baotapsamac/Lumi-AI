import type { Revision } from './pedagogical-approval';

export type StudioProject<T> = {
  format: 'lumi-ai-design-project';
  version: 1;
  title: string;
  current: Revision<T>;
  history: Revision<T>[];
  saved_at: string;
};

/** Portable JSON project persistence. Does not store API credentials. */
export function serializeStudioProject<T>(project: StudioProject<T>): string {
  if (project.format !== 'lumi-ai-design-project' || project.version !== 1) {
    throw new Error('Unsupported Lumi-AI project format.');
  }
  return JSON.stringify(project, null, 2);
}

export function parseStudioProject<T>(raw: string): StudioProject<T> {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object') throw new Error('Invalid project.');
  const project = value as Partial<StudioProject<T>>;
  if (
    project.format !== 'lumi-ai-design-project' || project.version !== 1
    || !project.current || !Array.isArray(project.history)
    || typeof project.title !== 'string' || !Number.isInteger(project.current.revision)
    || !Array.isArray(project.current.approvals)
  ) {
    throw new Error('Invalid Lumi-AI project structure.');
  }
  return project as StudioProject<T>;
}

export function downloadStudioProject<T>(project: StudioProject<T>): void {
  const url = URL.createObjectURL(new Blob([serializeStudioProject(project)], { type: 'application/json' }));
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'lumi-ai-design-project.json';
    anchor.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}
