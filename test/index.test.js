const WinthorWTA = require('../lib/index');
const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');

describe('WinthorWTA', () => {
  let mockAxios;
  const host = 'hostwta/';
  const login = 'usuario';
  const senha = 'suasenha';
  const encryptedPass = '6EE4EB2AC9D7B347D129E9CC1633D903'; // MD5 de 'suasenha' em maiúsculo
  const hostEsperado = 'hostwta'; // Host esperado sem barra no final

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('Constructor', () => {
    it('deve inicializar corretamente com host, login e senha', () => {
      const wta = new WinthorWTA(host, login, senha);
      expect(wta.host).toBe(hostEsperado);
      expect(wta.login).toBe(login);
      expect(wta.senha).toBe(senha);
      expect(wta.accessToken).toBeNull();
    });

    it('deve inicializar corretamente com objeto { host, login, senha}', () => {
      const wta = new WinthorWTA({ host, login, senha });
      expect(wta.host).toBe(hostEsperado);
      expect(wta.login).toBe(login);
      expect(wta.senha).toBe(senha);
    });

    it('deve remover barra do final do host caso exista', () => {
      const wta = new WinthorWTA(host, login, senha);
      expect(wta.host).toBe(hostEsperado);
    });

    it('deve lançar erro se algum parâmetro estiver faltando', () => {
      expect(() => new WinthorWTA()).toThrow('Host, login e senha são obrigatórios');
      expect(() => new WinthorWTA(host)).toThrow('Host, login e senha são obrigatórios');
      expect(() => new WinthorWTA(host, login)).toThrow('Host, login e senha são obrigatórios');
    });

    it('deve lançar erro se parâmetros não forem strings', () => {
      expect(() => new WinthorWTA(123, login, senha)).toThrow('Host, login e senha devem ser strings');
      expect(() => new WinthorWTA(host, 123, senha)).toThrow('Host, login e senha devem ser strings');
      expect(() => new WinthorWTA(host, login, 123)).toThrow('Host, login e senha devem ser strings');
    });
  });

  describe('_encryptPassword', () => {
    it('deve converter a senha para MD5 em maiúsculas', () => {
      const wta = new WinthorWTA(host, login, senha);
      const result = wta._encryptPassword(senha);
      expect(result).toBe(encryptedPass);
    });

    it('deve converter senha em maiúsculas antes de fazer MD5', () => {
      const wta = new WinthorWTA(host, login, senha);
      const result = wta._encryptPassword('TESTE');
      expect(result).toBe('99A29DC8105FD2FA39D8CDC04733938D');
    });
  });

  describe('conectar', () => {
    it('deve autenticar com sucesso e retornar token', async () => {
      const wta = new WinthorWTA(host, login, senha);
      const mockToken = 'mock-token-123';
      
      mockAxios.onPost('/winthor/autenticacao/v1/login', {
        login,
        senha: encryptedPass
      }).reply(200, {
        accessToken: mockToken
      });

      const token = await wta.conectar();
      expect(token).toBe(mockToken);
      expect(wta.accessToken).toBe(mockToken);
    });

    it('deve lançar erro se a autenticação falhar', async () => {
      const wta = new WinthorWTA(host, login, senha);
      
      mockAxios.onPost('/winthor/autenticacao/v1/login').reply(401, {
        message: 'Credenciais inválidas'
      });

      await expect(wta.conectar()).rejects.toThrow('Erro na requisição: Falha na autenticação: resposta inesperada da API');
    });

    it('deve lançar erro se não retornar token', async () => {
      const wta = new WinthorWTA(host, login, senha);
      
      mockAxios.onPost('/winthor/autenticacao/v1/login').reply(200, {
        message: 'Sucesso mas sem token'
      });

      await expect(wta.conectar()).rejects.toThrow('Falha na autenticação: resposta inesperada da API');
    });
  });

  describe('desconectar', () => {
    it('deve desconectar com sucesso', async () => {
      const wta = new WinthorWTA(host, login, senha);
      wta.accessToken = 'valid-token';
      
      mockAxios.onGet('/winthor/autenticacao/v1/logout').reply(200);

      await expect(wta.desconectar()).resolves.toBeUndefined();
      expect(wta.accessToken).toBeNull();
    });

    it('deve lançar erro se não estiver autenticado', async () => {
      const wta = new WinthorWTA(host, login, senha);
      
      await expect(wta.desconectar()).rejects.toThrow('Não autenticado. Chame o método conectar() primeiro.');
    });
  });

  describe('filiais', () => {
    it('deve buscar filiais com sucesso', async () => {
      const wta = new WinthorWTA(host, login, senha);
      wta.accessToken = 'valid-token';
      
      mockAxios.onGet('/api/branch/v1/').reply(200, [{ id: 1, nome: 'Filial 1' }]);
      
      const result = await wta.filiais();
      expect(result).toEqual([{ id: 1, nome: 'Filial 1' }]);
    });

    it('deve buscar filial específica', async () => {
      const wta = new WinthorWTA(host, login, senha);
      wta.accessToken = 'valid-token';
      
      mockAxios.onGet('/api/branch/v1/?id=1').reply(200, [{ id: 1, nome: 'Filial 1' }]);
      
      const result = await wta.filiais({ codigofilial: '1' });
      expect(result).toEqual([{ id: 1, nome: 'Filial 1' }]);
    });

    it('deve lançar erro se não estiver autenticado', async () => {
      const wta = new WinthorWTA(host, login, senha);
      
      await expect(wta.filiais()).rejects.toThrow('Não autenticado. Chame o método conectar() primeiro.');
    });
  });

  describe('clientes', () => {
    it('deve buscar clientes com sucesso', async () => {
      const wta = new WinthorWTA(host, login, senha);
      wta.accessToken = 'valid-token';
      
      mockAxios.onGet('/api/wholesale/v1/customer/list').reply(200, [{ id: 1, nome: 'Cliente 1' }]);
      
      const result = await wta.clientes();
      expect(result).toEqual([{ id: 1, nome: 'Cliente 1' }]);
    });

    it('deve aceitar parâmetros em português', async () => {
      const wta = new WinthorWTA(host, login, senha);
      wta.accessToken = 'valid-token';
      
      mockAxios.onGet(/withDeliveryAddress=false.*branchId=1,2.*personalType=J/)
        .reply(200, []);
      
      await expect(wta.clientes({
        enderecoEntrega: false,
        filiais: '1,2',
        tipoPessoa: 'J'
      })).resolves.toBeDefined();
    });

    it('deve validar parâmetros tipoPessoa', async () => {
      const wta = new WinthorWTA(host, login, senha);
      wta.accessToken = 'valid-token';
      
      await expect(wta.clientes({ tipoPessoa: 'X' })).rejects.toThrow('tipoPessoa deve ser "J" (Jurídica) ou "F" (Física)');
    });

    it('deve validar parâmetros consumidorFinal', async () => {
      const wta = new WinthorWTA(host, login, senha);
      wta.accessToken = 'valid-token';
      
      await expect(wta.clientes({ consumidorFinal: 'X' })).rejects.toThrow('consumidorFinal deve ser "S" (Sim) ou "N" (Não)');
    });
  });

  describe('cliente', () => {
    it('deve buscar cliente específico com sucesso', async () => {
      const wta = new WinthorWTA(host, login, senha);
      wta.accessToken = 'valid-token';
      
      mockAxios.onGet('/api/wholesale/v1/customer/?customerId=123').reply(200, { id: 123, nome: 'Cliente 123' });
      
      const result = await wta.cliente({ codigocliente: '123' });
      expect(result).toEqual({ id: 123, nome: 'Cliente 123' });
    });

    it('deve lançar erro se codigocliente não for informado', async () => {
      const wta = new WinthorWTA(host, login, senha);
      wta.accessToken = 'valid-token';
      
      await expect(wta.cliente({})).rejects.toThrow('Parâmetro codigocliente é obrigatório.');
    });
  });

  describe('estoque', () => {
    it('deve buscar estoque com sucesso', async () => {
      const wta = new WinthorWTA(host, login, senha);
      wta.accessToken = 'valid-token';
      
      mockAxios.onGet('/api/stock-vtex/v1/available/list?branchId=1').reply(200, [{ produto: 'Produto 1', estoque: 10 }]);
      
      const result = await wta.estoque({ codigofilial: '1' });
      expect(result).toEqual([{ produto: 'Produto 1', estoque: 10 }]);
    });

    it('deve aceitar parâmetros em português', async () => {
      const wta = new WinthorWTA(host, login, senha);
      wta.accessToken = 'valid-token';
      
      mockAxios.onGet(/branchId=1.*productId=1/)
        .reply(200, []);
      
      await expect(wta.estoque({
        codigofilial: 1,
        codigoproduto: 1
      })).resolves.toBeDefined();
    });

    it('deve aceitar parâmetros em inglês', async () => {
      const wta = new WinthorWTA(host, login, senha);
      wta.accessToken = 'valid-token';
      
      mockAxios.onGet(/branchId=1.*productId=1/)
        .reply(200, []);
      
      await expect(wta.estoque({
        branchId: 1,
        productId: 1
      })).resolves.toBeDefined();
    });

    it('deve lançar erro se codigofilial não for informado', async () => {
      const wta = new WinthorWTA(host, login, senha);
      wta.accessToken = 'valid-token';
      
      await expect(wta.estoque({})).rejects.toThrow('Parâmetro codigofilial é obrigatório.');
    });
  });

  describe('preco', () => {
    it('deve buscar preços com sucesso', async () => {
      const wta = new WinthorWTA(host, login, senha);
      wta.accessToken = 'valid-token';
      
      mockAxios.onGet('/api/wholesale/v1/price/list?branchId=1&productId=123').reply(200, [{ produto: 'Produto 1', preco: 10.50 }]);
      
      const result = await wta.preco({ codigofilial: '1', codigoproduto: '123' });
      expect(result).toEqual([{ produto: 'Produto 1', preco: 10.50 }]);
    });

    it('deve lançar erro se codigofilial não for informado', async () => {
      const wta = new WinthorWTA(host, login, senha);
      wta.accessToken = 'valid-token';
      
      await expect(wta.preco({ codigoproduto: '123' })).rejects.toThrow('Parâmetro codigofilial é obrigatório.');
    });

    it('deve lançar erro se codigoproduto não for informado', async () => {
      const wta = new WinthorWTA(host, login, senha);
      wta.accessToken = 'valid-token';
      
      await expect(wta.preco({ codigofilial: '1' })).rejects.toThrow('Parâmetro codigoproduto é obrigatório.');
    });
  });

  describe('buscaXml', () => {
    it('deve buscar XML com sucesso', async () => {
      const wta = new WinthorWTA(host, login, senha);
      wta.accessToken = 'valid-token';
      
      mockAxios.onGet('/winthor/fiscal/v1/documentosfiscais/nfe/invoiceDocument?orderId=123').reply(200, { xml: '<xml>...</xml>' });
      
      const result = await wta.buscaXml({ numeropedido: '123' });
      expect(result).toEqual({ xml: '<xml>...</xml>' });
    });

    it('deve aceitar numerotransacao como parâmetro', async () => {
      const wta = new WinthorWTA(host, login, senha);
      wta.accessToken = 'valid-token';
      
      mockAxios.onGet('/winthor/fiscal/v1/documentosfiscais/nfe/invoiceDocument?transactionId=456').reply(200, { xml: '<xml>...</xml>' });
      
      const result = await wta.buscaXml({ numerotransacao: '456' });
      expect(result).toEqual({ xml: '<xml>...</xml>' });
    });

    it('deve lançar erro se nenhum parâmetro for informado', async () => {
      const wta = new WinthorWTA(host, login, senha);
      wta.accessToken = 'valid-token';
      
      await expect(wta.buscaXml({})).rejects.toThrow('Parâmetro numeropedido ou numerotransacao é obrigatório.');
    });
  });

  describe('cadastrarAtualizarCliente', () => {
    it('deve cadastrar cliente com sucesso', async () => {
      const wta = new WinthorWTA(host, login, senha);
      wta.accessToken = 'valid-token';
      
      const clienteData = {
        CNPJ: '12345678901234',
        CODIGOATIVIDADE: 1,
        NOMECLIENTE: 'Empresa Teste',
        INSCRICAOESTADUAL: 'ISENTO',
        ENDERECOCOBRANCA: 'Rua Teste',
        CEPCOBRANCA: '12345-678',
        BAIRROCOMERCIAL: 'Centro',
        CODIGOCIDADE: 1,
        ENDERECOCOMERCIAL: 'Rua Comercial',
        CEPCOMERCIAL: '12345-678',
        CODIGOPAIS: 1058,
        EMAIL: 'teste@empresa.com',
        CODIGOPRACA: 1,
        CODIGOVENDEDOR: 1
      };
      
      mockAxios.onPost('/api/wholesale/v1/customer/').reply(200, { success: true });
      
      const result = await wta.cadastrarAtualizarCliente(clienteData);
      expect(result).toEqual({ success: true });
    });

    it('deve lançar erro se nenhum parâmetro for informado', async () => {
      const wta = new WinthorWTA(host, login, senha);
      wta.accessToken = 'valid-token';
      
      await expect(wta.cadastrarAtualizarCliente({})).rejects.toThrow('Parâmetros são obrigatórios.');
    });
  });
});