# Contributing

## Branching Model

- Create feature branches from `main`
- Open a pull request to `main` for review
- Squash merge when approved

## Development

```bash
npm install
npm run dev
```

## Running Tests

```bash
npx vitest run
```

## Database Migrations

After modifying `shared/schema.ts`:

```bash
npx drizzle-kit push
```

## Code Style

- TypeScript strict mode
- ESLint for linting
- Tailwind CSS v3 for styling
- Follow existing patterns in the codebase

## Proposing Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run tests (`npx vitest run`)
5. Run type check (`npm run check`)
6. Commit with a clear message
7. Open a pull request with a description of what changed and why
