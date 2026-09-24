# Content guide

The database lives in `src/data/knowledge.ts`. Each category contains compact, pipe-separated concept rows:

```text
Canonical name~alias one/alias two~rarity~first appearance year~region
```

Trailing optional fields may be omitted. The decoder produces typed `Concept` objects with a stable ID, canonical name, aliases, category membership, difficulty, rarity, and optional year, region, or short fact. Identically named concepts merge their category memberships and aliases. Preserve row order when modifying an established dataset, because the current IDs are assigned by insertion order. For a major content reordering, migrate IDs and bump the profile/content version.

## Editorial requirements

- Add real, clearly categorized concepts. Never add invented filler solely to enlarge the list.
- Add useful accepted spellings and abbreviations explicitly.
- Validate years before adding them: historical constraints rely on this metadata.
- Regions are currently used only for car-manufacturer origin constraints.
- Keep facts short, stable, and directly relevant. Omit a fact if uncertain.
- Distinguish concept ambiguity when the canonical name would represent unrelated meanings.
- Assign rarity as an editorial challenge tier, not an empirical claim about player frequency.
- Ensure each added category works at its intended difficulty levels.
- Run `npm test` and `npm run build` after changes.

## Matching

Input normalization removes accents and cosmetic punctuation, folds case, expands `++`, `#`, and `&`, and keeps alphanumeric content. This intentionally distinguishes C, C++, and C#. Category membership is checked before accepting a match. A Signal character may match any known canonical name or alias. Length constraints count alphabetic letters in the canonical name, not punctuation or spaces.

Plural handling is deliberately restricted to noun-heavy categories. Beginner mode accepts one unambiguous edit for longer answers. Expert and Nightmare require recognized exact spellings or aliases after normalization.

## Data limitations

The initial collection has 2,001 concepts, 29 categories, and 55 brief facts. It is curated starter content, not an exhaustive encyclopedia. Scientific symbols and short aliases may be accepted where explicitly listed. A valid real-world answer absent from the database must be added before the game can recognize it. The game never sends answers to an AI service.
