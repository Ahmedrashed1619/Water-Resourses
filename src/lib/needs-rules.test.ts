import assert from "node:assert/strict";
import { test } from "node:test";
import {
  collectNeedRequestWarnings,
  fiscalYearOf,
  isLastMonthOfFiscalYear,
  warnPublicationToTechnicalGap,
  warnTechnicalOpeningPostponement,
} from "./needs-rules";

test("fiscal year spans July to June", () => {
  assert.equal(fiscalYearOf("2026-08-01").label, "2026/2027");
  assert.equal(fiscalYearOf("2026-06-15").label, "2025/2026");
  assert.equal(isLastMonthOfFiscalYear("2026-06-01"), true);
  assert.equal(isLastMonthOfFiscalYear("2026-05-31"), false);
});

test("need request soft warnings", () => {
  const warnings = collectNeedRequestWarnings({ desiredStartIso: "2026-06-10", hasSimilarInSameFy: true });
  assert.equal(warnings.length, 2);
  assert.ok(warnings.some((item) => item.code === "FY_LAST_MONTH"));
  assert.ok(warnings.some((item) => item.code === "SIMILAR_REQUEST"));
});

test("publication to technical gap warning", () => {
  const warn = warnPublicationToTechnicalGap("2026-10-01", "2026-10-15");
  assert.ok(warn);
  assert.equal(warnPublicationToTechnicalGap("2026-10-01", "2026-10-25"), null);
});

test("technical opening postponement half-period", () => {
  assert.ok(warnTechnicalOpeningPostponement(30, 10));
  assert.equal(warnTechnicalOpeningPostponement(30, 15), null);
});
