# My Calendar - Frontend MVP

**Personal calendar app** for managing birthdays, anniversaries, and important events.

## Tech Stack

- **Angular 20** - Standalone components, signals, reactive state
- **Angular Material** - UI components (Material Design 3)
- **FullCalendar** - Calendar views and interactions
- **Supabase** - Authentication and PostgreSQL database
- **TypeScript** - Strict typing throughout

## Architecture

Cloud-only architecture with direct Supabase integration:

- All data stored in PostgreSQL via Supabase
- Optimistic UI updates for better user experience
- Authentication via email/password or Google OAuth
- Row-level security (RLS) policies for data protection

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.1.3.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
