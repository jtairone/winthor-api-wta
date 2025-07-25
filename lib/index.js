const axios = require('axios');
const { createHash } = require('crypto');
const { Cliente } = require('./utils');
//assim cria o construtor vai criar a senha MD5 e o htttpclient (requisição obter token no login)
class WinthorWTA {
  constructor (host, login, senha) {
    // Se o primeiro parâmetro for um objeto, extrai as propriedades dele
    if (typeof host === 'object' && host !== null) {
      ({ host, login, senha } = host);
    }

    this._validateConstructorParams(host, login, senha);

    // Remove barras finais do host se existirem
    this.host = host.replace(/\/+$/, '');
    this.login = login;
    this.senha = senha;
    this.accessToken = null;
    this.httpClient = this._createHttpClient();
  }

  /**
   * Valida os parâmetros do construtor
   * @private
   */
  _validateConstructorParams (host, login, senha) {
    if (!host || !login || !senha) {
      throw new Error('Host, login e senha são obrigatórios');
    }

    if (typeof host !== 'string' || typeof login !== 'string' || typeof senha !== 'string') {
      throw new Error('Host, login e senha devem ser strings');
    }
  }

  /**
   * Cria o cliente HTTP com configurações padrão
   * @private
   */
  _createHttpClient (headers = {}) {
    return axios.create({
      baseURL: this.host,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      timeout: 30000, // 30 segundos
      validateStatus: (status) => status < 500, // Aceita apenas status < 500
    });
  }

  /**
   * Converte a senha para MD5 e depois para maiúsculas
   * @param {string} senha
   * @returns {string}
   */
  _encryptPassword (senha) {
    const md5 = createHash('md5').update(senha.toUpperCase()).digest('hex');
    return md5.toUpperCase();
  }

  /**
   * Processa parâmetros de consulta com mapeamento
   * @private
   */
  _processParams (params, paramMap) {
    const processedParams = {};

    for (const [key, value] of Object.entries(params)) {
      const paramKey = paramMap[key] || key;
      processedParams[paramKey] = typeof value === 'boolean' ? value.toString() : value;
    }

    return processedParams;
  }

  /**
   * Cria query string a partir de parâmetros
   * @private
   */
  _buildQueryString (params) {
    return Object.entries(params)
      .map(([key, val]) => `${key}=${val}`)
      .join('&')
      .replace(/%2C/g, ',');
  }

  /**
   * Valida se está autenticado
   * @private
   */
  _validateAuthentication () {
    if (!this.accessToken) {
      throw new Error('Não autenticado. Chame o método conectar() primeiro.');
    }
  }

  /**
   * Trata erros de resposta da API
   * @private
   */
  _handleApiError (error, operation) {
    if (error.response) {
      const { status, data } = error.response;
      const message = data.detailedMessage
        ? `${operation}: ${status} - ${data.message} - Detalhe: ${data.detailedMessage}`
        : `${operation}: ${status} - ${data.message}`;
      throw new Error(message);
    }
    throw new Error(`Erro na requisição: ${error.message}`);
  }

  /**
   * Realiza a autenticação na API
   * @returns {Promise<string>} accessToken
   */
  async conectar () {
    try {
      const senhaMd5 = this._encryptPassword(this.senha);

      const response = await this.httpClient.post('/winthor/autenticacao/v1/login', {
        login: this.login,
        senha: senhaMd5,
      });

      if (response.status === 200 && response.data.accessToken) {
        this.accessToken = response.data.accessToken;

        // Atualiza o httpClient com o token de acesso
        this.httpClient = this._createHttpClient({
          'Authorization': `Bearer ${this.accessToken}`,
        });

        return this.accessToken;
      } else {
        throw new Error('Falha na autenticação: resposta inesperada da API');
      }
    } catch (error) {
      this._handleApiError(error, 'Erro na autenticação');
    }
  }

