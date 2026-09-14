// Backward-compatible entrypoint for older local package.json files.
// Use the full-stack Vite development server even when this file is invoked directly.
process.env.NODE_ENV = "development";

export {};
void import("./_core/index");
