import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import test from "node:test";

test("private environment, credential, and generated files are excluded from Git", () => {
  for (const path of ["frontend/.env.local", "api/.env.production", "backend/config.env", "private.key", "credentials.json", "service-account-prod.json", "database/backups/private.sql", "database/supabase/.temp/pooler-url", "frontend/.next/server/app/page.js", "frontend/next-env.d.ts"]) {
    assert.equal(execFileSync("git", ["check-ignore", "--no-index", path], { encoding: "utf8" }).trim(), path);
  }
});

test("the committed environment template contains names without credentials", () => {
  const template = readFileSync("frontend/.env.example", "utf8");
  const values = template.split(/\r?\n/).filter(line => line.trim() && !line.trim().startsWith("#"));
  assert.deepEqual(values, ["SUPABASE_URL=", "SUPABASE_PUBLISHABLE_KEY=", "SUPABASE_SECRET_KEY=", "SUPABASE_JWKS_URL="]);
});

test("CMS write actions authenticate before database or storage operations", () => {
  const require = createRequire(import.meta.url);
  const ts = require("typescript");
  const source = readFileSync("api/actions/admin.ts", "utf8") + "\n" + readFileSync("api/actions/editorial.ts", "utf8");
  assert.ok(source.startsWith('"use server";'));
  const ast = ts.createSourceFile("admin.ts", source, ts.ScriptTarget.Latest, true);
  const functions = ast.statements.filter(node => ts.isFunctionDeclaration(node) && node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword));
  assert.ok(functions.length >= 15);
  for (const fn of functions) {
    if (fn.name.text === "signOut") continue; // Only signs out the caller's own session.
    const statements = fn.body.statements.map(statement => statement.getText(ast));
    const guard = statements.findIndex(statement => statement.includes("await requireAdmin()"));
    assert.ok(guard >= 0, `${fn.name.text} is missing its administrator check`);
    assert.ok(statements.slice(0, guard).every(statement => !/supabase\.(from|rpc|storage)/.test(statement)), `${fn.name.text} queries privileged data before authorization`);
  }
});

test("credentials and server implementation files are outside served public assets", () => {
  function files(dir) { return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(join(dir, entry.name)) : [entry.name]); }
  assert.ok(files("frontend/public").every(name => /\.(png|jpg|jpeg|svg|webp|ico)$/i.test(name)));
  for (const path of ["backend/cms/data.ts", "backend/cms/media.ts", "backend/supabase/server.ts", "backend/supabase/auth.ts"]) {
    assert.match(readFileSync(path, "utf8"), /^import "server-only";/);
  }
});
