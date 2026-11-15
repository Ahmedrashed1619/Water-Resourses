import assert from "node:assert/strict";
import test from "node:test";
import { addMonths } from "./dates";
import { DEFAULT_STAGES } from "./catalog";
import { computeStageWindows, evaluateAlertTypes } from "./rules";

test("technical approval 08/10/2026 produces the four reference dates", () => {
  const windows = computeStageWindows("2026-10-08", DEFAULT_STAGES);
  const byCode = Object.fromEntries(windows.map((item) => [item.code, item]));
  assert.equal(byCode.PUBLICATION.start, "2026-10-08");
  assert.equal(byCode.PUBLICATION.due, "2026-11-08");
  assert.equal(byCode.TECHNICAL_OPENING.due, "2026-12-08");
  assert.equal(byCode.FINANCIAL_OPENING.due, "2026-12-23");
  assert.equal(byCode.FINANCIAL_AWARD.start, "2026-12-23");
  assert.equal(byCode.FINANCIAL_AWARD.due, "2026-12-30");
});

test("calendar months clamp to the last valid day", () => {
  assert.equal(addMonths("2026-01-31", 1), "2026-02-28");
  assert.equal(addMonths("2024-01-31", 1), "2024-02-29");
});

test("alert rules separate the sector from the department", () => {
  const publication = { start: "2026-10-08", due: "2026-11-08", completed: false };
  assert.deepEqual(evaluateAlertTypes(publication, "2026-11-15"), ["OVERDUE"]);
  assert.deepEqual(evaluateAlertTypes({ ...publication, completed: true }, "2026-11-15"), []);

  const technical = { start: "2026-10-08", due: "2026-12-08", completed: false };
  assert.deepEqual(evaluateAlertTypes(technical, "2026-11-15"), ["HALFWAY"]);

  const financial = { start: "2026-10-08", due: "2026-12-23", completed: false };
  assert.deepEqual(evaluateAlertTypes(financial, "2026-11-15"), ["HALFWAY"]);

  const award = { start: "2026-12-23", due: "2026-12-30", completed: false };
  assert.deepEqual(evaluateAlertTypes(award, "2026-11-15"), []);
  assert.deepEqual(evaluateAlertTypes(award, "2026-12-25"), ["DUE_SOON"]);
  assert.deepEqual(evaluateAlertTypes(award, "2026-12-27"), ["DUE_SOON", "HALFWAY"]);
  assert.deepEqual(evaluateAlertTypes(award, "2026-12-30"), ["DUE_SOON"]);
  assert.deepEqual(evaluateAlertTypes(publication, "2026-10-24"), ["HALFWAY"]);
  assert.deepEqual(evaluateAlertTypes(publication, "2026-11-03"), ["DUE_SOON", "HALFWAY"]);
  assert.deepEqual(evaluateAlertTypes(publication, "2026-11-08"), ["DUE_SOON"]);
});