  /**
   * Realiza a desconexão na API
   */
  async desconectar () {
    try {
      this._validateAuthentication();

      const response = await this.httpClient.get('/winthor/autenticacao/v1/logout');

      if (response.status === 200) {
        // Atualiza o httpClient sem o token de acesso
        this.httpClient = this._createHttpClient();
        this.accessToken = null;

      } else {
        throw new Error('Falha na desconexão: resposta inesperada da API');
      }
    } catch (error) {
      this._handleApiError(error, 'Erro na desconexão');
    }
  }

  /**
   * Lista Filiais com o parâmetro opcional
   * @param {Object} params - Parâmetros de filtro
   * @param {string} [params.codigofilial] - Código do filial deseja buscar (ex: '1')
   * @returns {Promise<Array>} Lista de Filiais
   */
  async filiais (params = {}) {
    this._validateAuthentication();

    const paramMap = {
      'codigofilial': 'id',
    };

    try {
      const processedParams = this._processParams(params, paramMap);
      const queryString = this._buildQueryString(processedParams);
      const url = `/api/branch/v1/${queryString ? `?${queryString}` : ''}`;

      const response = await this.httpClient.get(url);
      return response.data;
    } catch (error) {
      this._handleApiError(error, 'Erro ao buscar filiais');
    }
  }

  /**
   * Lista clientes com os parâmetros opcionais
   * @param {Object} params - Parâmetros de filtro
   * @param {boolean} [params.enderecoEntrega] - Retornar endereços de entrega?
   * @param {string} [params.filiais] - Códigos de filiais separados por vírgula
   * @param {'S'|'N'} [params.consumidorFinal] - 'S' para consumidor final, 'N' para não consumidor
   * @param {'J'|'F'} [params.tipoPessoa] - 'J' para pessoa jurídica, 'F' para física
   * @param {string} [params.cpfCnpj] - CPF ou CNPJ do cliente
   * @returns {Promise<Array>} Lista de clientes
   */
  async clientes (params = {}) {
    this._validateAuthentication();

    const paramMap = {
      'enderecoEntrega': 'withDeliveryAddress',
      'filiais': 'branchId',
      'consumidorFinal': 'finalCostumer',
      'tipoPessoa': 'personalType',
      'cpfCnpj': 'personIdentificationNumber',
    };

    // Validação dos parâmetros
    this._validateClienteParams(params);

    try {
      const processedParams = this._processParams(params, paramMap);
      const queryString = this._buildQueryString(processedParams);
      const url = `/api/wholesale/v1/customer/list${queryString ? `?${queryString}` : ''}`;

      const response = await this.httpClient.get(url);
      return response.data;
    } catch (error) {
      this._handleApiError(error, 'Erro ao buscar clientes');
    }
  }

  /**
   * Valida parâmetros específicos de clientes
   * @private
   */
  _validateClienteParams (params) {
    if (params.tipoPessoa && !['J', 'F'].includes(params.tipoPessoa)) {
      throw new Error('tipoPessoa deve ser "J" (Jurídica) ou "F" (Física)');
    }

    if (params.consumidorFinal && !['S', 'N'].includes(params.consumidorFinal)) {
      throw new Error('consumidorFinal deve ser "S" (Sim) ou "N" (Não)');
    }
  }

  /**
   * Lista cliente específico
   * @param {Object} params - Parâmetros de filtro
   * @param {string} params.codigocliente - Código do cliente (obrigatório)
   * @param {boolean} [params.enderecoEntrega] - Retornar endereços de entrega?
   * @returns {Promise<Object>} Dados do cliente
   */
  async cliente (params = {}) {
    this._validateAuthentication();

    if (!params.codigocliente) {
      throw new Error('Parâmetro codigocliente é obrigatório.');
    }

    const paramMap = {
      'enderecoEntrega': 'withDeliveryAddress',
      'codigocliente': 'customerId',
    };

    try {
      const processedParams = this._processParams(params, paramMap);
      const queryString = this._buildQueryString(processedParams);
      const url = `/api/wholesale/v1/customer/${queryString ? `?${queryString}` : ''}`;

      const response = await this.httpClient.get(url);
      return response.data;
    } catch (error) {
      this._handleApiError(error, 'Erro ao buscar cliente');
    }
  }

