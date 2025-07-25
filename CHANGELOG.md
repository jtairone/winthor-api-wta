# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Configuração ESLint para qualidade de código
- Configuração Prettier para formatação consistente
- Validação de parâmetros do construtor
- Métodos privados para reutilização de código
- Timeout configurável para requisições HTTP
- Melhor tratamento de erros centralizado

### Changed
- Atualização do Axios para versão 1.6.0 (mais segura)
- Remoção da dependência desnecessária do crypto
- Refatoração do código para reduzir duplicação
- Melhoria na validação de autenticação

### Fixed
- Correção na validação de parâmetros obrigatórios
- Melhoria no tratamento de erros da API

## [1.0.0] - 2024-01-01

### Added
- Implementação inicial da biblioteca
- Métodos para autenticação (conectar/desconectar)
- Consulta de filiais
- Consulta de clientes
- Consulta de estoque
- Consulta de preços
- Busca de XML de notas fiscais
- Cadastro/atualização de clientes
- Suporte a parâmetros em português e inglês
- Validação de campos obrigatórios na classe Cliente
- Testes unitários básicos
- Documentação JSDoc 