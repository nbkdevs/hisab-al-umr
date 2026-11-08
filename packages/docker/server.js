"use strict";

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const age = require(process.env.AGE_LIB || path.join(__dirname, "../npm/lib/index.js"));

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

function hijriParts(part) {
  const [year, month, day] = part.hijri.split("-").map(Number);
  return {
    year,
    month,
    day,
    monthNameEn: part.hijriMonthEn,
    monthNameAr: part.hijriMonthAr,
  };
}

function toAgeBody(result) {
  return {
    ok: true,
    birth: result.birth.gregorian,
    asOf: result.asOf.gregorian,
    anniversaryRule: "overflow-to-next-month",
    years: result.gregorianAge.years,
    months: result.gregorianAge.months,
    days: result.gregorianAge.days,
    totalDays: result.totalDays,
    weeks: Math.floor(result.totalDays / 7),
    extraDays: result.totalDays % 7,
    birthWeekday: result.birth.weekday,
    asOfWeekday: result.asOf.weekday,
    nextAnniversary: result.nextGregorianBirthday.date,
    daysUntilAnniversary: result.nextGregorianBirthday.daysUntil,
    leapDayBirth: result.leapDayBirth,
    hijri: {
      system: "tabular-civil",
      limitationEn: result.limitationEn,
      limitationAr: result.limitationAr,
      birth: hijriParts(result.birth),
      asOf: hijriParts(result.asOf),
      age: result.hijriAge,
      nextAnniversary: {
        hijri: result.nextHijriBirthday.hijri,
        gregorian: result.nextHijriBirthday.gregorian,
        monthNameEn: result.nextHijriBirthday.hijriMonthEn,
        monthNameAr: result.nextHijriBirthday.hijriMonthAr,
        daysUntil: result.nextHijriBirthday.daysUntil,
      },
    },
  };
}

function fail(error) {
  return { status: 400, body: { ok: false, error: error.code, field: error.field } };
}

function calculate(birth, asOf, birthCalendar, asOfCalendar) {
  try {
    return { status: 200, body: toAgeBody(age.calculateAge(birth, birthCalendar || "gregorian", asOf, asOfCalendar || "gregorian")) };
  } catch (error) {
    if (error instanceof age.AgeError) return fail(error);
    throw error;
  }
}

