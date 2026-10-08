import schema from '../../pedagogical/lesson.schema.json';

type S = Record<string, any>;
export type SchemaIssue = { path: string; message: string };
const root = schema as S;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const isObject = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
function check(value: unknown, node: S, path: string): SchemaIssue[] {
  if (node.$ref) {
    const key = String(node.$ref).replace('#/$defs/', '');
    const def = (root.$defs as S)[key];
    return def ? check(value, def, path) : [{ path, message: 'Unknown schema reference: ' + key }];
  }
  const errors: SchemaIssue[] = [];
  const add = (message: string) => errors.push({ path, message });
  if (node.const !== undefined && !same(value, node.const)) add('Must equal ' + JSON.stringify(node.const));
  if (node.enum && !node.enum.some((v: unknown) => same(v, value))) add('Value not in enum');
  if (node.oneOf) {
    const passes = (node.oneOf as S[]).filter((n) => check(value, n, path).length === 0).length;
    if (passes !== 1) add('Must match exactly one schema');
  }
  const types = node.type === undefined ? [] : Array.isArray(node.type) ? node.type : [node.type];
  const validType = (t: string) => t === 'null' ? value === null
    : t === 'array' ? Array.isArray(value)
    : t === 'object' ? isObject(value)
    : t === 'integer' ? typeof value === 'number' && Number.isInteger(value)
    : t === 'number' ? typeof value === 'number' && Number.isFinite(value)
    : typeof value === t;
  if (types.length && !types.some(validType)) { add('Invalid type: expected ' + types.join('|')); return errors; }
  if (typeof value === 'string') {
    if (node.minLength !== undefined && [...value].length < node.minLength) add('String too short');
    if (node.maxLength !== undefined && [...value].length > node.maxLength) add('String too long');
    if (node.pattern && !(new RegExp(node.pattern, 'u')).test(value)) add('Pattern mismatch');
  }
  if (typeof value === 'number' && node.minimum !== undefined && value < node.minimum) add('Below minimum');
  if (Array.isArray(value)) {
    if (node.minItems !== undefined && value.length < node.minItems) add('Array too short');
    if (node.uniqueItems && value.some((v, i) => value.slice(0, i).some((x) => same(x, v)))) add('Duplicate array item');
    if (node.items) value.forEach((v, i) => errors.push(...check(v, node.items, path + '[' + i + ']')));
  }
  if (isObject(value)) {
    for (const field of node.required || []) if (!Object.prototype.hasOwnProperty.call(value, field)) errors.push({ path: path + '.' + field, message: 'Required field missing' });
    for (const [key, val] of Object.entries(value)) {
      if (node.properties?.[key]) errors.push(...check(val, node.properties[key], path + '.' + key));
      else if (node.additionalProperties === false) errors.push({ path: path + '.' + key, message: 'Unknown field' });
    }
  }
  if (node.allOf) for (const part of node.allOf as S[]) {
    // Draft 2020-12 if/then: a matching condition activates the consequent.
    if (part.if) {
      if (check(value, part.if, path).length === 0 && part.then) errors.push(...check(value, part.then, path));
    } else errors.push(...check(value, part, path));
  }
  return errors;
}
export function validateLessonSchema(value: unknown): { valid: boolean; issues: SchemaIssue[] } {
  const issues = check(value, root, '$');
  return { valid: issues.length === 0, issues };
}
