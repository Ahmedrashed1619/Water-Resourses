import assert from "node:assert/strict";
import { test } from "node:test";
import {
  defaultDerivedStatusFilter,
  deriveOperationDepartmentStatus,
  matchesStatusFilter,
  statusFilterOptionsForRole,
} from "./operation-status";

test("not started when no stage has begun", () => {
  const status = deriveOperationDepartmentStatus(
    [{ plannedStart: "2026-10-01", plannedDue: "2026-11-01", actualStart: null, completedAt: null }],
    "2026-10-15",
  );
  assert.equal(status, "NOT_STARTED");
});

test("late when a stage is past planned due and open", () => {
  const status = deriveOperationDepartmentStatus(
    [
      {
        plannedStart: "2026-09-01",
        plannedDue: "2026-09-30",
        actualStart: "2026-09-01",
        completedAt: null,
      },
    ],
    "2026-10-15",
  );
  assert.equal(status, "LATE");
});

test("completed on time vs late", () => {
  const onTime = deriveOperationDepartmentStatus(
    [
      {
        plannedStart: "2026-09-01",
        plannedDue: "2026-09-30",
        actualStart: "2026-09-01",
        completedAt: "2026-09-28",
      },
    ],
    "2026-10-15",
  );
  assert.equal(onTime, "COMPLETED_ON_TIME");
  const late = deriveOperationDepartmentStatus(
    [
      {
        plannedStart: "2026-09-01",
        plannedDue: "2026-09-30",
        actualStart: "2026-09-01",
        completedAt: "2026-10-05",
      },
    ],
    "2026-10-15",
  );
  assert.equal(late, "COMPLETED_LATE");
});

test("in progress when started and not late", () => {
  const status = deriveOperationDepartmentStatus(
    [
      {
        plannedStart: "2026-10-01",
        plannedDue: "2026-12-01",
        actualStart: "2026-10-05",
        completedAt: null,
      },
    ],
    "2026-10-15",
  );
  assert.equal(status, "IN_PROGRESS");
});

test("SSA status options and finished filter", () => {
  const opts = statusFilterOptionsForRole("SECTOR_SUPER_ADMIN");
  assert.ok(opts.some((item) => item.value === "FINISHED"));
  assert.equal(matchesStatusFilter("COMPLETED_LATE", "FINISHED"), true);
  assert.deepEqual(defaultDerivedStatusFilter("SECTOR_SUPER_ADMIN"), ["LATE", "IN_PROGRESS"]);
});

test("SA/SE status options include not started", () => {
  const opts = statusFilterOptionsForRole("SECTOR_EMPLOYEE");
  assert.ok(opts.some((item) => item.value === "NOT_STARTED"));
  assert.ok(opts.some((item) => item.value === "COMPLETED_ON_TIME"));
});
