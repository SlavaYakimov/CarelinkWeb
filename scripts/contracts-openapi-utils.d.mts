export type OpenApiComponents = {
  securitySchemes?: Record<string, unknown>;
  responses?: Record<string, unknown>;
  parameters?: Record<string, unknown>;
  schemas?: Record<string, unknown>;
};

export type OpenApiDocument = {
  openapi: string;
  info: Record<string, unknown>;
  servers?: unknown[];
  tags?: { name: string; description?: string }[];
  paths: Record<string, unknown>;
  components: OpenApiComponents;
};

export function collectComponentRefs(value: unknown, refs?: Set<string>): Set<string>;

export function mergeOpenApiDocuments(
  authDoc: OpenApiDocument,
  familyDoc: OpenApiDocument,
): OpenApiDocument;

export function extractFamilyInviteSpec(combinedDoc: OpenApiDocument): OpenApiDocument;

export function authDocWithSessionRebuild(
  mainAuthDoc: OpenApiDocument,
  combinedDoc: OpenApiDocument,
): OpenApiDocument;

export function parseYaml(text: string): OpenApiDocument;

export function dumpYaml(doc: OpenApiDocument): string;
