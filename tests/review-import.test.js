import assert from "node:assert/strict";
import { test } from "node:test";
import { csvRows, parse } from "../dist/review-import.js";

test("CSV keeps quoted commas, newlines, escaped quotes and ratings", () => {
  const input =
    '\uFEFFreview,rating\r\n"Good, but slow",3\r\n"Cold\nfood",2\r\n"He said ""wait""",1';
  assert.deepEqual(parse(input, true), [
    { text: "Good, but slow", rating: 3 },
    { text: "Cold\nfood", rating: 2 },
    { text: 'He said "wait"', rating: 1 },
  ]);
});

test("missing and invalid ratings remain unrated", () => {
  const records = parse(
    "text,rating\nFirst,\nSecond,6\nThird,no\nFourth,4.5",
    true,
  );
  assert.deepEqual(
    records.map((record) => record.rating),
    [null, null, null, 4.5],
  );
});

test("unclosed quotes and missing review columns are rejected", () => {
  assert.throws(() => csvRows('"unfinished'), /unclosed quote/);
  assert.throws(() => parse("title,rating\nHello,2", true), /column named/);
});

test("plain text ignores blank lines and keeps review order", () => {
  assert.deepEqual(parse(" First review \r\n\r\nSecond review\n", false), [
    { text: "First review", rating: null },
    { text: "Second review", rating: null },
  ]);
});
