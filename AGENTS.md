# Codex Agent Guide

## Mission & Product Context

- Build an MVP personal CRM/calendar that centralizes important contacts, occasions, and reminders so users never miss key dates.
- Current UI centers on an Angular Material shell plus FullCalendar event management with modal editing.
- Roadmap (see `plan.md`) layers in contacts & occasion CRUD, offline-first IndexedDB storage, Supabase sync/auth, AI-generated messaging, and future PWA enhancements.

## Tech Stack & Project Shape

- Angular 20 standalone components, Angular Material for UI, and RxJS/Signals for state.
- FullCalendar (`@fullcalendar/*`) powers scheduling views and drag/drop interactions.
- Styling via global `styles.scss` plus per-component SCSS.
- Upcoming integrations: Supabase (auth, persistence), IndexedDB (offline cache via idb/Dexie), OpenAI-powered copy suggestions.
- Type definitions live under `src/app/types`; services under `src/app/services` manage domain logic.

## Local Development Workflow

- Install dependencies with `npm install` (Angular CLI 20.1.x).
- Run the dev server using `npm start` (`ng serve`) and browse `http://localhost:4200`.
- Unit tests: `npm test`; linting: `npm run lint` (ESLint + angular-eslint config).
- Prefer incremental validation—run relevant lint/tests before finishing significant work.
- Keep Angular CLI generators in mind (`ng generate component|service|pipe ...`) for consistent scaffolding.

## Codex Agent Delivery Pattern

1. **Assess** – Review `plan.md`, related feature files, and existing types/services before coding.
2. **Plan** – For multi-step work, outline steps with the planning tool; avoid single-step plans.
3. **Implement** – Follow Angular best practices (standalone components, typed services, signals where helpful). Update supporting types and tests together.
4. **Validate** – Run lint/tests tied to the change. If a command cannot be executed, explain why and suggest how the user can verify.
5. **Report** – Summaries should mention key changes, affected files (with line refs), and test status. Suggest sensible follow-up actions when relevant.

## Coding Standards & Best Practices

- Favor strong typing: expand domain interfaces in `src/app/types` before overloading loose `any` usage.
- Encapsulate stateful logic in services; keep components lean and template-driven.
- Use Angular Material components for consistency; align spacing/colors with existing SCSS tokens.
- Guard against regressions in calendar interactions (drag/drop, modal edit). When touching `CalendarEventsService`, confirm event lifecycle remains intact.
- Keep accessibility in view: proper ARIA labels, keyboard flows, and color contrast when styling.
- Write concise comments only when clarifying non-obvious logic.

## Data & Integration Considerations

- IndexedDB layer should abstract persistence so UI components stay framework-agnostic; Dexie or idb wrappers belong in dedicated services.
- Supabase integration should include schema-aware TypeScript types, RLS-ready queries, and secure auth flows (email + Google per roadmap).
- AI endpoints (serverless) must safeguard API keys and stream responses to the UI. Document prompts and expected payloads when adding them.
- Plan for optimistic updates plus conflict resolution when syncing between local cache and Supabase.

## UI/UX Expectations

- Maintain responsive layouts; audit major breakpoints (desktop/tablet/mobile) when modifying pages or modals.
- Provide empty states, loading indicators, and error surfaces as features mature (noted in roadmap polish step).
- Ensure calendar interactions remain touch-friendly and accessible.

## Collaboration Checklist

- Reference affected files with `path:line` style in final updates.
- Note any skipped validations and why; recommend how to run them locally.
- Leave TODOs sparingly and always tie them to upcoming roadmap slices or GitHub issues.
- When introducing new config or scripts, document usage in `README.md` and mention it in the handoff.

Stay aligned with the build plan, deliver incremental value, and keep communication tight—future you (and fellow Codex agents) will thank you.

## Angular Style Guide References

- When generating new components separate component, template, and styles into their own files.
- Use Angular's built-in directives and pipes where possible.
- Prefer reactive forms over template-driven forms for complex form handling.
- Use `OnPush` change detection strategy for better performance where applicable.
- Avoid logic in templates; keep them declarative.
- Use services for shared state and business logic.
- Leverage Angular's dependency injection for better testability and modularity.
- Use RxJS operators effectively to manage asynchronous data streams.
- Prefer `async` pipe for subscribing to observables in templates.
- Avoid using `subscribe` in components; use `async` pipe instead.
- Use `takeUntil` or `takeWhile` to manage subscriptions and avoid memory leaks.
- Use new syntax on templates like `@if` and `@for` for better readability and performance. Newer use older `*ngIf` and `*ngFor`.
- For styles, prefer SCSS and use Angular Material theming capabilities.
- Keep components small and focused on a single responsibility.

### TypeScript Best Practices

- Use strict typing and avoid `any` type.
- Use an `interface` instead of a `type`.

### Recommended Reading

- [Angular Official Documentation](https://angular.io/docs)
- [Angular CLI Documentation](https://angular.io/cli)
- [Angular Style Guide](https://angular.io/guide/styleguide)
- [Angular Material](https://material.angular.io/)

## Additional Resources

- [FullCalendar Angular Integration](https://fullcalendar.io/docs/angular)
- [RxJS Documentation](https://rxjs.dev/guide/overview)
- [Supabase Docs](https://supabase.com/docs)
- [Dexie.js Documentation](https://dexie.org/docs/Tutorial/Getting-started)
