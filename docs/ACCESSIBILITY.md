# Accessibility contract

**Roadmap:** Day 06, commit 1  
**Journeys:** every Player and Game Master path

QuestKeeper treats keyboard and assistive-technology behavior as part of the
application shell, not as decoration added page by page.

## Navigation and landmarks

- A skip link reaches the single main-content landmark.
- The persistent sidebar is complementary navigation and never introduces a
  second page-level heading.
- Focus follows navigation, not rendering accidents: after an in-app route
  change, the routed `h1` receives temporary programmatic focus (falling back to
  `main`) and the page name is announced through one polite live region.
- Initial page load does not steal focus. The document language follows the
  selected interface language.
- Opening the mobile menu moves focus into it; Escape, the backdrop and the
  menu toggle return focus predictably.

## Dialogs and controls

- Command palette, protected-section dialog and image viewer contain Tab focus,
  close on Escape and restore the element that launched them.
- Inputs expose labels, error relationships, invalid state and appropriate
  autocomplete metadata.
- Expand/collapse controls use native buttons and `aria-expanded`; visual
  headings are not repurposed as keyboard controls.
- Visible focus uses semantic palette tokens and remains apparent in increased
  contrast and forced-colour modes.

## Responsive baseline

Keyboard order and controls must remain usable at 360 CSS pixels, at 200% text
zoom and with reduced motion. New overlays must use the shared focus-trap helper
instead of creating a page-specific Tab loop. Automated guards check the shell,
modal and native-button contracts; manual review remains required for reading
order, wording and visual focus placement.
