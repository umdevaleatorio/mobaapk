# Proposta: CI/CD - Integração Contínua

## Problema
Item #13 da auditoria: sem pipelines de CI/CD, sem validação automatizada de PRs.

## Solução
Dois workflows GitHub Actions:
1. `ci-cliente.yml` — testa app cliente (jest)
2. `ci-admin.yml` — testa app admin (jest)

## Integrações
- GitHub Actions
- Jest (test runner)