function routeApi(pathname, body) {
  if (pathname === "/api/v1/age") return calculate(body.birth, body.asOf, body.birthCalendar, body.asOfCalendar);
  if (pathname === "/api/v1/age-on") return calculate(body.birth, body.on, body.birthCalendar, "gregorian");
  if (pathname === "/api/v1/difference") {
    const result = calculate(body.start, body.end, body.startCalendar || "gregorian", body.endCalendar || "gregorian");
    if (!result.body.ok) {
      const field = result.body.field === "birth" ? "start" : result.body.field === "asOf" ? "end" : result.body.field;
      return { status: result.status, body: { ...result.body, field } };
    }
    return {
      status: 200,
      body: {
        ok: true,
        start: result.body.birth,
        end: result.body.asOf,
        anniversaryRule: result.body.anniversaryRule,
        years: result.body.years,
        months: result.body.months,
        days: result.body.days,
        totalDays: result.body.totalDays,
        weeks: result.body.weeks,
        extraDays: result.body.extraDays,
        hijri: result.body.hijri,
      },
    };
  }
  if (pathname === "/api/v1/countdown") {
    const result = calculate(body.birth, body.asOf, body.birthCalendar, body.asOfCalendar);
    if (!result.body.ok) return result;
    return {
      status: 200,
      body: {
        ok: true,
        birth: result.body.birth,
        asOf: result.body.asOf,
        nextAnniversary: result.body.nextAnniversary,
        days: result.body.daysUntilAnniversary,
        weekday: age.weekdayFromJdn(age.gregorianToJdn(...result.body.nextAnniversary.split("-").map(Number))),
        isToday: result.body.daysUntilAnniversary === 0,
      },
    };
  }
  if (pathname === "/api/v1/hijri") {
    try {
      const date = age.calculateAge(body.date, "gregorian", body.date, "gregorian").birth;
      return {
        status: 200,
        body: {
          ok: true,
          system: "tabular-civil",
          limitationEn: age.LIMITATION_EN,
          limitationAr: age.LIMITATION_AR,
          hijri: hijriParts(date),
          reason: null,
        },
      };
    } catch (error) {
      if (error instanceof age.AgeError && error.code === "before-hijri-epoch") {
        return {
          status: 200,
          body: {
            ok: true,
            system: "tabular-civil",
            limitationEn: age.LIMITATION_EN,
            limitationAr: age.LIMITATION_AR,
            hijri: null,
            reason: "before-hijri-epoch",
          },
        };
      }
      if (error instanceof age.AgeError) return fail(error);
      throw error;
    }
  }
  return { status: 404, body: { ok: false, error: "not-found" } };
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
  });
  res.end(payload);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 4096) {
        reject(new Error("too-large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        const value = JSON.parse(raw);
        resolve(value && typeof value === "object" && !Array.isArray(value) ? value : null);
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function textField(body, key) {
  const value = body[key];
  return typeof value === "string" ? value : "";
}

function startServer(options = {}) {
  const port = options.port ?? Number(process.env.PORT ?? 8787);
  const host = options.host ?? "127.0.0.1";
  const root = path.resolve(options.staticDir || process.env.STATIC_DIR || path.join(__dirname, "../hf-space"));
  const server = http.createServer((req, res) => {
    const pathname = (req.url || "/").split("?")[0] || "/";
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "content-type",
      });
      res.end();
      return;
    }
    if (pathname === "/api/health" && req.method === "GET") {
      sendJson(res, 200, { ok: true, service: "hisab-age-calculator" });
      return;
    }
    if (pathname === "/api/v1" && req.method === "GET") {
      sendJson(res, 200, {
        ok: true,
        hijriSystem: "tabular-civil",
        anniversaryRule: "overflow-to-next-month",
        limitationEn: age.LIMITATION_EN,
        routes: ["/api/v1/age", "/api/v1/difference", "/api/v1/countdown", "/api/v1/age-on", "/api/v1/hijri"],
      });
      return;
    }
    if (pathname.startsWith("/api/") && req.method === "POST") {
      readJson(req).then((body) => {
        if (!body) {
          sendJson(res, 400, { ok: false, error: "invalid-json" });
          return;
        }
        const normalized = {};
        for (const key of Object.keys(body)) normalized[key] = textField(body, key);
        const result = routeApi(pathname, normalized);
        sendJson(res, result.status, result.body);
      }).catch(() => {
        sendJson(res, 400, { ok: false, error: "invalid-json" });
      });
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      sendJson(res, 405, { ok: false, error: "method-not-allowed" });
      return;
    }
    const requested = pathname === "/" ? "/index.html" : pathname;
    const file = path.normalize(path.join(root, requested));
    const rooted = root.endsWith(path.sep) ? root : root + path.sep;
    if ((!file.startsWith(rooted) && file !== root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      sendJson(res, 404, { ok: false, error: "not-found" });
      return;
    }
    if (req.method === "HEAD") {
      res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
      res.end();
      return;
    }
    res.writeHead(200, {
      "content-type": TYPES[path.extname(file)] || "application/octet-stream",
      "content-length": fs.statSync(file).size,
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
    });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      const address = server.address();
      resolve({
        port: typeof address === "object" && address ? address.port : port,
        close: () => new Promise((done, fail) => server.close((error) => (error ? fail(error) : done()))),
      });
    });
  });
}

module.exports = { startServer, routeApi };

if (require.main === module) {
  const host = "0.0.0.0";
  startServer({ port: Number(process.env.PORT ?? 8787), host }).then((server) => {
    console.log(`hisab-age-calculator listening ${server.port}`);
  });
}
