# MAYF formula reference catalogue

This collection combines the original rich formula cards with original MAYF
revision notes for school mathematics (learning levels Class 5–12), quantitative
aptitude and entrance-exam mathematics. It includes identities, geometric
relations, exact standard-angle values, unit conversions and statistical facts.
It is a broad reference collection, not a claim that every identity in mathematics
or every current examination syllabus is exhausted.

The class labels indicate a suitable learning/revision level. They are not an
assertion that each entry is prescribed in every board's textbook. Advanced
probability distributions and some geometry are enrichment/entrance material.
Competitive-exam tags describe mathematical relevance, not an exam endorsement.

## Editing

Edit the tuples in `formulaCatalogue.ts`: title, LaTeX, original usage note, and
an optional original example. Common category, levels, variable definitions and
topic tags are held at group level to avoid copying them into every row. Titles
produce stable `reference-...` slugs; retain a title after publication unless an
explicit URL migration is also provided. Original published slugs are preserved
in `formulaDeckData.ts`. Identical whitespace-normalised LaTeX expressions are
not appended a second time.

Examples are optional; the interface does not invent worked examples for entries
that have none. New reference cards are free. Existing card access flags remain.

## Reference scope

These are independent summaries of standard mathematical facts, not copied
textbook explanations, assessments, illustrations or worked examples. Reference
sources for checking scope and notation include:

- NCERT Class XII relations/functions exemplar: https://ncert.nic.in/pdf/publication/exemplarproblem/classXII/mathematics/leep201.pdf
- NCERT Class XII applications of integrals: https://ncert.nic.in/textbook/pdf/lemh202.pdf
- OpenStax Precalculus 2e, trigonometric equations: https://openstax.org/books/precalculus-2e/pages/7-key-equations
- OpenStax Calculus Volume 1, integration equations: https://openstax.org/books/calculus-volume-1/pages/5-key-equations
- OpenStax Introductory Statistics 2e, probability formulas: https://openstax.org/books/introductory-statistics-2e/pages/3-formula-review

## Validation

The tests check unique identifiers, original URLs, complete category/level
coverage, every expression with strict KaTeX parsing, the numeric values of all
exact-angle cards, and selected domain conditions. Rendering tests cannot prove
an arbitrary mathematical identity; mathematical edits still need review.
