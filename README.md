# Point Alpha

Point Alpha is an offline educational resource about emergency scenarios, built with HTML, CSS, and vanilla JavaScript. It presents fixed, source-linked information for learning and awareness; it is not a survival guide or operational emergency instruction.

## Run

Open `index.html` in a modern browser. The interface, catalog, search, favorites, recent history, and accessibility controls run locally. No network connection, account, server, or external library is required.

## Project files

- `index.html` — semantic page structure and application entry point.
- `style.css` — responsive dark interface, accessibility states, and dialog layout.
- `app.js` — search, navigation, local preferences, favorites, and recent history.
- `scenarios.js` — 70 scenario records, guidance, citations, and safety/localization notes.
- `assets/logo.svg` — local application mark.
- `tools/build_release.py` — standard-library bundler for the standalone release.
- `PointAlpha.html` — self-contained release with styles, scripts, and logo embedded.

Favorites, recent items, and display preferences are stored in this browser's local storage. They stay on the device and are not synchronized.

## Intended use

This is an educational resource for learning and awareness, not a survival guide or operational emergency-response tool. Do not rely on it during an emergency. Follow current local authority instructions, trained responder directions, and professional medical care. The material is international in scope, but laws, hazards, alerts, shelters, languages, accessibility needs, and medical procedures vary by country and region. Qualified emergency-management and medical educators should verify the material before using it in formal training.

The detail view displays each source organization, page or document title, URL, access date, and additional notes. Source links require a network connection; scenario text remains stored locally. This resource includes no emergency phone numbers.

When adding or revising guidance, verify each individual instruction against a source that directly supports it. A citation on a scenario does not by itself validate every field. Keep the source organization, exact page or document title, URL, and current access date in `sources`; retain relevant source limits and local safety considerations in `notes`. Keep the fail-fast source and scenario mappings intact so a missing citation or overview cannot silently fall back to generic category text.

## Accessibility

The interface supports keyboard operation, visible focus, a skip link, reduced-motion preferences, large text, high contrast, and a focus mode. Use `⌘ K` on macOS or `Ctrl K` on other platforms to focus search.

## Release

Run `python3 tools/build_release.py` after changing source files. `PointAlpha.html` is the standalone offline release. It embeds all application CSS and JavaScript and references no remote resources.
