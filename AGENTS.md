# AI Agent Guide

_For use with Cursor, GitHub Copilot, Claude Code, Codex, and other AI coding assistants_

## Mission & Product Context

- **Project**: Personal hobby calendar app for managing important dates (birthdays, anniversaries, events) with reminders.
- **Purpose**: Learning Angular and related technologies while building a useful tool for personal use and relatives.
- **Current State**: MVP Phase 1 complete - basic events CRUD, FullCalendar integration, local persistence, reminders, and upcoming view.
- **Architecture**: Angular 20 standalone components, Angular Material UI, Signals/RxJS for state, Dexie for IndexedDB.
- **Future**: Contacts/occasions management, Supabase sync/auth, AI features, PWA capabilities (see `plan.md`).

## Tech Stack & Project Structure

### Core Technologies

- **Angular 20**: Standalone components, signals, reactive forms
- **Angular Material**: UI components and theming (Material Design 3)
- **FullCalendar**: Calendar views and drag/drop interactions (`@fullcalendar/*`)
- **Dexie**: IndexedDB wrapper for offline-first persistence
- **RxJS**: Reactive programming (used alongside signals)
- **TypeScript**: Strict typing throughout

### Project Structure

```
src/app/
├── components/          # Reusable UI components
│   ├── event-modal/     # Event create/edit modal
│   ├── reminders-list/  # Reminders display component
│   └── content-wrapper/ # Layout wrapper
├── pages/               # Route-level page components
│   ├── calendar/        # Main calendar view
│   ├── upcoming/        # Upcoming events view
│   ├── home/            # Landing page
│   └── about/           # About page
├── services/            # Business logic and state management
│   ├── calendar-events.service.ts  # Events CRUD operations
│   ├── storage.service.ts          # IndexedDB persistence
│   └── reminders.service.ts        # Reminder calculations
└── types/               # TypeScript type definitions
    └── event.type.ts    # CalendarEvent interface
```

## Learning-Focused Development Guidelines

### Code Comments & Documentation

- **Add explanatory comments** for Angular concepts that may not be obvious to learners:
  - Signal usage and computed signals
  - Dependency injection patterns
  - Reactive forms setup and validation
  - Effect usage and lifecycle hooks
  - Service patterns and state management
- **Comment complex logic** or non-obvious implementations (date parsing, reminder calculations, etc.)
- **Keep comments concise** but educational - explain the "why" not just the "what"
- **Document patterns** used (e.g., "Using computed signal for derived state" or "Effect tracks events changes")

### Angular Best Practices (Learning Mode)

#### Components

- Use **standalone components** (default in Angular 20)
- Separate component, template, and styles into their own files
- Use `OnPush` change detection strategy where applicable for performance
- Keep components lean - move business logic to services
- Use **signals** for reactive state (`signal()`, `computed()`, `effect()`)
- Prefer **new template syntax** (`@if`, `@for`) over `*ngIf`, `*ngFor`

#### Services

- Use `providedIn: 'root'` for singleton services
- Inject dependencies using `inject()` function (modern approach)
- Encapsulate stateful logic in services
- Use signals for reactive state management
- Handle errors gracefully with try/catch and user feedback

#### Forms

- Prefer **reactive forms** (`ReactiveFormsModule`) over template-driven
- Use `NonNullableFormBuilder` for type-safe form building
- Validate forms with Angular validators
- Show validation errors appropriately (dirty/touched/submitted states)

#### Templates

- Use `async` pipe for observables (avoids manual subscription management)
- Avoid logic in templates - use computed signals or methods
- Use Angular Material components for consistency
- Ensure accessibility: ARIA labels, keyboard navigation, semantic HTML

#### TypeScript

- **Strict typing**: Avoid `any`, use proper interfaces/types
- Prefer `interface` over `type` for object shapes
- Use type guards and null checks appropriately
- Leverage TypeScript's type inference where helpful

## Development Workflow

### Local Setup

```bash
npm install          # Install dependencies
npm start           # Start dev server (http://localhost:4200)
npm test            # Run unit tests
npm run lint        # Run ESLint
```

### AI Agent Delivery Pattern

_This workflow applies to all AI coding assistants (Cursor, GitHub Copilot, Claude Code, Codex, etc.)_

1. **Assess** – Review `plan.md`, existing code, and related files before making changes
2. **Plan** – For multi-step work, use the planning tool; skip for single-step tasks
3. **Implement** – Follow Angular best practices, add learning-focused comments where helpful
4. **Validate** – Run lint/tests for affected code; explain if validation skipped
5. **Report** – Summarize changes with file references (`path:line`), test status, and follow-ups

## Coding Standards

### State Management

- Use **signals** for component and service state (`signal()`, `computed()`)
- Use `effect()` sparingly for side effects (e.g., syncing with external libraries)
- Keep state in services, not components
- Make signals readonly when exposing them (`asReadonly()`)

