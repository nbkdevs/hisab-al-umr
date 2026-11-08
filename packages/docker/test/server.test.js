"use strict";

const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const { startServer } = require("../server.js");

function request(port, method, pathname, body) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : JSON.stringify(body);
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path: pathname,
        method,
        headers: payload
          ? { "content-type": "application/json", "content-length": Buffer.byteLength(payload) }
          : {},
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          const type = res.headers["content-type"] || "";
          const parsed = type.includes("json") && raw ? JSON.parse(raw) : raw;
          resolve({ status: res.statusCode, body: parsed, type });
        });
      },
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

test("age API matches the published route and the civil calendar", async () => {
  const server = await startServer({ port: 0 });
  try {
    const health = await request(server.port, "GET", "/api/health");
    assert.equal(health.status, 200);
    assert.equal(health.body.service, "hisab-age-calculator");

    const age = await request(server.port, "POST", "/api/v1/age", {
      birth: "1990-05-15",
      asOf: "2026-11-08",
    });
    assert.equal(age.status, 200);
    assert.equal(age.body.ok, true);
    assert.equal(age.body.years, 36);
    assert.equal(age.body.months, 5);
    assert.equal(age.body.days, 24);
    assert.equal(age.body.totalDays, 13326);
    assert.equal(age.body.hijri.system, "tabular-civil");
    assert.equal(age.body.hijri.birth.year, 1410);
    assert.equal(age.body.hijri.birth.month, 10);
    assert.equal(age.body.hijri.birth.day, 19);
    assert.match(age.body.hijri.limitationEn, /±1/);
    assert.equal(age.body.anniversaryRule, "overflow-to-next-month");

    const leap = await request(server.port, "POST", "/api/v1/age", {
      birth: "2000-02-29",
      asOf: "2023-03-01",
    });
    assert.equal(leap.body.years, 23);
    assert.equal(leap.body.months, 0);
    assert.equal(leap.body.days, 0);
    assert.equal(leap.body.nextAnniversary, "2023-03-01");

    const ramadan = await request(server.port, "POST", "/api/v1/hijri", { date: "1999-12-09" });
    assert.equal(ramadan.body.hijri.year, 1420);
    assert.equal(ramadan.body.hijri.month, 9);
    assert.equal(ramadan.body.hijri.day, 1);

    const page = await request(server.port, "GET", "/");
    assert.equal(page.status, 200);
    assert.match(page.type, /text\/html/);
    assert.match(page.body, /حساب العمر بالهجري والميلادي/);
    assert.match(page.body, /https:\/\/hisabaleumr\.com\//);

    const bad = await request(server.port, "POST", "/api/v1/age", { birth: "nope", asOf: "2026-11-08" });
    assert.equal(bad.status, 400);
    assert.equal(bad.body.ok, false);
  } finally {
    await server.close();
  }
});
