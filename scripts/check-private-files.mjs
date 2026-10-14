import { execFileSync } from "node:child_process";

// Read staged Git blobs so forced additions cannot bypass .gitignore unnoticed.
const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const findings = [];
const secretPatterns = [
  /sb_secret_[A-Za-z0-9_-]{16,}/,
  /\b(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}/,
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}/,
  /\bAKIA[A-Z0-9]{16}\b/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];
for (const file of files) {
  const name = file.split("/").at(-1);
  const template = name === ".env.example";
  if ((!template && (name.startsWith(".env") || name.endsWith(".env"))) || /(?:^|\/)(?:secrets|\.next|\.vercel|node_modules|backups|\.temp|\.branches)(?:\/|$)/.test(file) || /(?:\.(?:pem|key|p12|pfx|dump|backup)|credentials\.json|service-account[^/]*\.json)$/.test(file)) {
    findings.push(`${file}: private/generated file must not be committed`);
    continue;
  }
  if (!template && !/\.(?:ts|tsx|js|mjs|json|md|sql|svg|css)$/.test(file)) continue;
  const contents = execFileSync("git", ["show", `:${file}`], { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 });
  if (template && contents.split(/\r?\n/).some(line => line.trim() && !line.trim().startsWith("#") && !/^[A-Z0-9_]+=\s*$/.test(line))) findings.push(`${file}: environment template must contain empty values`);
  if (secretPatterns.some(pattern => pattern.test(contents))) findings.push(`${file}: possible secret detected (value withheld)`);
}
if (findings.length) {
  console.error(findings.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Staged privacy check passed across ${files.length} files; no environment values, private credentials, or recognized secret patterns found.`);
}