### Error Handling

- Handle storage errors gracefully (fallback to in-memory if IndexedDB unavailable)
- Show user-friendly error messages via Material Snackbar
- Log errors to console for debugging
- Revert optimistic updates on error

### Data Persistence

- **StorageService** handles all IndexedDB operations (via Dexie)
- Components use **CalendarEventsService**, not direct storage access
- All CRUD operations auto-save to IndexedDB
- Handle storage unavailability gracefully

### UI/UX Standards

- **Responsive design**: Test desktop, tablet, and mobile breakpoints
- **Empty states**: Show helpful messages when no data exists
- **Loading states**: Display spinners/indicators during async operations
- **Error feedback**: Use Material Snackbar for user notifications
- **Accessibility**: ARIA labels, keyboard navigation, color contrast
- **Material Design 3**: Use Material components and theming tokens

## Common Patterns & Examples

### Creating a New Service

```typescript
import { Injectable, signal, computed, inject } from "@angular/core";

@Injectable({ providedIn: "root" })
export class MyService {
  // Use inject() for dependency injection (modern Angular approach)
  private readonly storage = inject(StorageService);

  // Private signal for internal state
  private readonly _items = signal<Item[]>([]);

  // Expose readonly signal to consumers
  readonly items = this._items.asReadonly();

  // Computed signal for derived state
  readonly itemCount = computed(() => this._items().length);

  // Async initialization
  ngOnInit(): void {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Load data...
  }
}
```

### Creating a Component with Signals

```typescript
import { Component, computed, signal, inject } from "@angular/core";
import { ChangeDetectionStrategy } from "@angular/core";

@Component({
  selector: "my-component",
  standalone: true,
  imports: [CommonModule /* Material modules */],
  templateUrl: "./my-component.html",
  changeDetection: ChangeDetectionStrategy.OnPush, // Better performance
})
export class MyComponent {
  // Inject services using inject() function
  private readonly eventsSvc = inject(CalendarEventsService);

  // Component state with signals
  readonly searchQuery = signal<string>("");

  // Computed signal for filtered data
  readonly filteredItems = computed(() => {
    const items = this.eventsSvc.events();
    const query = this.searchQuery().toLowerCase();
    return items.filter((item) => item.title.toLowerCase().includes(query));
  });
}
```

### Reactive Forms Pattern

```typescript
import { NonNullableFormBuilder, Validators, ReactiveFormsModule } from "@angular/forms";

export class MyFormComponent {
  private readonly fb = inject(NonNullableFormBuilder);

  // Form definition with validation
  readonly myForm = this.fb.group({
    title: ["", [Validators.required, Validators.maxLength(120)]],
    date: [new Date(), Validators.required],
  });

  // Check if form is valid
  readonly canSubmit = computed(() => this.myForm.valid);

  onSubmit(): void {
    if (this.myForm.valid) {
      const value = this.myForm.getRawValue();
      // Process form data...
    }
  }
}
```

## File Organization

- **Components**: One component per file, separate template/styles files
- **Services**: One service per file, group related functionality
- **Types**: Centralize type definitions in `src/app/types/`
- **Styles**: Global styles in `styles.scss`, component styles in component files
- **Routes**: Define routes in `app.routes.ts`

## Testing & Validation

- Run `npm run lint` before committing changes
- Write unit tests for services and complex logic
- Test user flows manually in browser
- Validate responsive design on different screen sizes
- Check accessibility with browser dev tools

## Future Integration Notes

### Supabase (Phase 3)

- Plan schema-aware TypeScript types
- Implement RLS policies for security
- Build sync layer with conflict resolution
- Handle optimistic updates

### AI Features (Phase 3)

- Safeguard API keys (never commit to repo)
- Stream responses for better UX
- Document prompts and payloads
- Handle rate limiting and errors

### PWA (Phase 3)

- Use `@angular/pwa` package
- Implement offline caching strategy
- Add install prompt
- Plan push notifications (FCM) for v2

## Resources

- [Angular Documentation](https://angular.io/docs)
- [Angular Signals Guide](https://angular.io/guide/signals)
- [Angular Material Components](https://material.angular.io/components)
- [FullCalendar Angular Integration](https://fullcalendar.io/docs/angular)
- [Dexie.js Documentation](https://dexie.org/docs/Tutorial/Getting-started)
- [RxJS Documentation](https://rxjs.dev/guide/overview)

## Collaboration Notes

- Reference files using `path:line` format in summaries
- Note skipped validations and why
- Leave TODOs sparingly, tie to roadmap items
- Update `README.md` when adding new scripts or configs
- Keep learning-focused comments for educational value

---

**Remember**: This is a learning project. Prioritize clarity, educational value, and best practices over premature optimization. Keep code maintainable and well-documented for future learning and improvements.
