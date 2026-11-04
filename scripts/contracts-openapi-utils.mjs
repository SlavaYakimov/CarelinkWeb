import { parse, stringify } from 'yaml';

const REF_RE = /#\/components\/([^/]+)\/(.+)/g;

export function collectComponentRefs(value, refs = new Set()) {
  if (value == null) return refs;
  if (typeof value === 'string') {
    let m;
    while ((m = REF_RE.exec(value)) !== null) {
      refs.add(`${m[1]}/${m[2]}`);
    }
    REF_RE.lastIndex = 0;
    return refs;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectComponentRefs(item, refs);
    return refs;
  }
  if (typeof value === 'object') {
    for (const v of Object.values(value)) collectComponentRefs(v, refs);
  }
  return refs;
}

function pickComponents(fullComponents, initialRefs) {
  const out = {
    securitySchemes: {},
    responses: {},
    parameters: {},
    schemas: {},
  };
  const pending = new Set(initialRefs);
  while (pending.size > 0) {
    const ref = pending.values().next().value;
    pending.delete(ref);
    const [section, name] = ref.split('/');
    if (!out[section]) out[section] = {};
    if (out[section][name]) continue;
    const block = fullComponents?.[section]?.[name];
    if (!block) continue;
    out[section][name] = structuredClone(block);
    for (const nested of collectComponentRefs(block)) {
      if (!out[nested.split('/')[0]]?.[nested.split('/')[1]]) {
        pending.add(nested);
      }
    }
  }
  return out;
}

export function mergeOpenApiDocuments(authDoc, familyDoc) {
  const pathKeys = [
    ...new Set([...Object.keys(authDoc.paths ?? {}), ...Object.keys(familyDoc.paths ?? {})]),
  ].sort();
  const paths = {};
  for (const key of pathKeys) {
    paths[key] = familyDoc.paths?.[key] ?? authDoc.paths[key];
  }

  const tagByName = new Map();
  for (const t of [...(authDoc.tags ?? []), ...(familyDoc.tags ?? [])]) {
    if (t?.name) tagByName.set(t.name, t);
  }

  const mergedComponents = {};
  for (const section of ['securitySchemes', 'responses', 'parameters', 'schemas']) {
    const a = authDoc.components?.[section] ?? {};
    const b = familyDoc.components?.[section] ?? {};
    mergedComponents[section] = { ...a };
    for (const [name, def] of Object.entries(b)) {
      if (mergedComponents[section][name] !== undefined) {
        const prev = JSON.stringify(mergedComponents[section][name]);
        const next = JSON.stringify(def);
        if (prev !== next) {
          throw new Error(`OpenAPI component conflict: components.${section}.${name}`);
        }
      } else {
        mergedComponents[section][name] = def;
      }
    }
  }

  return {
    openapi: authDoc.openapi ?? familyDoc.openapi ?? '3.1.0',
    info: authDoc.info,
    servers: authDoc.servers ?? familyDoc.servers,
    tags: [...tagByName.values()],
    paths,
    components: mergedComponents,
  };
}

export function extractFamilyInviteSpec(combinedDoc) {
  const pathPrefix = (p) =>
    p.startsWith('/families/{familyId}/member-invites') ||
    p.startsWith('/families/{familyId}/role-templates') ||
    p.startsWith('/user/member-invites');

  const paths = {};
  for (const [pathKey, def] of Object.entries(combinedDoc.paths ?? {})) {
    if (pathPrefix(pathKey)) paths[pathKey] = structuredClone(def);
  }

  const refs = collectComponentRefs(paths);
  const components = pickComponents(combinedDoc.components ?? {}, refs);

  const inviteTags = (combinedDoc.tags ?? []).filter((t) => t.name === 'invites');

  return {
    openapi: combinedDoc.openapi ?? '3.1.0',
    info: {
      title: 'Carelink Family API',
      version: combinedDoc.info?.version ?? '1.0.0',
      description:
        'Family-service HTTP routes (member invites). Synced from CarelinkAuth docs/backend/family/openapi.yaml',
    },
    servers: (combinedDoc.servers ?? []).filter((s) => String(s.url).includes('/v1')),
    tags: inviteTags.length ? inviteTags : [{ name: 'invites', description: 'Member invites' }],
    paths,
    components,
  };
}

export function authDocWithSessionRebuild(mainAuthDoc, combinedDoc) {
  const rebuildPath = combinedDoc.paths?.['/auth/session/rebuild'];
  if (!rebuildPath) return mainAuthDoc;
  const doc = structuredClone(mainAuthDoc);
  doc.paths = { ...doc.paths, '/auth/session/rebuild': structuredClone(rebuildPath) };
  const refs = collectComponentRefs(rebuildPath);
  for (const ref of refs) {
    const [section, name] = ref.split('/');
    if (!doc.components) doc.components = {};
    if (!doc.components[section]) doc.components[section] = {};
    if (!doc.components[section][name] && combinedDoc.components?.[section]?.[name]) {
      doc.components[section][name] = structuredClone(combinedDoc.components[section][name]);
    }
  }
  return doc;
}

export function parseYaml(text) {
  return parse(text);
}

export function dumpYaml(doc) {
  return `${stringify(doc, { lineWidth: 0 })}\n`;
}
