# ReviewRadar

A small browser app for café and restaurant owners who want to find recurring problems in customer reviews.

Import a CSV or paste reviews, inspect the groups and their source quotes, then keep a short list of actions to follow up on. Reports can be downloaded as plain text.

## Run locally

Requires Python 3. There is no build step.

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. Opening `index.html` directly from Finder will not load the JavaScript modules correctly.

## Review format

Text input accepts one review per line. CSV files need a `review` or `text` column. An optional `rating` column accepts numbers from 1 to 5. Quoted commas and multiline CSV fields are supported.

The import limit is 500 reviews, 2 MB per file, and 5,000 characters per review.

## Analysis

The app uses Transformers.js and the quantized `Xenova/all-MiniLM-L6-v2` sentence embedding model. Inference runs in the browser. The first analysis downloads the library, model and runtime; it needs an internet connection.

Reviews are compared with six restaurant-related concerns. Similar reviews outside those concerns are clustered separately. A group needs at least two reviews. Suggested actions come from a small set of predefined next steps; the app does not generate custom advice.

Customer reviews are not submitted to an analysis server. The model and runtime are downloaded from third-party hosts. Review data and actions are stored in this browser's local storage.

## Limits

- English café and restaurant reviews are the intended input.
- Unrated positive reviews can be grouped as concerns. Check the source quotes.
- Priority is based on mention frequency, not a business impact estimate.
- A new import replaces the current report and action list. Download it first if you need a copy.
- There is no cloud sync, shared workspace, payment flow or report history.

## Files

- `dist/app.js`: state, views and interactions
- `dist/analysis.js`: model loading and grouping
- `dist/review-import.js`: CSV and plain-text parsing
- `dist/sample-data.js`: sample reviews and suggested actions
- `dist/style.css`: interface styles

## Checks

Requires Node.js 18 or newer.

```sh
npm test
```

Model: https://huggingface.co/Xenova/all-MiniLM-L6-v2

Library: https://github.com/huggingface/transformers.js
