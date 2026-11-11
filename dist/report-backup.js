const MAX_BACKUP_SIZE = 5 * 1024 * 1024;
const VALID_PRIORITIES = new Set(["High", "Medium", "Low"]);

export function serializeBackup(data, exportedAt = new Date().toISOString()) {
  return JSON.stringify(
    {
      format: "reviewradar-backup",
      version: 1,
      exportedAt,
      data,
    },
    null,
    2,
  );
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function invalid(message) {
  throw new Error(`Invalid ReviewRadar backup: ${message}`);
}

function normalizeGroup(group, reviewCount, isTask = false) {
  if (
    !isRecord(group) ||
    typeof group.id !== "string" ||
    typeof group.name !== "string" ||
    typeof group.short !== "string" ||
    typeof group.action !== "string" ||
    !VALID_PRIORITIES.has(group.priority) ||
    !Array.isArray(group.indices) ||
    group.indices.length === 0 ||
    !group.indices.every(
      (index) =>
        Number.isInteger(index) && index >= 0 && index < reviewCount,
    ) ||
    (isTask && typeof group.done !== "boolean")
  ) {
    invalid("a pattern or action is malformed");
  }

  return {
    id: group.id,
    name: group.name,
    short: group.short,
    action: group.action,
    priority: group.priority,
    indices: [...group.indices],
    ...(isTask ? { done: group.done } : {}),
  };
}

export function parseBackup(contents) {
  if (typeof contents !== "string" || contents.length > MAX_BACKUP_SIZE) {
    invalid("file is too large");
  }

  let backup;
  try {
    backup = JSON.parse(contents);
  } catch {
    invalid("file is not valid JSON");
  }

  if (
    !isRecord(backup) ||
    backup.format !== "reviewradar-backup" ||
    backup.version !== 1 ||
    !isRecord(backup.data)
  ) {
    invalid("unsupported file format or version");
  }

  const data = backup.data;
  if (
    typeof data.business !== "string" ||
    data.business.trim().length === 0 ||
    data.business.length > 60 ||
    typeof data.demo !== "boolean" ||
    !Array.isArray(data.reviews) ||
    data.reviews.length < 2 ||
    data.reviews.length > 500 ||
    !Array.isArray(data.groups) ||
    !Array.isArray(data.tasks)
  ) {
    invalid("workspace data is incomplete");
  }

  const reviews = data.reviews.map((review, index) => {
    if (
      !isRecord(review) ||
      typeof review.text !== "string" ||
      review.text.trim().length === 0 ||
      review.text.length > 5000 ||
      !(
        review.rating === null ||
        (typeof review.rating === "number" &&
          Number.isFinite(review.rating) &&
          review.rating >= 1 &&
          review.rating <= 5)
      )
    ) {
      invalid(`review ${index + 1} is malformed`);
    }

    return { id: index, text: review.text, rating: review.rating };
  });

  return {
    business: data.business,
    demo: data.demo,
    reviews,
    groups: data.groups.map((group) =>
      normalizeGroup(group, reviews.length),
    ),
    tasks: data.tasks.map((task) =>
      normalizeGroup(task, reviews.length, true),
    ),
  };
}
