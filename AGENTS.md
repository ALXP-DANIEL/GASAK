<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Frontend breakpoint policy

- Keep Tailwind default breakpoints (`sm`, `md`, `lg`, `xl`, `2xl`) available because generated shadcn components use them.
- Do not rewrite generated shadcn components only to replace default breakpoint prefixes.
- For hand-written GASAK app UI, prefer project aliases (`mobile:` and `desktop:`).
- Breakpoint equivalents: `mobile:` means below Tailwind `md` (`width < 48rem`, below `768px`); `desktop:` means Tailwind `md` and up (`width >= 48rem`, `768px+`).
- Use `src/hooks/use-screen.ts` for runtime checks: `useScreen("mobile")` returns true below `768px`, and `useScreen("desktop")` returns true at `768px+`.
- Treat unprefixed classes as the base/mobile-first style. Use `desktop:` for desktop-specific layout changes.

## Git branch roles

- `gasak` = the production app, the GASAK-flavored esports product (the canonical product codebase). Commits land here first.
- `main` = your own original-idea branch/variant. It is the deployed branch (the build/deploy runs against `main`).
- The two are NOT mirrors. `gasak` is a distinct esports flavor; `main` is a separate idea that selectively borrows work from `gasak`.

## Deploy workflow

- Standard flow: commit changes on `gasak`, then `git checkout main && git cherry-pick <sha> && git push origin main`, then return to `gasak` and `git push origin gasak`.
- Only cherry-pick the commits that belong on `main`. `gasak`-specific/flavor-specific commits must NOT be cherry-picked into `main`.
- Example of a `gasak`-only commit: `e4dbd00 revert(lanes)` (single-select revert) stays on `gasak` only — `main` must remain multi-select. If it ever lands on `main`, rebase it out: `git rebase --onto 5d730da e4dbd00 main` then `git push --force origin main`.
- Do NOT `reset`/`force-push` `main` to match `gasak` — they are intentionally different branches. Fix drift by carefully re-cherry-picking or selectively reverting individual commits.
