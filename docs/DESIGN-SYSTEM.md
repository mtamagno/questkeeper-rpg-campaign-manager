# QuestKeeper Interface Foundations

This is the implementation contract for QuestKeeper's shared interface. It
keeps campaign pages recognizable while allowing restrained visual identity.
The broader experience and illustration rules live in the
[Design and Art Guide](DESIGN-AND-ART-GUIDE.md).

## Three token levels

1. **Raw SCSS values** in `src/styles/_variables.scss` define the base palette,
   spacing scale, type, breakpoints and depth.
2. **Semantic CSS tokens** in `src/styles/_tokens.scss` describe purpose rather
   than a specific color: canvas, surface, text, accent, focus, status and
   motion.
3. **UI primitives** in `src/styles/_components.scss` consume only semantic
   tokens wherever a runtime campaign palette may change their appearance.

New application UI should prefer `--qk-*` variables and the shared primitives.
Existing SCSS variables remain supported while older components migrate.

## Stable semantic tokens

| Group    | Examples                                                        | Meaning                                 |
| -------- | --------------------------------------------------------------- | --------------------------------------- |
| Surface  | `--qk-color-canvas`, `--qk-color-surface-raised`                | Page and panel layers                   |
| Content  | `--qk-color-text`, `--qk-color-text-muted`                      | Readable text hierarchy                 |
| Identity | `--qk-color-accent`, `--qk-color-accent-text`                   | Campaign-aware emphasis                 |
| State    | `--qk-color-success`, `--qk-color-warning`, `--qk-color-danger` | Meaning that does not change with theme |
| Rhythm   | `--qk-space-1` through `--qk-space-16`                          | Four-pixel spacing system               |
| Shape    | `--qk-radius-*`, `--qk-shadow-*`                                | Consistent edges and depth              |
| Motion   | `--qk-duration-*`, `--qk-ease-standard`                         | Short, predictable feedback             |
| Layout   | `--qk-control-height`, `--qk-reading-width`                     | Touch and reading constraints           |

Campaign themes may replace the `--campaign-*` accent variables. Shared
components inherit those values through the semantic layer; status colors and
readability rules stay stable.

## Curated campaign palettes

Campaign manifests may choose one of three stable presets with the `palette`
field:

| ID        | Character                              | Intended use                                     |
| --------- | -------------------------------------- | ------------------------------------------------ |
| `heroic`  | Midnight blue, parchment and warm gold | Classic high adventure; legacy campaign fallback |
| `gothic`  | Charcoal, bone, burgundy and cool fog  | Horror, tragedy and oppressive settings          |
| `neutral` | Slate, silver and restrained blue-grey | System pages or campaigns needing quiet framing  |

Product pages without an active campaign use `neutral`. A campaign without a
`palette` keeps the original `heroic` appearance, so existing archives do not
need an immediate migration. Palette rules live in `src/styles/_palettes.scss`
and are activated with `data-qk-palette`; components must not branch on a
campaign ID to obtain ordinary colors. Each application load requests a
versioned manifest URL so a recent deployment cannot be hidden by a stale
browser cache.

The Campaign Manager exposes these presets when creating or editing a
campaign.

## Custom semantic palettes

Authors may duplicate any curated preset and edit eight named roles:
background, surface, text, accent/focus, border, success, warning and danger.
The Manager previews those roles on representative navigation, cards, buttons,
focus, dialogs, protected content and state labels rather than presenting an
abstract row of swatches.

Required text pairs must reach WCAG AA 4.5:1; structural borders must reach
3:1. The Manager explains every failing pair and disables Save until it is
corrected. The server repeats the validation, so importing a handcrafted file
cannot bypass the safety boundary. Palette files are versioned JSON and can be
exported, imported, renamed or reset one role at a time to their source preset.

Custom palettes live in `customPalette` beside the manifest's `palette:
"custom"` selector. A legacy or damaged draft is preserved for repair, but the
Companion falls back to Heroic instead of applying unreadable values. Campaigns
without custom data remain byte-for-byte compatible with their existing
curated preset.

## UI primitives

### Panels

```html
<section class="qk-panel qk-panel--raised">...</section>
<a class="qk-panel qk-panel--interactive" href="...">...</a>
```

Available modifiers: `--raised`, `--accent`, `--interactive`.

### Buttons

```html
<button class="qk-button qk-button--primary">Save</button>
<button class="qk-button qk-button--secondary">Cancel</button>
<button class="qk-button qk-button--ghost">More</button>
```

Available modifiers: `--primary`, `--secondary`, `--ghost`, `--danger` and
`--compact`. The default control is at least 44 CSS pixels tall. Use a native
button or link so keyboard behavior is not recreated with ARIA.

### Badges

```html
<span class="qk-badge qk-badge--accent">In progress</span>
```

Available modifiers: `--accent`, `--success`, `--warning`, `--danger`.
Never use a badge color without an accompanying text label.

### Callouts

```html
<aside class="qk-callout qk-callout--warning">
  <h3 class="qk-callout__title">Before publishing</h3>
  <p>Review player-safe information and spoilers.</p>
</aside>
```

Available modifiers: `--info`, `--success`, `--warning`, `--danger`.

### Heading groups

Use `qk-heading-group` with `__eyebrow`, `__title` and `__description` to keep
page introductions consistent without forcing one heading level.

## Accessibility contract

- Primary controls retain a visible focus ring and a 44 px default height.
- Hover effects never carry the only interaction cue.
- `prefers-reduced-motion` removes transforms and primitive transitions.
- `prefers-contrast: more` strengthens text and border tokens.
- Forced-colors mode keeps component boundaries visible.
- State meaning always includes text; campaign colors never replace status
  colors.

## Adding or changing a primitive

1. Confirm the need appears in at least two workflows.
2. Name the component for its function, not its current visual treatment.
3. Use an existing semantic token or add one with a documented purpose.
4. Test default, hover, focus, disabled, narrow and reduced-motion states.
5. Verify neutral product pages, the public Lantern Road fixture and both
   production campaigns.
6. Record any intentional product-specific difference in the sync ledger.

The password dialog is the first production consumer of `qk-panel` and
`qk-button`; it provides a compact regression surface for every palette.
