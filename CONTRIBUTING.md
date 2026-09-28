# Contributing

Thanks for helping! Bug reports, ideas and pull requests are welcome.

## Before you start

- For anything bigger than a small fix, open an issue first so we can agree on the approach.
- Security problems: follow [SECURITY.md](SECURITY.md) instead of opening an issue.

## Local setup

Follow the [development setup in the README](README.md#development). In short:

```bash
npm install
npm run dev        # local mode, no authentication
npm run test       # all workspaces
```

## Code guidelines

- Strict TypeScript: no `any`, no `as unknown`.
- Validate every API input with Zod.
- Business rules live in `apps/api/src/services/` only, never in routes or controllers.
- Shared types come from `@foyer/types`; do not redefine them locally.
- React: functional components, server state in TanStack Query (no `useEffect` for fetching).
- User-facing text goes through i18n (English and French).
- Add a unit test with every new service function.
- All code, comments and commit messages are in English.

## Commits

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`
- Scopes: `web`, `api`, `types`, `infra`

Example: `feat(api): add expense split endpoint`

## License

By contributing, you agree that your contributions are licensed under the
[GNU AGPL-3.0](LICENSE), like the rest of the project.
