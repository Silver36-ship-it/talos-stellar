## Summary

Provide a brief description of the changes, background context, and what these changes accomplish.

## Related Issues

Closes #N (Replace N with the issue number, e.g. Closes #1)

## Test Plan

Detail the steps you took to test these changes.

- [ ] Automated tests run (e.g. `cargo test`, `uv run pytest`, `pnpm test:e2e`)
- [ ] Focused regression tests added or updated for the changed behavior (including request-body size guards and malformed JSON handling)
- [ ] Manual verification steps performed:
  - 1. ...
  - 2. ...
- [ ] Relevant docs updated when setup, environment variables, or workflows changed
- [ ] Any request size limit or response contract documented in code comments or docs, including the `BODY_LIMIT_BYTES` byte contract and 413 error semantics

## Visual Changes (if applicable)

For any user interface changes, please add screenshots or screen recordings showing:

- Before
- After

## Checklist

- [ ] I have read the [CONTRIBUTING.md](../CONTRIBUTING.md) guide.
- [ ] My code follows the style guidelines of this project.
- [ ] I have updated `.env.example` files and documentation if I changed environment variables.
- [ ] I documented any request-body limits, response codes, and config values affected by this change.
- [ ] My changes generate no new warnings or errors.
- [ ] I have added tests that prove my fix is effective or that my feature works.
- [ ] The body-size guard is enforced before JSON parsing, and oversized requests return the documented 413 response.
- [ ] New and existing unit tests pass locally with my changes.
