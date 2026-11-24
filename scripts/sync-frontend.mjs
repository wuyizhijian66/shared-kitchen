#!/usr/bin/env node
/**
 * 把仓库根目录的前端（index.html / css / js / images）同步到
 * backend/src/main/resources/static/，保证「打包进 jar 的前端」始终等于根目录版本。
 *
 * 以前这两份是手工复制出来的副本，改一边忘一边就会出现「本地打开是新的、
 * java -jar 跑出来还是旧的」。
 *
 *   node scripts/sync-frontend.mjs           # 根目录 -> static
 *   node scripts/sync-frontend.mjs --check   # 只比较，不同则以退出码 1 结束（可用于 CI）
 */
import { mkdir, readFile, readdir, writeFile, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "backend", "src", "main", "resources", "static");
const ENTRIES = ["index.html", "css", "js", "images"];
const SKIP = new Set(["node_modules", ".git"]);

const checkOnly = process.argv.includes("--check");
let changed = 0;
let same = 0;

async function walk(dir, relBase, out) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
        if (SKIP.has(e.name)) continue;
        const abs = path.join(dir, e.name);
        const rel = relBase ? relBase + "/" + e.name : e.name;
        if (e.isDirectory()) await walk(abs, rel, out);
        else out.push({ abs, rel });
    }
    return out;
}

async function syncFile(abs, rel) {
    const dest = path.join(target, rel);
    await mkdir(path.dirname(dest), { recursive: true });
    await copyFile(abs, dest);
}

async function run() {
    const files = [];
    for (const entry of ENTRIES) {
        const abs = path.join(root, entry);
        if (!existsSync(abs)) {
            console.warn("[skip] 缺少 " + entry);
            continue;
        }
        const st = await import("node:fs/promises").then(m => m.stat(abs));
        if (st.isDirectory()) await walk(abs, entry, files);
        else files.push({ abs, rel: entry });
    }

    for (const f of files) {
        const dest = path.join(target, f.rel);
        let identical = false;
        if (existsSync(dest)) {
            const [a, b] = await Promise.all([readFile(f.abs), readFile(dest)]);
            identical = a.equals(b);
        }
        if (identical) { same++; continue; }
        changed++;
        console.log((checkOnly ? "[diff] " : "[sync] ") + f.rel);
        if (!checkOnly) await syncFile(f.abs, f.rel);
    }

    console.log("---");
    console.log("已同步 " + changed + " 个文件，未变化 " + same + " 个");
    if (checkOnly && changed > 0) {
        console.error("根目录与 backend/src/main/resources/static 不一致，请运行: node scripts/sync-frontend.mjs");
        process.exit(1);
    }
}

run().catch(e => { console.error(e); process.exit(1); });
