# Build utilities

- `generate-thumbnails.cjs` creates incremental 300 px gallery thumbnails.
- `generate-display-images.cjs` creates compressed display-size variants.

Both scripts scan `src/campaigns/*/images/` during `npm run build`, skip SVGs,
and never send assets to an external service.

Focused `verify-*.cjs` scripts protect reusable product contracts. In
particular, `verify-table-moments.cjs` keeps out-of-character memories separate
from campaign canon and checks their navigation, semantics, and responsive
presentation.
