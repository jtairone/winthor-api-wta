const axios = require('axios');
const { createHash } = require('crypto');
const { Cliente } = require('./utils');

class WinthorWTA {
  constructor(host, login, senha) {
    // Se o primeiro parâmetro for um objeto, extrai as propriedades dele
    if (typeof host === 'object' && host !== null) {
      ({ host, login, senha } = host);
    }
    if (!host || !login || !senha) {
      throw new Error('Host, login e senha são obrigatórios');
    }

    // Remove barras finais do host se existirem
    this.host = host.replace(/\/+$/, '');
    this.login = login;
    this.senha = senha;
    this.accessToken = null;
    this.httpClient = axios.create({
      baseURL: this.host,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

  /**
   * Converte a senha para MD5 e depois para maiúsculas
   * @param {string} senha 
   * @returns {string}
   */
  _encryptPassword(senha) {
    const md5 = createHash('md5').update(senha.toUpperCase()).digest('hex');
    return md5.toUpperCase();
  }

  /**
   * Realiza a autenticação na API
   * @returns {Promise<string>} accessToken
   */
  async conectar() {
    try {
      const senhaMd5 = this._encryptPassword(this.senha);
      
      const response = await this.httpClient.post('/winthor/autenticacao/v1/login', {
        login: this.login,
        senha: senhaMd5
      });

      if (response.status === 200 && response.data.accessToken) {
        this.accessToken = response.data.accessToken;
        
        // Atualiza o httpClient com o token de acesso
        this.httpClient = axios.create({
          baseURL: this.host,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`
          }
        });
        
        return this.accessToken;
      } else {
        throw new Error('Falha na autenticação: resposta inesperada da API');
      }
    } catch (error) {
      //console.log(error)
      if (error.response) {
        throw new Error(`Erro na autenticação: ${error.response.status} - ${error.response.data.message}`);
      } else {
        throw new Error(`Erro na conexão: ${error.message}`);
      }
    }
  }

  /**
   * Realiza a desconexão na API
   */
  async desconectar() {
    try {
      const response = await this.httpClient.get('/winthor/autenticacao/v1/logout');

      if (response.status === 200) {
        // Atualiza o httpClient sem o token de acesso
        this.httpClient = axios.create({
          baseURL: this.host,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        return;
      } else {
        throw new Error('Falha na autenticação: resposta inesperada da API');
      }
    } catch (error) {
      if (error.response) {
        throw new Error(`Erro na autenticação: ${error.response.status} - ${error.response.data.message}`);
      } else {
        throw new Error(`Erro na conexão: ${error.message}`);
      }
    }
  }


  /**
   * Lista Filiais com o parâmetro opcional
   * @param {Object} params - Parâmetros de filtro
   * @param {string} [params.codigofilial] - Código do filial deseja buscar (ex: '1') (obrigatório)
   * @returns {Promise<Array>} Lista de Estoque produto
   * @example
   * // Exemplo de uso:
   * await wta.filiais({
   *   codigofilial: '1'
   * });
   */
    async filiais(params = {}) {
      // Mapeamento de parâmetros (português -> inglês)
      const paramMap = {
        'codigofilial': 'id',
      };

      if (!this.accessToken) {
        throw new Error('Não autenticado. Chame o método conectar() primeiro.');
      }
      
    try {
      // Processa os parâmetros
      const processedParams = {};
      for (const [key, value] of Object.entries(params)) {
        // Verifica se é um parâmetro em português e traduz
        const paramKey = paramMap[key] || key;
        
        // Converte valores booleanos para string
        processedParams[paramKey] = typeof value === 'boolean' ? value.toString() : value;
      }

      // Cria a query string sem codificar vírgulas
      const queryString = Object.entries(processedParams)
        .map(([key, val]) => `${key}=${val}`)
        .join('&')
        .replace(/%2C/g, ','); // Decodifica vírgulas especificamente
      
      // Usa os parâmetros processados na query string
      //const queryString = qs.stringify(processedParams);
      const url = `/api/branch/v1/${queryString ? `?${queryString}` : ''}`;
            
      const response = await this.httpClient.get(url);
      return response.data;
    } catch (error) {
      if (error.response) {
        const mensagem = error.response.data.detailedMessage 
        ? `Erro ao buscar cliente: ${error.response.status} - ${error.response.data.message} - Detalhe: ${error.response.data.detailedMessage} `
        : `Erro ao buscar cliente: ${error.response.status} - ${error.response.data.message}`
        throw new Error(mensagem);
      }
      throw new Error(`Erro na requisição: ${error.message}`);
    }
  }

    /**
   * Lista clientes com os parâmetros opcionais
   * @param {Object} params - Parâmetros de filtro
   * @param {boolean} [params.enderecoEntrega] - Retornar endereços de entrega? (true/false)
   * @param {string} [params.filiais] - Códigos de filiais separados por vírgula (ex: '1,2,3')
   * @param {'S'|'N'} [params.consumidorFinal] - 'S' para consumidor final, 'N' para não consumidor
   * @param {'J'|'F'} [params.tipoPessoa] - 'J' para pessoa jurídica, 'F' para física
   * @param {string} [params.cpfCnpj] - CPF ou CNPJ do cliente
   * @returns {Promise<Array>} Lista de clientes
   * @example
   * // Exemplo de uso:
   * await wta.clientes({
   *   enderecoEntrega: true,
   *   filiais: '1,3',
   *   tipoPessoa: 'J'
   * });
   */
    async clientes(params = {}) {
      // Mapeamento de parâmetros (português -> inglês)
      const paramMap = {
        'enderecoEntrega': 'withDeliveryAddress',
        'filiais': 'branchId',
        'consumidorFinal': 'finalCostumer',
        'tipoPessoa': 'personalType',
        'cpfCnpj': 'personIdentificationNumber'
      };

      if (!this.accessToken) {
        throw new Error('Não autenticado. Chame o método conectar() primeiro.');
      }
      // Validação dos parâmetros
      if (params.tipoPessoa && !['J', 'F'].includes(params.tipoPessoa)) {
        throw new Error('tipoPessoa deve ser "J" (Jurídica) ou "F" (Física)');
      }

      if (params.consumidorFinal && !['S', 'N'].includes(params.consumidorFinal)) {
        throw new Error('consumidorFinal deve ser "S" (Sim) ou "N" (Não)');
      }

    try {
      // Processa os parâmetros
      const processedParams = {};
      for (const [key, value] of Object.entries(params)) {
        // Verifica se é um parâmetro em português e traduz
        const paramKey = paramMap[key] || key;
        
        // Converte valores booleanos para string
        processedParams[paramKey] = typeof value === 'boolean' ? value.toString() : value;
      }

      // Cria a query string sem codificar vírgulas
      const queryString = Object.entries(processedParams)
        .map(([key, val]) => `${key}=${val}`)
        .join('&')
        .replace(/%2C/g, ','); // Decodifica vírgulas especificamente
      
      // DEBUG: Mostra os parâmetros processados
      //console.log('Parâmetros processados:', processedParams);
      
      // Usa os parâmetros processados na query string
      //const queryString = qs.stringify(processedParams);
      const url = `/api/wholesale/v1/customer/list${queryString ? `?${queryString}` : ''}`;
      
      // DEBUG: Mostra queryString
      //console.log('queryStrings:', queryString);

      // DEBUG: Mostra a URL final
      //console.log('URL chamada:', url);
      
      const response = await this.httpClient.get(url);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`Erro ao buscar clientes: ${error.response.status} - ${error.response.data}`);
      }
      throw new Error(`Erro na requisição: ${error.message}`);
    }
  }

  /**
   * Lista cliente com os parâmetros opcionais
   * @param {Object} params - Parâmetros de filtro
   * @param {string} [params.codigocliente] - Código do cliente deseja buscar (ex: '1020') (obrigatório)
   * @param {boolean} [params.enderecoEntrega] - Retornar endereços de entrega? (true/false)
   * @returns {Promise<Array>} Lista de cliente
   * @example
   * // Exemplo de uso:
   * await wta.cliente({
   *   codigocliente: '1020'
   *   enderecoEntrega: true,
   * });
   */
    async cliente(params = {}) {
      // Mapeamento de parâmetros (português -> inglês)
      const paramMap = {
        'enderecoEntrega': 'withDeliveryAddress',
        'codigocliente': 'customerId',
      };

      if (!this.accessToken) {
        throw new Error('Não autenticado. Chame o método conectar() primeiro.');
      }
      if(!params.codigocliente){
        throw new Error('Parâmetro codigocliente é Obrigatório.'); 
      }

    try {
      // Processa os parâmetros
      const processedParams = {};
      for (const [key, value] of Object.entries(params)) {
        // Verifica se é um parâmetro em português e traduz
        const paramKey = paramMap[key] || key;
        
        // Converte valores booleanos para string
        processedParams[paramKey] = typeof value === 'boolean' ? value.toString() : value;
      }

      // Cria a query string sem codificar vírgulas
      const queryString = Object.entries(processedParams)
        .map(([key, val]) => `${key}=${val}`)
        .join('&')
        .replace(/%2C/g, ','); // Decodifica vírgulas especificamente
      
      // Usa os parâmetros processados na query string
      //const queryString = qs.stringify(processedParams);
      const url = `/api/wholesale/v1/customer/${queryString ? `?${queryString}` : ''}`;
            
      const response = await this.httpClient.get(url);
      return response.data;
    } catch (error) {
      if (error.response) {
        const mensagem = error.response.data.detailedMessage 
        ? `Erro ao buscar cliente: ${error.response.status} - ${error.response.data.message} - Detalhe: ${error.response.data.detailedMessage} `
        : `Erro ao buscar cliente: ${error.response.status} - ${error.response.data.message}`
        throw new Error(mensagem);
      }
      throw new Error(`Erro na requisição: ${error.message}`);
    }
  }

  /**
   * Lista Estoque Produtos com os parâmetros opcionais
   * @param {Object} params - Parâmetros de filtro
   * @param {string} [params.codigofilial] - Código do filial deseja buscar (ex: '1') (obrigatório)
   * @param {string} [params.codigoproduto] - Código do produto
   * @returns {Promise<Array>} Lista de Estoque produto
   * @example
   * // Exemplo de uso:
   * await wta.estoque({
   *   codigofilial: '1'
   *   codigoproduto: 30,
   * });
   */
    async estoque(params = {}) {
      // Mapeamento de parâmetros (português -> inglês)
      const paramMap = {
        'codigofilial': 'branchId',
        'codigoproduto': 'productId',
      };
        if (!this.accessToken) {
          throw new Error('Não autenticado. Chame o método conectar() primeiro.');
        }
        if(!params.codigofilial && !params.branchId){
          throw new Error('Parâmetro codigofilial é Obrigatório.'); 
        }
      try {
        // Processa os parâmetros
        const processedParams = {};
        for (const [key, value] of Object.entries(params)) {
          // Verifica se é um parâmetro em português e traduz
          const paramKey = paramMap[key] || key;
          
          // Converte valores booleanos para string
          processedParams[paramKey] = typeof value === 'boolean' ? value.toString() : value;
        }
        
        
      // Cria a query string sem codificar vírgulas
      const queryString = Object.entries(processedParams)
        .map(([key, val]) => `${key}=${val}`)
        .join('&')
        .replace(/%2C/g, ','); // Decodifica vírgulas especificamente
      
      // Usa os parâmetros processados na query string
      //const queryString = qs.stringify(processedParams);
      const url = `api/stock-vtex/v1/available/list${queryString ? `?${queryString}` : ''}`;
            
      const response = await this.httpClient.get(url);
      return response.data;
    } catch (error) {
      if (error.response) {
        const mensagem = error.response.data.detailedMessage 
        ? `Erro ao buscar cliente: ${error.response.status} - ${error.response.data.message} - Detalhe: ${error.response.data.detailedMessage} `
        : `Erro ao buscar cliente: ${error.response.status} - ${error.response.data.message}`
        throw new Error(mensagem);
      }
      throw new Error(`Erro na requisição: ${error.message}`);
    }
  }

  /**
   * Lista Preço Produto com os parâmetros opcionais
   * @param {Object} params - Parâmetros de filtro
   * @param {string} [params.codigofilial] - Código do filial deseja buscar (ex: '1') (obrigatório)
   * @param {string} [params.codigoproduto] - Retornar endereços de entrega? (true/false)
   * @param {string} [params.precoporembalagem] - Retornar o preço dividindo peloi fator conversão da embalagem? (true/false)
   * @returns {Promise<Array>} Lista de Estoque produto
   * @example
   * // Exemplo de uso:
   * await wta.estoque({
   *   codigofilial: '1'
   *   codigoproduto: 30,
   * });
   */
    async preco(params = {}) {
      // Mapeamento de parâmetros (português -> inglês)
      const paramMap = {
        'codigofilial': 'branchId',
        'codigoproduto': 'productId',
        'precoporembalagem': 'useMultiplePricesPerProductPackage',
      };

      if (!this.accessToken) {
        throw new Error('Não autenticado. Chame o método conectar() primeiro.');
      }
      if(!params.codigofilial){
        throw new Error('Parâmetro codigofilial é Obrigatório.'); 
      }
      if(!params.codigoproduto){
        throw new Error('Parâmetro codigoproduto é Obrigatório.'); 
      }

    try {
      // Processa os parâmetros
      const processedParams = {};
      for (const [key, value] of Object.entries(params)) {
        // Verifica se é um parâmetro em português e traduz
        const paramKey = paramMap[key] || key;
        
        // Converte valores booleanos para string
        processedParams[paramKey] = typeof value === 'boolean' ? value.toString() : value;
      }

      // Cria a query string sem codificar vírgulas
      const queryString = Object.entries(processedParams)
        .map(([key, val]) => `${key}=${val}`)
        .join('&')
        .replace(/%2C/g, ','); // Decodifica vírgulas especificamente
      
      // Usa os parâmetros processados na query string
      //const queryString = qs.stringify(processedParams);
      const url = `/api/wholesale/v1/price/list${queryString ? `?${queryString}` : ''}`;
            
      const response = await this.httpClient.get(url);
      return response.data;
    } catch (error) {
      if (error.response) {
        const mensagem = error.response.data.detailedMessage 
        ? `Erro ao buscar cliente: ${error.response.status} - ${error.response.data.message} - Detalhe: ${error.response.data.detailedMessage} `
        : `Erro ao buscar cliente: ${error.response.status} - ${error.response.data.message}`
        throw new Error(mensagem);
      }
      throw new Error(`Erro na requisição: ${error.message}`);
    }
  }

  /**
   * Busca o XML de uma Nota Fisacl com parâmetros
   * @param {Object} params - Parâmetros de filtro
   * @param {string} [params.numeropedido] - Número do pedido de venda (ex: '1001001')
   * @param {string} [params.numerotransacao] - Número da transação de venda
   * @param {string} [params.retornabase64] - Parametro caso queria retorna base64 no lugar string (true/fase) *default false
   * @returns {Promise<Array>} Lista de Estoque produto
   * @example
   * // Exemplo de uso:
   * await wta.buscaXml({
   *   numeropedido: '1001011'
   * });
   */
  async buscaXml(params = {}) {
      // Mapeamento de parâmetros (português -> inglês)
      const paramMap = {
        'numeropedido': 'orderId',
        'numerotransacao': 'transactionId',
        'retornabase64': 'returnBase64'
      };

      if (!this.accessToken) {
        throw new Error('Não autenticado. Chame o método conectar() primeiro.');
      }
      if(!params.numeropedido && !params.numerotransacao ){
        throw new Error('Parâmetro numeropedido ou numerotransacao um dos dois é Obrigatório.'); 
      }

    try {
      // Processa os parâmetros
      const processedParams = {};
      for (const [key, value] of Object.entries(params)) {
        // Verifica se é um parâmetro em português e traduz
        const paramKey = paramMap[key] || key;
        
        // Converte valores booleanos para string
        processedParams[paramKey] = typeof value === 'boolean' ? value.toString() : value;
      }

      // Cria a query string sem codificar vírgulas
      const queryString = Object.entries(processedParams)
        .map(([key, val]) => `${key}=${val}`)
        .join('&')
        .replace(/%2C/g, ','); // Decodifica vírgulas especificamente
      
      // Usa os parâmetros processados na query string
      //const queryString = qs.stringify(processedParams);
      const url = `/winthor/fiscal/v1/documentosfiscais/nfe/invoiceDocument${queryString ? `?${queryString}` : ''}`;
            
      const response = await this.httpClient.get(url);
      return response.data;
    } catch (error) {
      if (error.response) {
        const mensagem = error.response.data.detailedMessage 
        ? `Erro ao buscar cliente: ${error.response.status} - ${error.response.data.message} - Detalhe: ${error.response.data.detailedMessage} `
        : `Erro ao buscar cliente: ${error.response.status} - ${error.response.data.message}`
        throw new Error(mensagem);
      }
      throw new Error(`Erro na requisição: ${error.message}`);
    }
  }

  /**
   * Cadatrar ou Atualizar Cliente com parâmetros
   * @param {Object} params - Parâmetros de filtro
   * @param {string} [params.CODATIVIDADE] - Ramo de Atividade do Cliente (ex: '1')
   * @param {string} [params.CNPJ] - CNPJ/CPF do Cliente (ex: '12345678901234')
   * @param {string} [params.INSCRICAOESTADUAL] - Inscrição Estadual do Cliente (ex: '1234567890')
   * @returns {Promise<Array>} Lista de Estoque produto
   * @example
   * // Exemplo de uso:
   * await wta.cadastrarAtualizarCliente({
   *   CNPJ: '12345678901234'
   * });
   */
  async cadastrarAtualizarCliente(params = {}) {
      if (!this.accessToken) {
        throw new Error('Não autenticado. Chame o método conectar() primeiro.');
      }
      if(Object.keys(params).length === 0 ){
        throw new Error('Existe parametros Obrigatório.'); 
      }
    try {
      const cliente = new Cliente(params);
      // DEBUG: Mostra o cliente que será enviado
      console.log('Cliente a ser cadastrado/atualizado:', cliente);

      const url = `/api/wholesale/v1/customer/`;
            
      const response = await this.httpClient.post(url, cliente);
      return response.data;
    } catch (error) {
      if (error.response) {
        const mensagem = error.response.data.detailedMessage 
        ? `Erro ao buscar cliente: ${error.response.status} - ${error.response.data.message} - Detalhe: ${error.response.data.detailedMessage} `
        : `Erro ao buscar cliente: ${error.response.status} - ${error.response.data.message}`
        throw new Error(mensagem);
      }
      throw new Error(`Erro na requisição: ${error.message}`);
    }
  }
  // Outros métodos da API podem ser adicionados aqui...
}

module.exports = WinthorWTA;