/** Чек-листы находятся отдельно от кода, в корневой папке /checklists.
 *  Vite автоматически находит все *.json — вручную поддерживать реестр не нужно.
 *  При изменении JSON на опубликованном сайте требуется повторная сборка.
 */
export type ChecklistItem = { pos: number; item: string; hint?: string };
export type ChecklistPart = { pos: number; name: string; items: ChecklistItem[] };
export type Checklist = { id: number; name: string; parts: ChecklistPart[] };
export type FlatStep = ChecklistItem & { partName: string; partPos: number };

const files = import.meta.glob('../checklists/*.json', { eager: true, import: 'default' });

function isChecklist(value: unknown): value is Checklist {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === 'number' && Number.isInteger(v.id) && typeof v.name === 'string' &&
    Array.isArray(v.parts) && v.parts.every(p => typeof p === 'object' && p !== null &&
      typeof p.pos === 'number' && typeof p.name === 'string' && Array.isArray(p.items) &&
      p.items.every((it: unknown) => typeof it === 'object' && it !== null &&
        typeof (it as ChecklistItem).pos === 'number' && typeof (it as ChecklistItem).item === 'string'));
}

const names = new Set<number>();
export const loadErrors: string[] = [];
export const checklists: Checklist[] = Object.entries(files).flatMap(([filename, data]) => {
  if (!isChecklist(data)) { loadErrors.push(`Неверная структура файла ${filename}`); return []; }
  if (names.has(data.id)) { loadErrors.push(`Повторяющийся id=${data.id} в ${filename}`); return []; }
  names.add(data.id);
  return [data];
}).sort((a, b) => a.name.localeCompare(b.name, 'ru'));

export function flatten(checklist: Checklist): FlatStep[] {
  return [...checklist.parts].sort((a,b)=>a.pos-b.pos).flatMap(p =>
    [...p.items].sort((a,b)=>a.pos-b.pos).map(it=>({...it, partName:p.name.trim() || `Этап ${p.pos}`, partPos:p.pos})));
}
