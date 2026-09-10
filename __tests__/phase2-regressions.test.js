const fs = require("fs");
const path = require("path");
const request = require("supertest");
const { JSDOM } = require("jsdom");

const app = require("../server");
const appSource = fs.readFileSync(path.join(__dirname, "../public/app.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "../public/index.html"), "utf8");

const validCurrent = {
  line1: "12 MG Road",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
};

const validPermanent = {
  line1: "12 MG Road",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
};

function buildPayload(overrides = {}) {
  return {
    candidateId: 300,
    current: validCurrent,
    permanent: validPermanent,
    sameAsPermanent: false,
    ...overrides,
  };
}

function makeDom(fetchImpl = async () => ({ ok: true, json: async () => [] })) {
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "http://localhost" });
  dom.window.fetch = fetchImpl;
  dom.window.eval(appSource);
  return dom;
}

describe("Phase 2 regression tests", () => {
  beforeEach(async () => {
    await request(app).post("/api/reset");
  });

  test("1. Current state dropdown is not pre-selected on load", () => {
    const dom = makeDom();
    expect(dom.window.document.getElementById("current-state").value).toBe("");
  });

  test("2. Invalid pincode starting with 0 shows inline validation immediately", () => {
    const dom = makeDom();
    const input = dom.window.document.getElementById("current-pincode");
    input.value = "012345";
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    expect(dom.window.document.getElementById("current-pincode-error").textContent).toMatch(/invalid|pincode/i);
  });

  test("3. Match percent for 2 of 4 matching fields is 50%", async () => {
    const res = await request(app).post("/api/address").send(
      buildPayload({
        current: { line1: "12 MG Road", city: "Bengaluru", state: "Karnataka", pincode: "560001" },
        permanent: { line1: "12 MG Road", city: "Mumbai", state: "Maharashtra", pincode: "400001" },
      })
    );

    expect(res.status).toBe(200);
    expect(res.body.matchPercent).toBe(50);
  });

  test("4. Missing candidate returns 404", async () => {
    const res = await request(app).get("/api/address/999999");
    expect(res.status).toBe(404);
  });

  test("5. Blank required city is rejected with 400", async () => {
    const res = await request(app).post("/api/address").send(
      buildPayload({ current: { ...validCurrent, city: "   " } })
    );

    expect(res.status).toBe(400);
  });

  test("6. Invalid state value is rejected with 400", async () => {
    const res = await request(app).post("/api/address").send(
      buildPayload({ current: { ...validCurrent, state: "Punjab" } })
    );

    expect(res.status).toBe(400);
  });

  test("7. Match % column includes a percentage symbol", async () => {
    const dom = makeDom(async () => ({
      ok: true,
      json: async () => [{ candidateId: 307, current: {}, permanent: {}, matchPercent: 50, createdAt: "now" }],
    }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(dom.window.document.getElementById("submissions-tbody").textContent).toContain("50%");
  });

  test("8. Successful address submission returns 201 Created", async () => {
    const res = await request(app).post("/api/address").send(buildPayload());
    expect(res.status).toBe(201);
  });

  test("9. Permanent address stays in sync with current while same-as-current is checked", () => {
    const dom = makeDom();
    const document = dom.window.document;
    const checkbox = document.getElementById("same-as-permanent");
    checkbox.checked = true;
    checkbox.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    document.getElementById("current-line1").value = "99 New Street";
    document.getElementById("current-city").value = "Hyderabad";
    document.getElementById("current-state").value = "Telangana";
    document.getElementById("current-pincode").value = "500001";
    document.getElementById("current-line1").dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    document.getElementById("current-city").dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    document.getElementById("current-state").dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    document.getElementById("current-pincode").dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    expect(document.getElementById("permanent-line1").value).toBe("99 New Street");
    expect(document.getElementById("permanent-city").value).toBe("Hyderabad");
    expect(document.getElementById("permanent-state").value).toBe("Telangana");
    expect(document.getElementById("permanent-pincode").value).toBe("500001");
  });

  test("10. Omitted sameAsPermanent defaults to false", async () => {
    const payload = {
      candidateId: 310,
      current: validCurrent,
      permanent: validPermanent,
    };
    const res = await request(app).post("/api/address").send(payload);

    expect(res.body.sameAsPermanent).toBe(false);
  });

  test("11. String fields are trimmed before persistence", async () => {
    const res = await request(app).post("/api/address").send(
      buildPayload({
        current: {
          line1: "  12 MG Road  ",
          city: "  Bengaluru  ",
          state: "  Karnataka  ",
          pincode: "560001",
        },
      })
    );

    expect(res.body.current.line1).toBe("12 MG Road");
    expect(res.body.current.city).toBe("Bengaluru");
    expect(res.body.current.state).toBe("Karnataka");
    expect(res.body.current.pincode).toBe("560001");
  });

  test("12. Perfect match caps at 100% using a 4-field denominator", async () => {
    const res = await request(app).post("/api/address").send(
      buildPayload({
        current: validCurrent,
        permanent: validCurrent,
      })
    );

    expect(res.body.matchPercent).toBe(100);
  });
});
