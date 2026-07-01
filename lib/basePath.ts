// Single source of truth for the app's basePath, shared between next.config.ts
// and any code that needs to reference a public/ asset by absolute path
// (next/image doesn't auto-prefix basePath onto plain string src values).
export const BASE_PATH = '/famgath';
