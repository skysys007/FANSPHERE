# Contributing to FANSPHERE

First off, thank you for considering contributing to FANSPHERE! It's people like you that make open source such a powerful community.

## Development Workflow

1.  **Fork the repository** and create your branch from `main`.
2.  If you've added code that should be tested, **add unit tests** in the `tests/` directory.
3.  Ensure your code passes the automated test suite: `npm run test`
4.  Ensure your code is perfectly formatted and linted: `npm run format` and `npm run lint:fix`
5.  If you've changed APIs or core architecture, update the documentation.
6.  Ensure your commit messages are descriptive and follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) format (e.g., `feat: add new map layer`).
7.  Issue that pull request!

## Code Quality Standards

We employ strict enforcement of ESLint and Prettier. Any Pull Request that fails the automated CI/CD pipeline on GitHub Actions will be blocked from merging until fixed.

## Bug Reports and Feature Requests

Please use the provided Issue Templates when submitting bugs or feature requests to ensure the maintainers have all the context they need to help you.
