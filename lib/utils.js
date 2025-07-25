// um POO cria o objeto da maneira tem de ser enviado para o wta podendo ser acrescentado ou removido algum campo
class Cliente {
  constructor (cliente){
    const mapeiaCampos = {
      activityId: { nome:'CODIGOATIVIDADE', tipo:'number', obrigatorio: true }, //Number 6                                                                     Obrigátorio
      billingAddress: { nome: 'ENDERECOCOBRANCA', tipo: 'string', tamanho: 40/* , obrigatorio: true */ }, //String 40 PCLIENT.ENDERCOD                            Obrigátorio
      billingAddressNumber: { nome: 'NUMEROCOBRANÇA', tipo: 'string', tamanho: 6},  //STRIG 6 PCLIENT.NUMEROCOB
      billingDistrict: {nome:'BAIRROCOBRANCA', tipo: 'string', tamanho: 40 }, //STRING 40 PCCLIENT.BAIRROCOB
      billingId: { nome: 'CODCOB', tipo: 'string', tamanho: 4 }, //STRING 4 PCCLIENT.CODCOB
      billingState: { nome:'UFCOBRANCA', tipo: 'string', tamanho: 2 }, //STRING 2 PCCLIENT.ESTCOB
      billingZipCode: { nome: 'CEPCOBRANCA', tipo: 'string', tamanho: 9/* , obrigatorio: true */ }, //STRING 9 PCCLIENT.CEPCOB                                    Obrigátorio
      businessDistrict: { nome: 'BAIRROCOMERCIAL', tipo: 'string', tamanho: 40/* , obrigatorio: true */ }, //STRING 40 PCCLIENT.BAIRROENT                         Obrigátorio
      businessState: {nome: 'ESTADOCOMERCIAL', tipo: 'string', tamanho: 2 }, //STRING 2 PCCLIENT.ESTENT
      cityId: { nome:'CODIGOCIDADE', tipo: 'number'/* , obrigatorio: true */ }, //NUMVER 10 PCCLIENT.CODCIDADE                                                    Obrigátorio //VALIDAR SE ENVIANDO commercialZipCode NÃO É NECESSARIO ENVIAR
      commercialAddress: { nome: 'ENDERECOCOMERCIAL', tipo: 'string', tamanho: 40/* , obrigatorio: true */ }, //STRING 40 PCCLIENT.ENDERENT                       Obrigátorio
      commercialAddressNumber: { nome:'NUMNEROCOMERCIAL', tipo:'string', tamanho: 6 }, //STRING 6 PCCLIENT.NUMEROENT
      commercialZipCode: { nome: 'CEPCOMERCIAL', tipo:'string', tamanho: 9, obrigatorio: true }, //STRING 9 PCCLIENT.CEPCOM                                 Obrigátorio
      complementBillingAddress: { nome:'COMPLEMENTOCOBRANCA', tipo: 'string', tamanho: 80 }, //STRING 80 PCCLIENT.COMPLEMENTOCOB
      complementBusinessAddress: { nome:'COMPLEMENTOCOMERCIAL', tipo: 'string', tamanho: 80 }, //STRING 80 PCCLIENT.COMPLEMENTOCOM
      complementDeliveryAddress: { nome:'COMPLEMENTOENTREGA', tipo: 'string', tamanho: 80 }, //STRING 80 PCCLIENT.COMPLEMENTOENT
      contributor: { nome: 'CONTRIBUINTE', tipo: 'boolean' }, //BOOLEAN PCCLIENT.CONTRIBUINTE  //Não é Obrigátorio mais interessante passar
      corporate: { nome: 'TIPOPESSOA', tipo: 'boolean' }, //BOOLEAN TRUE 'J' e FALSE 'F'  //Caso não seja enviado valida pelo CNPJ e preenche sendo assim não vejo necessidade enviar
      corporatePhone: { nome:'TELEFONECOMERCIAL', tipo:'string', tamanho: 13 }, //STRING 13 PCCLIENT.TELENT fazer uma expresão regular deixar somente números
      deliveryPhone: { nome:'TELEFONEENTREGA', tipo:'string', tamanho: 13 }, //STRING 13 PCCLIENT. VALIDAR O CAMPO CORRETO PREENCHE
      billingPhone: { nome:'TELEFONECOBRANCA', tipo:'string', tamanho: 13 }, //STRING 13  TB VALOR O CAMPO PREENHIDO NA PCCLIENT
      countryId: { nome:'CODIGOPAIS', tipo: 'number', default: 1058 }, //NUMBER 6 PCCLIENT.CODPAIS  se null preencher com 1058 - Brasil   Obrigátorio
      customerOrigin: { nome:'customerOrigin', tipo: 'string', tamanho: 2, default:'VT' }, //preencher sempre com "VT"                    Obrigátorio
      email: { nome:'EMAIL', tipo:'string', tamanho: 100, obrigatorio: true }, //STRING 100 PCCLIENT.EMAIL                                                   Obrigátorio //validar se e obrigatorio
      emailNfe: { nome:'EMAIL', tipo:'string', tamanho: 3500 }, //STRING 3500 passado e-mail preenchera o campo PCCLIENT.EMAILNFE
      finalCostumer: {nome: 'CONSUMIDORFINAL', tipo: 'boolean' }, //BOOLEAN true = 'S' e false = 'N' interessate enviar.
      // lastChange: { nome:"DATAULTIMAALTERACAO", tipo:'date' }, //DATE 7 PCCLIENT.DTULTALTER                                             Obrigatorio //Informa obrigatorio na doc mais acredito que não
      name: { nome:'NOMECLIENTE', tipo:'string', tamanho: 60, obrigatorio: true }, //STRING 60 PCCLIENT.CLIENTE                                              Obrigátorio
      paymentPlanId: { nome:'CODIGOPLANOPAGAMENTO', tipo:'number' }, //NUMBER 4 PCCLIENT.CODPLPAG
      personIdentificationNumber: { nome:'CNPJ', tipo:'string', tamanho: 18, obrigatorio: true }, //STRING 18 PCCLIENT.CGCENT  CNPJF/CPF                     Obrigatorio
      sellerId: { nome:'CODIGOVENDEDOR', tipo:'number', obrigatorio: true }, //NUMVBER 4 PCCLIENT.CODUSUR1                                                   Obrigatorio
      squareId: { nome:'CODIGOPRACA', tipo:'number'/* , obrigatorio: true */ }, //NUMBER 6 PCCLIENT.CODPRACA                                                       Obrigatorio
      stateInscription: { nome:'INSCRICAOESTADUAL', tipo:'string', tamanho: 15, obrigatorio: true }, //NUMBER 6 PCCLIENT.IEENT                                            Obrigatorio
      stCalculator: { nome:'CALCULAST', tipo:'boolean' }, //BOOLEAN PCCLIENT.CALCULAST se null default 'S'
      tradeName: { nome:'NOMEFANTASIA', tipo:'string', tamanho: 40 }, //STRING 40 PCCLIENT.FANTASIA
      customerNetId: { nome:'CODIGOREDE', tipo:'number' }, //NUMBER 4 PCCLIENT.CODREDE
    };

    const camposObrigatoriosFaltantes = Object.entries(mapeiaCampos)
      .filter(([, config]) => config.obrigatorio)
      .filter(([keyEn, config]) => {
        // Verifica se o campo não foi fornecido em nenhum dos formatos (PT ou EN)
        return cliente[config.nome] === undefined &&
                        cliente[keyEn] === undefined;
      });
    //console.log(`Campos obrigatórios faltantes: ${JSON.stringify(camposObrigatoriosFaltantes)}`);

    // 2. Se houver campos faltantes, prepara mensagem de erro consolidada
    if (camposObrigatoriosFaltantes.length > 0) {
      const camposFormatados = camposObrigatoriosFaltantes
        .map(([keyEn, config]) => `${config.nome} (${keyEn})`)
        .join(', ');

      const error = new Error();
      error.message = `Campos obrigatórios faltantes: ${camposFormatados}`;
      throw error;
    }

    Object.entries(mapeiaCampos).forEach(([keyEn, config]) => {
      // Primeiro tenta pelo nome em português (config.nome)
      //console.log(`Config é: ${JSON.stringify(config)}`);
      /* if(config.obrigatorio && (cliente[config.nome] === undefined && cliente[keyEn] === undefined) ) {
              console.log(`Campo ${config.nome} é PT obrigatório e deve ser enviado.`)
          } */
      if (cliente[config.nome] !== undefined) {
        this[keyEn] = this.converterValores(this.ajustarTamanhoString(cliente[config.nome], config.tamanho), config.tipo);
      } else if (cliente[keyEn] !== undefined) {
        // Se não encontrou em português, tenta pelo nome em inglês (keyEn)
        this[keyEn] = this.converterValores(this.ajustarTamanhoString(cliente[keyEn], config.tamanho), config.tipo);
      } else if (config.default !== undefined) {
        // Se não encontrou em nenhum dos dois, usa o valor default se existir
        this[keyEn] = this.converterValores(this.ajustarTamanhoString(config.default, config.tamanho), config.tipo);
      }
    });
  }

  converterValores (valor, tipo) {
    switch (tipo) {
    case 'boolean':
      return Boolean(valor);
    case 'number':
      return Number(valor);
    case 'string':
      return String(valor);
    default:
      return valor;
    }
  }
  ajustarTamanhoString (valor, tamanho) {
    if (typeof valor === 'string' && valor.length > tamanho) {
      return valor.substring(0, tamanho);
    }
    return valor;
  }
}

module.exports = {
  Cliente,
};