  /**
   * Lista Estoque de Produtos
   * @param {Object} params - Parâmetros de filtro
   * @param {string} params.codigofilial - Código do filial (obrigatório)
   * @param {string} [params.codigoproduto] - Código do produto
   * @returns {Promise<Array>} Lista de Estoque produto
   */
  async estoque (params = {}) {
    this._validateAuthentication();

    if (!params.codigofilial && !params.branchId) {
      throw new Error('Parâmetro codigofilial é obrigatório.');
    }

    const paramMap = {
      'codigofilial': 'branchId',
      'codigoproduto': 'productId',
    };

    try {
      const processedParams = this._processParams(params, paramMap);
      const queryString = this._buildQueryString(processedParams);
      const url = `/api/stock-vtex/v1/available/list${queryString ? `?${queryString}` : ''}`;

      const response = await this.httpClient.get(url);
      return response.data;
    } catch (error) {
      this._handleApiError(error, 'Erro ao buscar estoque');
    }
  }

  /**
   * Lista Preço de Produto
   * @param {Object} params - Parâmetros de filtro
   * @param {string} params.codigofilial - Código do filial (obrigatório)
   * @param {string} params.codigoproduto - Código do produto (obrigatório)
   * @param {boolean} [params.precoporembalagem] - Retornar o preço dividindo pelo fator conversão da embalagem?
   * @returns {Promise<Array>} Lista de Preços
   */
  async preco (params = {}) {
    this._validateAuthentication();

    if (!params.codigofilial) {
      throw new Error('Parâmetro codigofilial é obrigatório.');
    }
    if (!params.codigoproduto) {
      throw new Error('Parâmetro codigoproduto é obrigatório.');
    }

    const paramMap = {
      'codigofilial': 'branchId',
      'codigoproduto': 'productId',
      'precoporembalagem': 'useMultiplePricesPerProductPackage',
    };

    try {
      const processedParams = this._processParams(params, paramMap);
      const queryString = this._buildQueryString(processedParams);
      const url = `/api/wholesale/v1/price/list${queryString ? `?${queryString}` : ''}`;

      const response = await this.httpClient.get(url);
      return response.data;
    } catch (error) {
      this._handleApiError(error, 'Erro ao buscar preços');
    }
  }

