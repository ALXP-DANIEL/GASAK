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
