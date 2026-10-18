import { themes } from "./sample-data.js";

let extractor;
export async function analyze(reviews, onProgress = () => {}) {
  onProgress("Loading the review model. The first download may take a minute.");
  if (!extractor) {
    const { pipeline, env } = await import(
      "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2"
    );
    env.allowLocalModels = false;
    extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
      { dtype: "q8", device: "wasm" },
    );
  }
  const vectors = [];
  for (let i = 0; i < reviews.length; i += 16) {
    onProgress(
      `Analyzing ${Math.min(i + 16, reviews.length)} of ${reviews.length} reviews…`,
    );
    const result = await extractor(
      reviews.slice(i, i + 16).map((r) => r.text),
      { pooling: "mean", normalize: true },
    );
    vectors.push(...result.tolist());
  }
  const promptVectors = (
    await extractor(
      [
        "Customers complain about long waiting times and slow service.",
        "Customers complain about cold food and lukewarm drinks.",
        "Customers complain about dirty tables and poor cleanliness.",
        "Customers complain about rude staff and unfriendly service.",
        "Customers complain about expensive prices and small portions.",
        "Customers complain about noise and uncomfortable seating.",
      ],
      { pooling: "mean", normalize: true },
    )
  ).tolist();
  const buckets = themes.map(() => []);
  const rest = [];
  vectors.forEach((v, i) => {
    const scores = promptVectors.map((p) =>
      p.reduce((s, n, j) => s + n * v[j], 0),
    );
    const best = scores.indexOf(Math.max(...scores));
    if (
      scores[best] > 0.28 &&
      (reviews[i].rating === null || reviews[i].rating < 4)
    )
      buckets[best].push(i);
    else if (reviews[i].rating === null || reviews[i].rating < 4) rest.push(i);
  });
  const groups = buckets
    .map((indices, i) => ({
      ...themes[i],
      id: "pattern-" + Date.now() + "-" + i,
      indices,
    }))
    .filter((g) => g.indices.length >= 2);
  const clusters = [];
  for (const i of rest) {
    const cluster = clusters.find(
      (c) => vectors[c[0]].reduce((s, n, j) => s + n * vectors[i][j], 0) > 0.55,
    );
    if (cluster) cluster.push(i);
    else clusters.push([i]);
  }
  for (const indices of clusters.filter((c) => c.length >= 2)) {
    const words = reviews[indices[0]].text
      .replace(/[^a-zA-Z ]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 4)
      .slice(0, 4)
      .join(" ");
    groups.push({
      id: "pattern-" + Date.now() + "-" + indices[0],
      name: "Take a closer look: " + (words || "shared customer feedback"),
      short: "Review a recurring customer concern",
      action:
        "Read these related reviews together. Agree on one specific improvement with your team, then check the next round of feedback.",
      priority: "Medium",
      indices,
    });
  }
  return groups
    .map((g) => ({
      ...g,
      priority: g.indices.length / reviews.length >= 0.2 ? "High" : "Medium",
    }))
    .sort((a, b) => b.indices.length - a.indices.length);
}
