"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const zipfile = require("node:zlib");

const root = path.join(__dirname, "..");
const edgeAge = require(path.join(root, "js/age.js"));
const library = require(path.join(root, "../../packages/npm/lib/index.js"));

test("known age vector matches the library", () => {
  const edge = edgeAge.calculateAge("1990-05-15", "gregorian", "2026-11-08");
  const lib = library.calculateAge("1990-05-15", "gregorian", "2026-11-08");
  assert.deepEqual(edge.gregorianAge, { years: 36, months: 5, days: 24 });
  assert.equal(edge.totalDays, 13326);
  assert.deepEqual(edge.gregorianAge, lib.gregorianAge);
  assert.deepEqual(edge.hijriAge, lib.hijriAge);
  assert.equal(edge.totalDays, lib.totalDays);
  assert.equal(edge.nextGregorianBirthday.date, lib.nextGregorianBirthday.date);
  assert.equal(edge.nextHijriBirthday.hijri, lib.nextHijriBirthday.hijri);
  assert.match(edge.limitationEn, /±1/);
  assert.match(edge.limitationEn, /Umm al-Qura/);
  assert.equal(edge.homepage, "");
});

test("29 February is observed on 1 March", () => {
  const turned = edgeAge.calculateAge("2000-02-29", "gregorian", "2023-03-01");
  assert.deepEqual(turned.gregorianAge, { years: 23, months: 0, days: 0 });
  assert.equal(turned.nextGregorianBirthday.date, "2023-03-01");
  assert.equal(turned.nextGregorianBirthday.daysUntil, 0);
  const dayBefore = edgeAge.calculateAge("2000-02-29", "gregorian", "2023-02-28");
  assert.equal(dayBefore.nextGregorianBirthday.date, "2023-03-01");
  assert.equal(dayBefore.nextGregorianBirthday.daysUntil, 1);
});

test("arabic-indic digits and a hijri birth", () => {
  const arabic = edgeAge.calculateAge("١٩٩٠-٠٥-١٥", "gregorian", "٢٠٢٦-١١-٠٨");
  assert.deepEqual(arabic.gregorianAge, { years: 36, months: 5, days: 24 });
  const ramadan = edgeAge.calculateAge("1420-09-01", "hijri", "1999-12-09");
  assert.deepEqual(ramadan.gregorianAge, { years: 0, months: 0, days: 0 });
  assert.equal(ramadan.totalDays, 0);
});

test("manifest and popup do not name a website or ask for permissions", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.name, "Hisab Age Calculator");
  assert.deepEqual(manifest.permissions, []);
  assert.equal(Object.hasOwn(manifest, "homepage_url"), false);
  assert.equal(Object.hasOwn(manifest, "host_permissions"), false);
  assert.ok(manifest.description.length <= 132);
  assert.doesNotMatch(manifest.description, /hisabaleumr|https?:/i);

  const popup = fs.readFileSync(path.join(root, "popup.html"), "utf8");
  const script = fs.readFileSync(path.join(root, "popup.js"), "utf8");
  const style = fs.readFileSync(path.join(root, "popup.css"), "utf8");
  const age = fs.readFileSync(path.join(root, "js/age.js"), "utf8");
  for (const source of [popup, script, style, age, manifest.description, manifest.name]) {
    assert.equal(source.toLowerCase().includes("hisabaleumr"), false);
    assert.equal(/https?:\/\//.test(source), false);
  }
  assert.equal(popup.includes("<a "), false);
  assert.match(popup, /dir="rtl"/);
  assert.match(popup, /lang="ar"/);
});

test("submission zip is the loadable package only", () => {
  const { execFileSync } = require("node:child_process");
  execFileSync("python3", [path.join(root, "pack.py")], { cwd: root });
  const buf = fs.readFileSync(path.join(root, "hisab-age-calculator-edge-1.0.0.zip"));
  const names = listZip(buf).sort();
  assert.deepEqual(names, [
    "icons/icon128.png",
    "icons/icon16.png",
    "icons/icon48.png",
    "js/age.js",
    "manifest.json",
    "popup.css",
    "popup.html",
    "popup.js",
  ]);
  const joined = names.join("\n") + "\n" + readZipText(buf, "manifest.json") + readZipText(buf, "popup.html") + readZipText(buf, "js/age.js");
  assert.equal(joined.toLowerCase().includes("hisabaleumr"), false);
  assert.equal(joined.includes("EDGE_LISTING"), false);
});

function listZip(buf) {
  const files = [];
  let offset = 0;
  while (offset + 30 < buf.length) {
    if (buf.readUInt32LE(offset) !== 0x04034b50) break;
    const compressed = buf.readUInt32LE(offset + 18);
    const nameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const name = buf.subarray(offset + 30, offset + 30 + nameLen).toString("utf8");
    files.push(name);
    offset += 30 + nameLen + extraLen + compressed;
  }
  return files;
}

function readZipText(buf, wanted) {
  let offset = 0;
  while (offset + 30 < buf.length) {
    if (buf.readUInt32LE(offset) !== 0x04034b50) break;
    const method = buf.readUInt16LE(offset + 8);
    const compressed = buf.readUInt32LE(offset + 18);
    const nameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const name = buf.subarray(offset + 30, offset + 30 + nameLen).toString("utf8");
    const start = offset + 30 + nameLen + extraLen;
    const data = buf.subarray(start, start + compressed);
    offset = start + compressed;
    if (name !== wanted) continue;
    if (method === 0) return data.toString("utf8");
    return zipfile.inflateRawSync(data).toString("utf8");
  }
  throw new Error(`missing ${wanted}`);
}
