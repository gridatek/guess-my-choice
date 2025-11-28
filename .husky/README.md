# Git Hooks

This directory contains Git hooks managed by [Husky](https://typicode.github.io/husky/).

## Available Hooks

### pre-commit

**Runs on**: `git commit`

**Purpose**: Automatically format staged files before committing

**What it does**:

- Runs `lint-staged` which formats only staged files
- Uses Prettier to format code
- Processes: `.js`, `.ts`, `.jsx`, `.tsx`, `.json`, `.css`, `.scss`, `.md`, `.html`, `.sql`
- Fast execution (only checks changed files)

**Configuration**: See `lint-staged` in root `package.json`

### commit-msg

**Runs on**: `git commit`

**Purpose**: Validate commit messages follow Conventional Commits format

**What it does**:

- Validates commit message format using `commitlint`
- Enforces: `type(scope): subject`
- Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`,
  `revert`

**Configuration**: See `.commitlintrc.json` in root

## Examples

### ✅ Valid Commits

```bash
git commit -m "feat: add user authentication"
git commit -m "fix: resolve login redirect issue"
git commit -m "docs: update README with setup instructions"
git commit -m "chore: update dependencies"
git commit -m "refactor(auth): simplify token validation"
```

### ❌ Invalid Commits

```bash
git commit -m "Add feature"           # Missing type
git commit -m "FEAT: add feature"     # Type must be lowercase
git commit -m "added new feature"     # Wrong format
```

## Bypassing Hooks

**Not recommended**, but if necessary:

```bash
git commit --no-verify -m "message"
```

## Troubleshooting

### Hooks not running

1. Ensure Husky is installed: `npm install`
2. Check `.husky/` directory exists
3. Verify hook files are executable (handled automatically on install)

### Commit message validation failing

- Check your message follows: `type: subject` or `type(scope): subject`
- Type must be one of: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
- Subject must not start with uppercase

### Formatting failing

- Check Prettier configuration in `.prettierrc.json`
- Verify file is not in `.prettierignore`
- Run manually: `npm run format`

## More Information

- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [commitlint Documentation](https://commitlint.js.org/)
