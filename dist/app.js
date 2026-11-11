import { themes, sampleTexts } from "./sample-data.js";
import { parse } from "./review-import.js";
import { analyze } from "./analysis.js";
import { parseBackup, serializeBackup } from "./report-backup.js";

const html = String.raw;
const countLabel = (count, label) =>
  `${count} ${label}${count === 1 ? "" : "s"}`;

const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let state = {
    reviews: sampleTexts.map(([text, rating], i) => ({ text, rating, id: i })),
    groups: [],
    tasks: [],
    demo: true,
    business: "Birch & Bloom",
  },
  view = "overview",
  query = "";
try {
  const saved = JSON.parse(localStorage.getItem("reviewradar-v1"));
  if (saved?.reviews?.length) state = saved;
} catch {}
function demoGroups() {
  return themes.slice(0, 3).map((t, i) => ({
    ...t,
    id: "demo-" + i,
    indices: state.reviews
      .map((r, j) => (t.terms.test(r.text) ? j : -1))
      .filter((j) => j >= 0),
  }));
}
if (state.demo) state.groups = demoGroups();
const previousNames = [
  "The wait is costing you regulars",
  "Great coffee. Inconsistent temperatures.",
  "Good food deserves a cleaner table",
  "The welcome could be warmer",
  "Make the price feel worthwhile",
  "A few details need attention",
];
for (const group of [...state.groups, ...state.tasks]) {
  const index = previousNames.indexOf(group.name);
  if (index >= 0) group.name = themes[index].name;
}
function save() {
  try {
    localStorage.setItem("reviewradar-v1", JSON.stringify(state));
  } catch {
    toast("Browser storage is full. Export your report to keep a copy.");
  }
}
function toast(s) {
  $("#toast").textContent = s;
  $("#toast").classList.add("show");
  setTimeout(() => $("#toast").classList.remove("show"), 3500);
}
function groupCard(g) {
  const first = state.reviews[g.indices[0]];
  const added = state.tasks.some((t) => t.id === g.id);
  return html`
    <article class="issue">
      <div class="issuebody">
        <div class="issuetop">
          <span
            class="tag ${g.priority === "Medium"
              ? "medium"
              : g.priority === "Low"
                ? "low"
                : ""}"
          >
            <i></i>
            ${g.priority} priority
          </span>
          <span class="mention">
            ${g.indices.length} of ${state.reviews.length} reviews
          </span>
        </div>
        <h3>${esc(g.name)}</h3>
        <div class="evidence">
          <blockquote class="quote">“${esc(first?.text || "")}”</blockquote>
        </div>
        <div class="suggestion">
          <span class="minilabel">Suggested next step</span>
          <p>${esc(g.action)}</p>
        </div>
        <div class="issuebottom">
          <button class="textbtn" data-detail="${esc(g.id)}">
            View ${countLabel(g.indices.length, "review")}
          </button>
          <button class="add ${added ? "added" : ""}" data-add="${esc(g.id)}">
            ${added ? "Added to actions" : "Add to actions"}
          </button>
        </div>
      </div>
    </article>
  `;
}
function render() {
  document
    .querySelectorAll("nav button")
    .forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  $("#breadcrumb").textContent = {
    overview: "Workspace / Report",
    reviews: "Workspace / All reviews",
    actions: "Workspace / Action list",
  }[view];
  $("#inboxcount").textContent = state.reviews.length;
  $("#actioncount").textContent = state.tasks.filter((t) => !t.done).length;
  $(".workspace div").innerHTML =
    `${esc(state.business)}<small>Local workspace</small>`;
  const rated = state.reviews.filter((r) => r.rating),
    avg = rated.length
      ? (rated.reduce((a, r) => a + r.rating, 0) / rated.length).toFixed(1)
      : "—";
  const head = html`
    <div class="pagetitle">
      <div>
        <span class="eyebrow">
          ${state.demo ? "Sample report" : "Customer feedback"}
        </span>
        <h1>
          ${view === "overview"
            ? esc(state.business)
            : view === "reviews"
              ? "Reviews"
              : "Actions"}
        </h1>
        <p>
          ${view === "overview"
            ? `${countLabel(state.reviews.length, "review")} · ${countLabel(state.groups.length, "recurring issue")}`
            : view === "reviews"
              ? "Search the original customer feedback."
              : "Follow up on the issues you have selected."}
        </p>
      </div>
      <button class="primary" data-upload>
        <span>+</span>
        Import reviews
      </button>
    </div>
  `;
  let body = "";
  if (view === "overview") {
    const sentiment = state.reviews.reduce(
      (a, r) => {
        a[
          r.rating >= 4
            ? "positive"
            : r.rating && r.rating < 3
              ? "negative"
              : "mixed"
        ]++;
        return a;
      },
      { positive: 0, mixed: 0, negative: 0 },
    );
    body = html`
      <div class="ribbon">
        <div>
          <span class="samplelabel">${state.demo ? "DEMO" : "REPORT"}</span>
          ${state.demo
            ? "You are viewing sample reviews for a café."
            : "Report based on your latest import."}
        </div>
        <button ${state.demo ? "data-upload" : "data-export"}>
          ${state.demo ? "Import your reviews" : "Export report ↓"}
        </button>
      </div>
      <div class="metrics">
        <div class="metric">
          <label>Reviews</label>
          <strong>${state.reviews.length}</strong>
          <small>${state.demo ? "Demo reviews" : "Current import"}</small>
        </div>
        <div class="metric">
          <label>Average rating</label>
          <strong>
            ${avg}
            <span class="ratingunit">${rated.length ? " / 5" : ""}</span>
          </strong>
          <small>
            ${rated.length
              ? `${rated.length} rated reviews`
              : "No ratings supplied"}
          </small>
        </div>
        <div class="metric">
          <label>Recurring issues</label>
          <strong class="accent">${state.groups.length.toString()}</strong>
          <small>
            ${state.groups.filter((g) => g.priority === "High").length} high
            priority
          </small>
        </div>
        <div class="metric">
          <label>Open actions</label>
          <strong>
            ${state.tasks.filter((t) => !t.done).length.toString()}
          </strong>
          <small>${state.tasks.filter((t) => t.done).length} completed</small>
        </div>
      </div>
      <div class="columns">
        <div>
          <div class="sectionhead">
            <h2>Recurring issues</h2>
            <select id="sort" aria-label="Sort patterns">
              <option value="priority">Priority</option>
              <option value="mentions">Most mentioned</option>
            </select>
          </div>
          <div id="groups">
            ${state.groups.map(groupCard).join("") ||
            '<div class="empty">No repeated issues found. Import more reviews to compare.</div>'}
          </div>
          <p class="footnote">
            Priority reflects how often an issue appears. Check the source
            reviews before acting.
          </p>
        </div>
        <div class="rightcol">
          <div class="breakdown">
            <div class="railhead"><h3>Review distribution</h3></div>
            <div class="ratingbar" aria-hidden="true">
              ${["positive", "mixed", "negative"]
                .map(
                  (key) => html`
                    <span
                      class="${key}"
                      style="width:${(sentiment[key] / state.reviews.length) *
                      100}%"
                    ></span>
                  `,
                )
                .join("")}
            </div>
            <div class="distributionrows">
              ${[
                ["positive", "Positive", "4–5 stars"],
                ["mixed", "Mixed", "3 stars / unrated"],
                ["negative", "Negative", "1–2 stars"],
              ]
                .map(
                  ([k, l, d]) => html`
                    <div class="legend">
                      <span>
                        <i class="${k}"></i>
                        ${l}
                        <small>${d}</small>
                      </span>
                      <b>${sentiment[k]}</b>
                    </div>
                  `,
                )
                .join("")}
            </div>
          </div>
          <div class="actionsummary">
            <span class="minilabel">Actions</span>
            <div class="actioncount">
              ${state.tasks.filter((t) => !t.done).length}
              <span>open</span>
            </div>
            <p>
              ${state.tasks.length
                ? `${state.tasks.filter((t) => t.done).length} completed. Review your list to update progress.`
                : "No actions yet. Choose an issue and add the suggested action to your list."}
            </p>
            <button class="secondary" data-view="actions">View actions</button>
          </div>
          <div class="datasetinfo">
            <span class="minilabel">This report</span>
            <p>
              ${state.demo
                ? "Demonstration report for Birch & Bloom."
                : "Based on your most recent import."}
              Reviews and actions are stored in this browser.
            </p>
            <button class="textbtn" data-export>Download report (.txt)</button>
          </div>
        </div>
      </div>
    `;
  }
  if (view === "reviews")
    body = html`
      <div class="sectionhead">
        <h2>${state.reviews.length} reviews</h2>
        <button class="secondary" data-export>Export report ↓</button>
      </div>
      <input
        class="search"
        id="search"
        placeholder="Search your reviews…"
        aria-label="Search reviews"
        value="${esc(query)}"
      />
      <div id="reviewlist"></div>
    `;
  if (view === "actions")
    body = html`
      <div class="sectionhead">
        <h2>
          ${countLabel(
            state.tasks.filter((t) => !t.done).length,
            "open action",
          )}
        </h2>
        <button class="secondary" data-export>Export report ↓</button>
      </div>
      ${state.tasks.length
        ? state.tasks
            .map(
              (t) => html`
                <article class="task ${t.done ? "done" : ""}">
                  <input
                    type="checkbox"
                    data-task="${esc(t.id)}"
                    ${t.done ? "checked" : ""}
                    aria-label="Complete ${esc(t.short)}"
                  />
                  <div>
                    <h3>${esc(t.short)}</h3>
                    <p>${esc(t.action)}</p>
                    <small>
                      ${t.done ? "Completed" : "Open"} · ${esc(t.priority)}
                      priority
                    </small>
                  </div>
                  <button
                    class="textbtn"
                    data-remove="${esc(t.id)}"
                    aria-label="Remove action"
                  >
                    ×
                  </button>
                </article>
              `,
            )
            .join("")
        : '<div class="empty"><h2>No actions yet.</h2><p>Add a pattern from your overview to start your first action.</p><button class="secondary" data-view="overview">View report →</button></div>'}
    `;
  $("#content").innerHTML = head + body;
  if (view === "reviews") renderReviews();
}
function renderReviews() {
  const matches = state.reviews.filter((r) =>
    r.text.toLowerCase().includes(query.toLowerCase()),
  );
  $("#reviewlist").innerHTML =
    matches
      .map(
        (r) => html`
          <article class="reviewrow">
            <div class="stars">
              ${r.rating
                ? "★".repeat(Math.round(r.rating)) +
                  "☆".repeat(5 - Math.round(r.rating))
                : "No rating supplied"}
              <span style="color:var(--muted)">· Review ${r.id + 1}</span>
            </div>
            <p>${esc(r.text)}</p>
          </article>
        `,
      )
      .join("") || '<div class="empty">No reviews match your search.</div>';
}
function exportReport() {
  const lines = [
    state.business + " — ReviewRadar report",
    `${state.reviews.length} reviews · ${state.groups.length} patterns`,
    "",
    ...state.groups.flatMap((g) => [
      g.priority.toUpperCase() + ": " + g.name,
      g.action,
      ...g.indices.map((i) => "“" + state.reviews[i].text + "”"),
      "",
    ]),
    "ACTION BOARD",
    ...state.tasks.map(
      (t) => `[${t.done ? "x" : " "}] ${t.short}: ${t.action}`,
    ),
  ];
  const url = URL.createObjectURL(
    new Blob([lines.join("\n")], { type: "text/plain" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "reviewradar-report.txt";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function downloadBackup() {
  const url = URL.createObjectURL(
    new Blob([serializeBackup(state)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "reviewradar-backup.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.view) {
    view = b.dataset.view;
    render();
  }
  if (b.hasAttribute("data-upload")) {
    $("#upload").showModal();
  }
  if (b.classList.contains("close")) b.closest("dialog").close();
  if (b.hasAttribute("data-export")) exportReport();
  if (b.id === "downloadbackup") downloadBackup();
  if (b.id === "choosebackup") $("#backupfile").click();
  if (b.dataset.add) {
    const g = state.groups.find((g) => g.id === b.dataset.add);
    if (!state.tasks.some((t) => t.id === g.id)) {
      state.tasks.push({ ...g, done: false });
      save();
      render();
      toast("Action added.");
    }
  }
  if (b.dataset.remove) {
    state.tasks = state.tasks.filter((t) => t.id !== b.dataset.remove);
    save();
    render();
  }
  if (b.dataset.detail) {
    const g = state.groups.find((g) => g.id === b.dataset.detail);
    $("#detail").innerHTML = html`
      <div class="dialogtop">
        <span class="eyebrow">Source reviews</span>
        <button class="close">×</button>
      </div>
      <h2>${esc(g.name)}</h2>
      <p>
        ${g.indices.length} related reviews. Review the context before taking
        action.
      </p>
      ${g.indices
        .map(
          (i) => html`
            <article class="reviewrow">
              <small>
                Review
                ${i + 1}${state.reviews[i].rating
                  ? " · " + state.reviews[i].rating + "/5"
                  : ""}
              </small>
              <p>“${esc(state.reviews[i].text)}”</p>
            </article>
          `,
        )
        .join("")}
    `;
    $("#detail").showModal();
  }
  if (b.id === "settings") {
    $("#detail").innerHTML = html`
      <div class="dialogtop">
        <span class="eyebrow">Workspace settings</span>
        <button class="close">×</button>
      </div>
      <h2>Workspace</h2>
      <label class="fieldlabel" for="business">Business name</label>
      <input
        type="text"
        id="business"
        maxlength="60"
        value="${esc(state.business)}"
      />
      <p>
        Reviews and actions are saved on this device. Export a report to share
        them with your team.
      </p>
      <div class="backupactions">
        <button class="secondary" id="downloadbackup">Download JSON backup</button>
        <button class="secondary" id="choosebackup">Restore JSON backup</button>
        <input id="backupfile" type="file" accept=".json,application/json" hidden />
      </div>
      <p id="backuperror" role="alert"></p>
      <p class="footnote">
        A restore replaces the reviews and actions saved in this browser.
      </p>
      <button class="primary" id="savebusiness">Save changes</button>
    `;
    $("#detail").showModal();
  }
  if (b.id === "savebusiness") {
    state.business = $("#business").value.trim() || "Your business";
    save();
    $("#detail").close();
    render();
  }
});
document.addEventListener("change", async (e) => {
  if (e.target.id === "backupfile") {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Choose a backup smaller than 5 MB.");
      }
      const restored = parseBackup(await file.text());
      if (
        !window.confirm(
          "Restore this backup? It will replace the reviews and actions saved in this browser.",
        )
      ) {
        return;
      }
      state = restored;
      query = "";
      view = "overview";
      save();
      $("#detail").close();
      render();
      toast("Backup restored.");
    } catch (error) {
      $("#backuperror").textContent =
        error.message || "The backup could not be restored.";
    }
  }
  if (e.target.dataset.task) {
    state.tasks.find((t) => t.id === e.target.dataset.task).done =
      e.target.checked;
    save();
    render();
  }
  if (e.target.id === "sort") {
    $("#groups").innerHTML = [...state.groups]
      .sort((a, b) =>
        e.target.value === "mentions"
          ? b.indices.length - a.indices.length
          : { High: 0, Medium: 1, Low: 2 }[a.priority] -
            { High: 0, Medium: 1, Low: 2 }[b.priority],
      )
      .map(groupCard)
      .join("");
  }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "search") {
    query = e.target.value;
    renderReviews();
  }
});
$("#uploadform").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("#uploaderror").textContent = "";
  const btn = $("#analyzebtn");
  try {
    const file = $("#file").files[0];
    if (file && file.size > 2 * 1024 * 1024)
      throw Error("Please choose a file smaller than 2 MB.");
    const pasted = $("#reviewtext").value.trim();
    if (!pasted && !file)
      throw Error("Choose a file or paste a few reviews first.");
    const text = pasted || (await file.text());
    const reviews = parse(
      text,
      !pasted && file.name.toLowerCase().endsWith(".csv"),
    );
    if (reviews.length < 2)
      throw Error("Add at least two reviews to find recurring patterns.");
    if (reviews.length > 500)
      throw Error("Please import up to 500 reviews at a time.");
    if (reviews.some((r) => r.text.length > 5000))
      throw Error("Each review must be shorter than 5,000 characters.");
    btn.disabled = true;
    reviews.forEach((r, i) => (r.id = i));
    const groups = await analyze(reviews, (message) => {
      $("#progress").textContent = message;
    });
    state = { ...state, reviews, groups, tasks: [], demo: false };
    query = "";
    save();
    $("#upload").close();
    view = "overview";
    render();
    toast("Report ready.");
  } catch (err) {
    $("#uploaderror").textContent =
      err.message?.includes("fetch") || err.message?.includes("network")
        ? "The model could not be downloaded. Check your connection and try again."
        : err.message || "Analysis could not complete. Please try again.";
  } finally {
    btn.disabled = false;
    $("#progress").textContent = "";
  }
});
render();

document.querySelector(".brand").addEventListener("click", (event) => {
  event.preventDefault();
  view = "overview";
  render();
});

$("#file").addEventListener("change", () => {
  if ($("#file").files.length) $("#reviewtext").value = "";
});
