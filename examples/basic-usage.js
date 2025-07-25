const WinthorWTA = require('../lib/index');

// Configuração da conexão
const config = {
  host: 'https://seu-servidor-winthor.com',
  login: 'usuario',
  senha: 'senha'
};

async function exemploBasico() {
  try {
    // Inicializa a conexão
    const wta = new WinthorWTA(config);
    
    // Conecta na API
    console.log('Conectando...');
    await wta.conectar();
    console.log('Conectado com sucesso!');
    
    // Exemplo 1: Buscar filiais
    console.log('\n--- Buscando filiais ---');
    const filiais = await wta.filiais();
    console.log('Filiais encontradas:', filiais.length);
    
    // Exemplo 2: Buscar cliente específico
    console.log('\n--- Buscando cliente ---');
    const cliente = await wta.cliente({ 
      codigocliente: '12345',
      enderecoEntrega: true 
    });
    console.log('Cliente encontrado:', cliente.nome);
    
    // Exemplo 3: Buscar estoque
    console.log('\n--- Buscando estoque ---');
    const estoque = await wta.estoque({
      codigofilial: '1',
      codigoproduto: '123'
    });
    console.log('Estoque encontrado:', estoque);
    
    // Exemplo 4: Buscar preços
    console.log('\n--- Buscando preços ---');
    const precos = await wta.preco({
      codigofilial: '1',
      codigoproduto: '123',
      precoporembalagem: true
    });
    console.log('Preços encontrados:', precos);
    
    // Exemplo 5: Buscar XML de nota fiscal
    console.log('\n--- Buscando XML ---');
    const xml = await wta.buscaXml({
      numeropedido: '1001001',
      retornabase64: false
    });
    console.log('XML encontrado:', xml.substring(0, 100) + '...');
    
    // Desconecta
    await wta.desconectar();
    console.log('\nDesconectado com sucesso!');
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

// Exemplo com tratamento de erros mais robusto
async function exemploComTratamentoDeErros() {
  const wta = new WinthorWTA(config);
  
  try {
    await wta.conectar();
    
    // Buscar clientes com filtros
    const clientes = await wta.clientes({
      enderecoEntrega: true,
      filiais: '1,2,3',
      tipoPessoa: 'J',
      consumidorFinal: 'N'
    });
    
    console.log(`Encontrados ${clientes.length} clientes`);
    
  } catch (error) {
    if (error.message.includes('autenticação')) {
      console.error('Erro de autenticação - verifique suas credenciais');
    } else if (error.message.includes('conexão')) {
      console.error('Erro de conexão - verifique o host e a conectividade');
    } else {
      console.error('Erro inesperado:', error.message);
    }
  } finally {
    try {
      await wta.desconectar();
    } catch (disconnectError) {
      console.warn('Erro ao desconectar:', disconnectError.message);
    }
  }
}

// Exemplo de cadastro de cliente
async function exemploCadastroCliente() {
  const wta = new WinthorWTA(config);
  
  try {
    await wta.conectar();
    
    const dadosCliente = {
      CNPJ: '12345678901234',
      CODIGOATIVIDADE: 1,
      NOMECLIENTE: 'Empresa Exemplo Ltda',
      INSCRICAOESTADUAL: 'ISENTO',
      ENDERECOCOBRANCA: 'Rua das Flores, 123',
      CEPCOBRANCA: '12345-678',
      BAIRROCOMERCIAL: 'Centro',
      CODIGOCIDADE: 1,
      ENDERECOCOMERCIAL: 'Rua Comercial, 456',
      CEPCOMERCIAL: '12345-678',
      CODIGOPAIS: 1058,
      EMAIL: 'contato@empresaexemplo.com',
      CODIGOPRACA: 1,
      CODIGOVENDEDOR: 1,
      NOMEFANTASIA: 'Empresa Exemplo',
      TELEFONECOMERCIAL: '11999999999'
    };
    
    const resultado = await wta.cadastrarAtualizarCliente(dadosCliente);
    console.log('Cliente cadastrado/atualizado com sucesso:', resultado);
    
  } catch (error) {
    console.error('Erro ao cadastrar cliente:', error.message);
  } finally {
    await wta.desconectar();
  }
}

// Executar exemplos
if (require.main === module) {
  console.log('=== Exemplo Básico ===');
  exemploBasico();
  
  // Descomente para executar outros exemplos
  // console.log('\n=== Exemplo com Tratamento de Erros ===');
  // exemploComTratamentoDeErros();
  
  // console.log('\n=== Exemplo de Cadastro ===');
  // exemploCadastroCliente();
}

module.exports = {
  exemploBasico,
  exemploComTratamentoDeErros,
  exemploCadastroCliente
}; 