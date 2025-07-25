# Guia de Contribuição

Obrigado por considerar contribuir para o projeto Winthor API WTA! Este documento fornece diretrizes para contribuições.

## 🚀 Como Contribuir

### 1. Configuração do Ambiente

1. Faça um fork do repositório
2. Clone seu fork localmente:
   ```bash
   git clone https://github.com/jtairone/winthor-api-wta.git
   cd winthor-api-wta
   ```
3. Instale as dependências:
   ```bash
   npm install
   ```

### 2. Desenvolvimento

1. Crie uma branch para sua feature:
   ```bash
   git checkout -b feature/nova-funcionalidade
   ```

2. Faça suas alterações seguindo as diretrizes de código

3. Execute os testes:
   ```bash
   npm test
   ```

4. Verifique a qualidade do código:
   ```bash
   npm run lint
   npm run format
   ```

### 3. Padrões de Código

#### JavaScript/Node.js
- Use ES6+ features quando possível
- Siga as regras do ESLint configuradas
- Use JSDoc para documentar funções públicas
- Mantenha funções pequenas e focadas
- Use nomes descritivos para variáveis e funções

#### Testes
- Escreva testes para todas as novas funcionalidades
- Mantenha cobertura de testes acima de 80%
- Use descrições claras para os testes
- Teste casos de sucesso e erro

#### Documentação
- Atualize o README.md quando necessário
- Documente novas funcionalidades
- Mantenha exemplos atualizados
- Atualize o CHANGELOG.md

### 4. Estrutura do Projeto

```
winthor-api-wta/
├── lib/                    # Código fonte principal
│   ├── index.js           # Classe principal WinthorWTA
│   └── utils.js           # Utilitários e classes auxiliares
├── test/                  # Testes unitários
├── examples/              # Exemplos de uso
├── types.d.ts            # Definições TypeScript
├── package.json          # Dependências e scripts
├── README.md             # Documentação principal
├── CHANGELOG.md          # Histórico de mudanças
└── CONTRIBUTING.md       # Este arquivo
```

### 5. Processo de Pull Request

1. Certifique-se de que todos os testes passam
2. Verifique se o código está formatado corretamente
3. Atualize a documentação se necessário
4. Crie um Pull Request com:
   - Descrição clara das mudanças
   - Referência a issues relacionadas
   - Screenshots (se aplicável)

### 6. Tipos de Contribuições

#### 🐛 Bug Fixes
- Descreva o bug claramente
- Inclua passos para reproduzir
- Teste a correção

#### ✨ Novas Funcionalidades
- Discuta a funcionalidade antes de implementar
- Mantenha compatibilidade com versões anteriores
- Adicione testes adequados

#### 📚 Melhorias na Documentação
- Corrija erros de gramática
- Adicione exemplos úteis
- Melhore a clareza

#### 🔧 Melhorias de Código
- Refatoração para melhor legibilidade
- Otimizações de performance
- Melhorias na arquitetura

### 7. Diretrizes de Commit

Use mensagens de commit semânticas:

```
feat: adiciona nova funcionalidade de busca
fix: corrige erro na validação de parâmetros
docs: atualiza documentação da API
test: adiciona testes para método cliente
refactor: refatora processamento de parâmetros
style: formata código conforme padrões
chore: atualiza dependências
```

### 8. Código de Conduta

- Seja respeitoso e inclusivo
- Mantenha discussões construtivas
- Ajude outros contribuidores
- Reporte problemas de forma profissional

### 9. Suporte

Se você tiver dúvidas ou precisar de ajuda:

1. Verifique a documentação existente
2. Procure por issues similares
3. Abra uma nova issue se necessário
4. Entre em contato com os mantenedores

## 🎯 Próximos Passos

Algumas áreas que precisam de contribuições:

- [ ] Implementar retry automático para requisições
- [ ] Adicionar suporte a rate limiting
- [ ] Melhorar logging estruturado
- [ ] Adicionar mais testes de integração
- [ ] Implementar cache de tokens
- [ ] Adicionar suporte a TypeScript nativo

Obrigado por contribuir! 🚀 