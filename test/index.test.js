const WinthorWTA = require('../lib/index');
const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');

describe('WinthorWTA', () => {
  let mockAxios;
  const host = 'hostwta/';
  const login = 'usuario';
  const senha = 'suasenha';
  const encryptedPass = '6EE4EB2AC9D7B347D129E9CC1633D903'; // MD5 de 'suasenha' em maiúsculo para testar
  const hostEperado = 'hostwta'; // Host esperado sem barra no final

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('Constructor', () => {
    it('deve inicializar corretamente com host, login e senha', () => {
      const wta = new WinthorWTA(host, login, senha);
      expect(wta.host).toBe(hostEperado);
      expect(wta.login).toBe(login);
      expect(wta.senha).toBe(senha);
    });

    it('deve lançar erro se algum parâmetro estiver faltando', () => {
      expect(() => new WinthorWTA()).toThrow();
      expect(() => new WinthorWTA(host)).toThrow();
      expect(() => new WinthorWTA(host, login)).toThrow();
    });
  });

  describe('Constructor', () => {
    it('deve inicializar corretamente com objeto { host, login, senha} ', () => {
      const wta = new WinthorWTA( { host, login, senha } );
      expect(wta.host).toBe(hostEperado);
      expect(wta.login).toBe(login);
      expect(wta.senha).toBe(senha);
    });

    it('deve lançar erro se algum parâmetro estiver faltando', () => {
      expect(() => new WinthorWTA()).toThrow();
      expect(() => new WinthorWTA(host)).toThrow();
      expect(() => new WinthorWTA(host, login)).toThrow();
    });
  });

  describe('Constructor', () => {
    it('deve remover barra do final do host caso exista', () => {
      const wta = new WinthorWTA(host, login, senha);
      expect(wta.host).toBe(hostEperado);
    });
  });

  describe('_encryptPassword', () => {
    it('deve converter a senha para MD5 em maiúsculas', () => {
      const wta = new WinthorWTA(host, login, senha);
      const result = wta._encryptPassword(senha);
      expect(result).toBe(encryptedPass);
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
        error: 'Credenciais inválidas'
      });

      await expect(wta.conectar()).rejects.toThrow();
    });
  });

    describe('clientes', () => {
    // ... outros testes ...
    
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

    it('deve aceitar parâmetros mistos (português e inglês)', async () => {
      const wta = new WinthorWTA(host, login, senha);
      wta.accessToken = 'valid-token';
      
      mockAxios.onGet(/withDeliveryAddress=true.*finalCostumer=S/)
        .reply(200, []);
      
      await expect(wta.clientes({
        enderecoEntrega: true,
        finalCostumer: 'S'
      })).resolves.toBeDefined();
    });
  });
  
  describe('estoque', () => {    
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

    it('deve aceitar parâmetros mistos (português e inglês)', async () => {
      const wta = new WinthorWTA(host, login, senha);
      wta.accessToken = 'valid-token';
      
      mockAxios.onGet(/branchId=1.*productId=1/)
        .reply(200, []);
      
      await expect(wta.estoque({
        branchId: 1,
        productId: 1
      })).resolves.toBeDefined();
    });
  });


});