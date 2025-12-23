# AI Agent Guide

_For GitHub Copilot, Cursor, Claude Code, and other AI coding assistants_

## Quick Start

**Read these files first:**

- `plan.md` - Project roadmap and completed phases
- `tasks.md` - Current sprint tasks with priorities

## Project Context

| Aspect           | Details                                                    |
| ---------------- | ---------------------------------------------------------- |
| **Project**      | Personal calendar app for birthdays, anniversaries, events |
| **Purpose**      | Learning Angular while building useful tool                |
| **Status**       | Phase 3 complete (Supabase-only architecture)              |
| **Architecture** | Angular 20 + Supabase (cloud-only)                         |

## Copilot Workflow

### Using Plan Mode

1. **Start**: Describe the feature or task you want to implement
2. **Plan**: Copilot analyzes codebase and creates step-by-step plan
3. **Review**: Approve or modify the plan
4. **Execute**: Copilot implements each step with explanations
5. **Validate**: Run `npm run lint` and test in browser

### Quick Prompts

```
"Implement [task] from tasks.md"
"Add loading spinner to [component]"
"Add ARIA labels to [component] for accessibility"
"Fix TypeScript errors in [file]"
```

### Before Each Task

- Check `tasks.md` for current priorities
- Check `plan.md` for context on what's done
- Read relevant service/component code first

## Tech Stack

- **Angular 20**: Standalone components, signals, reactive forms, OnPush
- **Angular Material**: UI components (Material Design 3)
- **FullCalendar**: Calendar views and interactions
- **Supabase**: Auth and PostgreSQL database (cloud-only)
- **TypeScript**: Strict typing throughout

## Project Structure

```
src/app/
├── components/       # Reusable UI (modals, lists)
├── pages/            # Route-level components
├── services/         # Business logic & state
├── guards/           # Route protection
└── types/            # TypeScript interfaces
```

## Angular Best Practices

### Components

- Standalone components (default in Angular 20)
- Separate .ts, .html, .scss files
- `OnPush` change detection
- Use signals (`signal()`, `computed()`, `effect()`)
- New template syntax (`@if`, `@for`)

### Services

- `providedIn: 'root'` for singletons
- `inject()` function for DI
- Signals for reactive state

### Forms

- Reactive forms with `NonNullableFormBuilder`
- Angular validators

### Templates

- Use `async` pipe for observables
- Angular Material components
- ARIA labels for accessibility

### TypeScript

- Strict typing, no `any`
- Prefer `interface` over `type`

## Local Development

```bash
npm install   # Install dependencies
npm start     # Dev server (localhost:4200)
npm test      # Unit tests
npm run lint  # ESLint
```

## AI Agent Workflow

1. **Assess** – Review `plan.md`, `tasks.md`, and related code
2. **Plan** – Use planning tool for multi-step work
3. **Implement** – Follow Angular best practices
4. **Validate** – Run `npm run lint`
5. **Report** – Summarize changes with file references

## Key Services

### CalendarEventsService

CRUD operations for events with direct Supabase integration. Uses optimistic updates for better UX.

### ContactsService

CRUD operations for contacts with direct Supabase integration.

### OccasionsService

CRUD operations for occasions (birthdays/anniversaries) with direct Supabase integration.

### SupabaseService

Authentication and PostgreSQL database operations. Has `DEV_MODE_BYPASS_AUTH` toggle for development.

### Service with Signals

```typescript
import { Injectable, signal, computed, inject } from "@angular/core";
import { SupabaseService } from "./supabase.service";

@Injectable({ providedIn: "root" })
export class MyService {
  // Use inject() for dependency injection (modern Angular approach)
  private readonly supabase = inject(SupabaseService);

  // Private signal for internal state
  private readonly _items = signal<Item[]>([]);

  // Expose readonly signal to consumers
  readonly items = this._items.asReadonly();

  // Computed signal for derived state
  readonly itemCount = computed(() => this._items().length);

  constructor() {
    // Initialize loads data from Supabase
    this.initialize();
  }

  private async initialize(): Promise<void> {
    const items = await this.supabase.fetchItems();
    this._items.set(items);
  }

  async reload(): Promise<void> {
    // Manually refresh from Supabase
    await this.initialize();
  }
}
```

### Creating a Component with Signals

```typescript
import { Component, computed, signal, inject } from "@angular/core";
import { ChangeDetectionStrategy } from "@angular/core";

@Component({
  selector: "my-component",
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

---

**Remember**: This is a learning project. Prioritize clarity and best practices over premature optimization.
