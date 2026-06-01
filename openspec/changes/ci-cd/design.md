# Design: CI/CD - Workflows

## ci-cliente.yml
- Trigger: push + pull_request na main
- Node 20, ubuntu-latest
- `npm ci` → `npm test` (jest) em agropet-cliente

## ci-admin.yml
- Trigger: push + pull_request na main
- Node 20, ubuntu-latest
- `npm ci` → `npm test` (jest) em agropet-admin
