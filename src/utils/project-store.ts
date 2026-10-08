import type { MaterializedH5PPlan } from './h5p-pipeline';

export type LumiProject = {
  version: '1.0';
  id: string;
  title: string;
  sourceFileName: string;
  updatedAt: string;
  plan: MaterializedH5PPlan;
};

const KEY = 'lumiai:last-docx-project';

export function saveDocxProject(project: LumiProject): void {
  localStorage.setItem(KEY, JSON.stringify(project));
}

export function loadDocxProject(): LumiProject | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const project = JSON.parse(raw) as LumiProject;
    return project?.version === '1.0' && project.plan ? project : null;
  } catch {
    return null;
  }
}

export function clearDocxProject(): void {
  localStorage.removeItem(KEY);
}

export function downloadProjectFile(project: LumiProject): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${project.title || 'lumi-project'}.lumiai.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function importProjectFile(file: File): Promise<LumiProject> {
  if (!file.name.toLowerCase().endsWith('.lumiai.json')) {
    throw new Error('Chỉ hỗ trợ tệp dự án .lumiai.json');
  }
  const project = JSON.parse(await file.text()) as LumiProject;
  if (
    project.version !== '1.0' ||
    !project.plan ||
    !Array.isArray(project.plan.chapters) ||
    !project.title ||
    !project.id
  ) {
    throw new Error('Tệp dự án Lumi-AI không hợp lệ.');
  }
  return project;
}
