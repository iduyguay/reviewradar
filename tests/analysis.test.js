import assert from "node:assert/strict";
import { test } from "node:test";
import { groupReviews } from "../dist/analysis.js";

const prompts = [
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 1, 0],
  [-1, 0, 0, 0],
  [0, -1, 0, 0],
  [0, 0, -1, 0],
];

test("groups repeated low-rated reviews under their closest theme", () => {
  const reviews = [
    { text: "Slow service at lunch", rating: 2 },
    { text: "The queue was slow", rating: 3 },
    { text: "Fast and friendly", rating: 5 },
  ];
  const vectors = [
    [1, 0, 0, 0],
    [0.9, 0.1, 0, 0],
    [1, 0, 0, 0],
  ];

  const groups = groupReviews(reviews, vectors, prompts, 123);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].name, "Long waits at peak hours");
  assert.deepEqual(groups[0].indices, [0, 1]);
  assert.equal(groups[0].priority, "High");
  assert.equal(groups[0].id, "pattern-123-0");
});

test("clusters similar low-rated reviews that do not match a preset theme", () => {
  const reviews = [
    { text: "People complained about uncomfortable wooden chairs", rating: 2 },
    { text: "Uncomfortable chairs made dinner difficult", rating: 3 },
  ];
  const vectors = [
    [0, 0, 0, 1],
    [0, 0, 0, 1],
  ];

  const groups = groupReviews(reviews, vectors, prompts, 456);

  assert.equal(groups.length, 1);
  assert.match(groups[0].name, /^Take a closer look:/);
  assert.deepEqual(groups[0].indices, [0, 1]);
  assert.equal(groups[0].priority, "High");
});

test("does not create groups for positive reviews or a single matching review", () => {
  const reviews = [
    { text: "Excellent service", rating: 5 },
    { text: "Slow service once", rating: 2 },
  ];
  const vectors = [
    [1, 0, 0, 0],
    [1, 0, 0, 0],
  ];

  assert.deepEqual(groupReviews(reviews, vectors, prompts, 789), []);
});
