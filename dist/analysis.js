import { themes } from "./sample-data.js";

let extractor;

export function groupReviews(reviews, vectors, promptVectors, now = Date.now()) {
  const buckets = themes.map(() => []);
  const rest = [];

  vectors.forEach((vector, index) => {
    const scores = promptVectors.map((prompt) =>
      prompt.reduce((sum, value, dimension) => sum + value * vector[dimension], 0),
    );
    const best = scores.indexOf(Math.max(...scores));
    const isConcern = reviews[index].rating === null || reviews[index].rating < 4;

    if (scores[best] > 0.28 && isConcern) buckets[best].push(index);
    else if (isConcern) rest.push(index);
  });

  const groups = buckets
    .map((indices, index) => ({
      ...themes[index],
      id: `pattern-${now}-${index}`,
      indices,
    }))
    .filter((group) => group.indices.length >= 2);

  const clusters = [];
  for (const index of rest) {
    const cluster = clusters.find(
      (candidate) =>
        vectors[candidate[0]].reduce(
          (sum, value, dimension) => sum + value * vectors[index][dimension],
          0,
        ) > 0.55,
    );
    if (cluster) cluster.push(index);
    else clusters.push([index]);
  }

  for (const indices of clusters.filter((cluster) => cluster.length >= 2)) {
    const words = reviews[indices[0]].text
      .replace(/[^a-zA-Z ]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 4)
      .slice(0, 4)
      .join(" ");
    groups.push({
      id: `pattern-${now}-${indices[0]}`,
      name: "Take a closer look: " + (words || "shared customer feedback"),
      short: "Review a recurring customer concern",
      action:
        "Read these related reviews together. Agree on one specific improvement with your team, then check the next round of feedback.",
      priority: "Medium",
      indices,
    });
  }

  return groups
    .map((group) => ({
      ...group,
      priority: group.indices.length / reviews.length >= 0.2 ? "High" : "Medium",
    }))
    .sort((a, b) => b.indices.length - a.indices.length);
}

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
      reviews.slice(i, i + 16).map((review) => review.text),
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

  return groupReviews(reviews, vectors, promptVectors);
}
