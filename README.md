# winthor-api-wta  

**Cliente Node.js para integração com a API WTA do ERP Winthor**  

[![npm version](https://img.shields.io/npm/v/winthor-wta-api)](https://www.npmjs.com/package/winthor-wta-api)  
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)  

Biblioteca para conexão e consumo da API WTA do Winthor (TOTVS), facilitando operações como consulta de clientes, produtos, pedidos e outros recursos.  

---

## 📦 Instalação  

```bash
npm install winthor-api-wta
# ou
yarn add winthor-api-wta
```

## 🚀 Utilização

Configuração Inicial
Configure suas credenciais (recomendado usar variáveis de ambiente ou arquivos de configuração como .env):
```javascript
const Wint = require('winthor-api-wta');

const config = {
  host: 'https://seu-servidor-winthor.com',
  login: 'usuario',
  senha: 'senha'
};

const wta = new Wint(config);
```
## Exemplo com Promises (.then())
```javascript
wta.conectar()
  .then(() => wta.cliente({ codigocliente: 22940 }))
  .then(cliente => console.log('Dados do cliente:', cliente))
  .catch(err => console.error('Erro:', err));
  ```
  ## Exemplo com Async/Await (Recomendado)
  ```javascript
  async function buscarCliente(id) {
  try {
    await wta.conectar();
    const cliente = await wta.cliente({ codigocliente: id });
    console.log(cliente);
    return cliente;
  } catch (error) {
    console.error('Falha na requisição:', error);
    throw error;
  }
}

buscarCliente(22);
```

## 📚 Métodos Disponíveis
## `conectar()`
**Descrição:**  
Autentica na API WTA.  
**Parâmetros:**  
Nenhum  

---

## `cliente()`
**Descrição:**  
Retorna dados completos de um cliente, incluindo endereço de entrega quando solicitado.  

**Parâmetros:**  
```typescript
{
  codigocliente: number    // Código do cliente (obrigatório)
  enderecoEntrega: boolean // Retorna endereço se true (opcional)
}
```
## `filiais()`
**Descrição:**  
Retorna dados da(s) Filial.  

**Parâmetros:**  
```typescript
{
  codigofilial: number    // Código da filial (opcional)
}
```
## `estoque()`
**Descrição:**  
Retorna Estoque do produto e filial informados.  

**Parâmetros:**  
```typescript
{
  codigofilial: number    // Código da filial (Obrigatório)
  codigoproduto: number    // Código da produto (Obrigatório)
}
```
## `preco()`
**Descrição:**  
Retorna Preço do produto na filial informados.  

**Parâmetros:**  
```typescript
{
  codigofilial: number    // Código da filial (Obrigatório)
  codigoproduto: number    // Código da produto (Obrigatório)
  precoporembalagem: boolean  // Calcula o preço pelo fator de embalagem ou não (opcional)
}
```
## `buscaXml()`
**Descrição:**  
Retorna XML em formato String ou Base64.  

**Parâmetros:**  
```typescript
{
  numeropedido: number    // Número Pedido de Venda (Obrigatório)
  numerotransacao: number    // Número Transação Venda (Obrigatório)
  retornabase64: boolean  // Retorna String *padrão ou Base64 se informado true (opcional)
}
```
**Só precisa informar o número do pedido ou número da transação de venda não precisa informar os dois!

## 🔒 Boas Práticas
Nunca armazene credenciais no código:
Use arquivos .env (com dotenv).

Exemplo com .env:
```ini
WTA_HOST=https://servidor-winthor.com
WTA_LOGIN=usuario
WTA_SENHA=senha
```
```javascript
require('dotenv').config();
const config = {
  host: process.env.WTA_HOST,
  login: process.env.WTA_LOGIN,
  senha: process.env.WTA_SENHA
};
```
Opção 2: Usando config (ideal para ambientes múltiplos)
```json
// config/default.json
{
  "wta": {
    "host": "https://servidor-winthor.com",
    "login": "usuario_api",
    "senha": "senha_ultra_secreta"
  }
}
```
```javascript
// config/production.json (sobrescreve default.json em produção)
{
  "wta": {
    "host": "https://winthor-prod.totvs.com"
  }
}
```
```javascript
// Uso no código
const config = require('config');

const wta = new Wint({
  host: config.get('wta.host'),
  login: config.get('wta.login'),
  senha: config.get('wta.senha')
});
```
## ⚠️ Importante:

Adicione .env e /config/*.json no seu .gitignore

## Tratamento de Erros:
Sempre capture erros com try/catch ou .catch() para evitar falhas silenciosas.

## 📚 Recursos Úteis
* 🏢 [Documentação Oficial API Integrações Winthor](https://tdn.totvs.com/pages/releaseview.action?pageId=573185595)
* 🐙 [Meu GitHub](https://github.com/jtairone)
* 🖥️ [Portfólio](http://portfolio.moraiscasa.dev.br/)

### ***Obs.: Instale ou atualize os serviços no WTA (801)***  
* winthor-pedido-venda
*  winthor-estoque-vtex 
* winthor-compras-produto
## 📜 Licença

[![Licença Livre](https://img.shields.io/badge/license-Public_Domain-blue)]()

Este projeto não possui licença restritiva - sinta-se livre para:
- Usar em projetos comerciais
- Modificar e redistribuir
- Incorporar em outros sistemas

*(Sugira novos métodos em Issues!)*
