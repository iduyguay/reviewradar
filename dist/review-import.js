export function csvRows(text) {
  const rows = [];
  let row = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted)
    throw Error("The CSV contains an unclosed quote. Please check the file.");
  row.push(cell);
  if (row.some((v) => v.trim())) rows.push(row);
  return rows;
}
export function parse(text, csv) {
  if (!csv)
    return text
      .split(/\r?\n/)
      .map((s) => ({ text: s.trim(), rating: null }))
      .filter((r) => r.text);
  const rows = csvRows(text.replace(/^\uFEFF/, ""));
  if (!rows.length) return [];
  const cols = rows[0].map((v) => v.trim().toLowerCase());
  const ti = cols.findIndex((v) =>
    ["review", "text", "comment", "content", "review_text"].includes(v),
  );
  if (ti < 0) throw Error("Add a column named review or text to your CSV.");
  const ri = cols.findIndex((v) => ["rating", "stars", "score"].includes(v));
  return rows
    .slice(1)
    .map((r) => ({
      text: (r[ti] || "").trim(),
      rating:
        ri >= 0 && Number(r[ri]) >= 1 && Number(r[ri]) <= 5
          ? Number(r[ri])
          : null,
    }))
    .filter((r) => r.text);
}
