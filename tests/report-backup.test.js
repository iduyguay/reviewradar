import assert from "node:assert/strict";
import { test } from "node:test";
import { parseBackup, serializeBackup } from "../dist/report-backup.js";

const workspace = {
  business: "Birch & Bloom",
  demo: false,
  reviews: [
    { id: 0, text: "The queue was slow", rating: 2 },
    { id: 1, text: "Cold coffee at lunch", rating: null },
  ],
  groups: [
    {
      id: "pattern-1",
      name: "Long waits",
      short: "Speed up service",
      action: "Review the lunch queue.",
      priority: "High",
      indices: [0, 1],
    },
  ],
  tasks: [
    {
      id: "pattern-1",
      name: "Long waits",
      short: "Speed up service",
      action: "Review the lunch queue.",
      priority: "High",
      indices: [0, 1],
      done: false,
    },
  ],
};

test("backup round-trips workspace, reviews, patterns and action state", () => {
  const contents = serializeBackup(workspace, "2026-11-11T00:00:00.000Z");

  assert.deepEqual(parseBackup(contents), workspace);
});

test("rejects malformed JSON and unsupported backup versions", () => {
  assert.throws(() => parseBackup("{"), /valid JSON/);
  assert.throws(
    () =>
      parseBackup(
        JSON.stringify({
          format: "reviewradar-backup",
          version: 2,
          data: workspace,
        }),
      ),
    /unsupported file format or version/,
  );
});

test("rejects invalid ratings and references outside the review list", () => {
  const invalidRating = structuredClone(workspace);
  invalidRating.reviews[0].rating = 6;
  assert.throws(
    () => parseBackup(serializeBackup(invalidRating)),
    /review 1 is malformed/,
  );

  const invalidPattern = structuredClone(workspace);
  invalidPattern.groups[0].indices = [0, 2];
  assert.throws(
    () => parseBackup(serializeBackup(invalidPattern)),
    /pattern or action is malformed/,
  );
});

test("rejects backups larger than the import limit", () => {
  assert.throws(
    () => parseBackup("x".repeat(5 * 1024 * 1024 + 1)),
    /file is too large/,
  );
});