  /**
   * Busca o XML de uma Nota Fiscal
   * @param {Object} params - Parâmetros de filtro
   * @param {string} [params.numeropedido] - Número do pedido de venda
   * @param {string} [params.numerotransacao] - Número da transação de venda
   * @param {boolean} [params.retornabase64] - Retornar em base64 (default: false)
   * @returns {Promise<Object>} XML da nota fiscal
   */
  async buscaXml (params = {}) {
    this._validateAuthentication();

    if (!params.numeropedido && !params.numerotransacao) {
      throw new Error('Parâmetro numeropedido ou numerotransacao é obrigatório.');
    }

    const paramMap = {
      'numeropedido': 'orderId',
      'numerotransacao': 'transactionId',
      'retornabase64': 'returnBase64',
    };

    try {
      const processedParams = this._processParams(params, paramMap);
      const queryString = this._buildQueryString(processedParams);
      const url = `/winthor/fiscal/v1/documentosfiscais/nfe/invoiceDocument${queryString ? `?${queryString}` : ''}`;

      const response = await this.httpClient.get(url);
      return response.data;
    } catch (error) {
      this._handleApiError(error, 'Erro ao buscar XML');
    }
  }
  /**
   * Cadastrar ou Atualizar Cliente com parâmetros
   * @description
   * - Se o CNPJ já existir na base, a função ATUALIZARÁ o cliente existente com os novos dados.
   * - Campos obrigatórios devem ser informados mesmo em atualizações.
   * @param {Object} params - Parâmetros de filtro
   * @param {number} params.CODIGOATIVIDADE - Código da atividade (Obrigatório)
   * @param {string} params.ENDERECOCOBRANCA - Endereço de cobrança (40 caracteres, Obrigatório)
   * @param {string} params.NUMEROCOBRANÇA - Número do endereço de cobrança (6 caracteres)
   * @param {string} params.BAIRROCOBRANCA - Bairro de cobrança (40 caracteres)
   * @param {string} params.CODCOB - Código de cobrança (4 caracteres)
   * @param {string} params.UFCOBRANCA - UF de cobrança (2 caracteres)
   * @param {string} params.CEPCOBRANCA - CEP de cobrança (9 caracteres, Obrigatório)
   * @param {string} params.BAIRROCOMERCIAL - Bairro comercial (40 caracteres, Obrigatório)
   * @param {string} params.ESTENT - Estado comercial (2 caracteres)
   * @param {number} params.CODIGOCIDADE - Código da cidade (Obrigatório)
   * @param {string} params.ENDERECOCOMERCIAL - Endereço comercial (40 caracteres, Obrigatório)
   * @param {string} params.NUMNEROCOMERCIAL - Número do endereço comercial (6 caracteres)
   * @param {string} params.CEPCOMERCIAL - CEP comercial (9 caracteres, Obrigatório)
   * @param {string} params.COMPLEMENTOCOBRANCA - Complemento do endereço de cobrança (80 caracteres)
   * @param {string} params.COMPLEMENTOCOMERCIAL - Complemento do endereço comercial (80 caracteres)
   * @param {string} params.COMPLEMENTOENTREGA - Complemento do endereço de entrega (80 caracteres)
   * @param {boolean} params.CONTRIBUINTE - Indica se é contribuinte
   * @param {boolean} params.TIPOPESSOA - Tipo de pessoa (Jurídica 'J' ou Física 'F')
   * @param {string} params.TELEFONECOMERCIAL - Telefone comercial (13 caracteres)
   * @param {string} params.TELEFONEENTREGA - Telefone para entrega (13 caracteres)
   * @param {string} params.TELEFONECOBRANCA - Telefone para cobrança (13 caracteres)
   * @param {number} params.CODIGOPAIS - Código do país (Default: 1058 - Brasil, Obrigatório)
   * @param {string} params.EMAIL - E-mail (100 caracteres, Obrigatório)
   * @param {string} params.EMAILNFE - E-mail para NFe (3500 caracteres)
   * @param {boolean} params.CONSUMIDORFINAL - Indica se é consumidor final
   * @param {string} params.NOMECLIENTE - Nome do cliente (60 caracteres, Obrigatório)
   * @param {number} params.CODIGOPLANOPAGAMENTO - Código do plano de pagamento
   * @param {string} params.CNPJ - CNPJ/CPF (18 caracteres, Obrigatório)
   * @param {number} params.CODIGOVENDEDOR - Código do vendedor (Obrigatório)
   * @param {number} params.CODIGOPRACA - Código da praça (Obrigatório)
   * @param {number} params.INSCRICAOESTADUAL - Inscrição estadual (Obrigatório) Caso não tenha, informar ISENTO
   * @param {boolean} params.CALCULAST - Indica cálculo de ST (Default: 'S')
   * @param {string} params.NOMEFANTASIA - Nome fantasia (40 caracteres)
   * @param {number} params.CODIGOREDE - Código da rede
   * @returns {Promise<Array>} Lista de Estoque produto
   * @example
   * // Exemplo de uso:
   * await wta.cadastrarAtualizarCliente({
   *   CNPJ: '12345678901234'
   * });
   */
  async cadastrarAtualizarCliente (params = {}) {
    this._validateAuthentication();

    if (Object.keys(params).length === 0) {
      throw new Error('Parâmetros são obrigatórios.');
    }

    try {
      const cliente = new Cliente(params);

      const url = '/api/wholesale/v1/customer/';
      const response = await this.httpClient.post(url, cliente);
      return response.data;
    } catch (error) {
      this._handleApiError(error, 'Erro ao cadastrar/atualizar cliente');
    }
  }
  // Outros métodos da API podem ser adicionados aqui...
}

module.exports = WinthorWTA;
