/* ==========================================================================
   dados.js — Dados FICTÍCIOS de exemplo usados no protótipo
   Exceção: o objeto DIAGNOSTICO usa os números reais citados no Plano de Projeto.
   ========================================================================== */

/* ---------- Dados reais do diagnóstico (Plano de Projeto) ---------- */
const DIAGNOSTICO = {
  custoLogistico: [
    { rotulo: "Brasil 2014", valor: 10.4 },
    { rotulo: "Brasil 2025", valor: 15.5, destaque: true },
    { rotulo: "EUA 2025", valor: 8.8 }
  ],
  cafe: [
    { rotulo: "Café moído (varejo)", valor: 75.6, destaque: true },
    { rotulo: "Café solúvel (varejo)", valor: 36.56 },
    { rotulo: "Café coado fora de casa", valor: 36.5 }
  ],
  mortalidade: [
    { rotulo: "Microempresas", valor: 21.6, destaque: true },
    { rotulo: "Pequeno porte", valor: 17.0 }
  ]
};

/* ---------- Produtos (café + 6 básicos) ---------- */
const PRODUTOS = [
  { id: "cafe", nome: "Café torrado e moído 500 g", curto: "Café 500 g" },
  { id: "arroz", nome: "Arroz branco 5 kg", curto: "Arroz 5 kg" },
  { id: "feijao", nome: "Feijão carioca 1 kg", curto: "Feijão 1 kg" },
  { id: "oleo", nome: "Óleo de soja 900 ml", curto: "Óleo 900 ml" },
  { id: "leite", nome: "Leite integral 1 L", curto: "Leite 1 L" },
  { id: "acucar", nome: "Açúcar cristal 1 kg", curto: "Açúcar 1 kg" },
  { id: "farinha", nome: "Farinha de mandioca 1 kg", curto: "Farinha 1 kg" }
];

/* ---------- Histórico de preço médio (últimos 6 meses, fictício) ---------- */
const HISTORICO_PRECOS = {
  meses: ["Mai", "Jun", "Jul", "Ago", "Set", "Out"],
  valores: {
    cafe: [31.9, 32.8, 34.5, 36.2, 35.4, 34.1],
    arroz: [27.9, 28.4, 28.9, 29.5, 29.3, 29.8],
    feijao: [8.2, 8.5, 8.9, 9.4, 9.6, 9.9],
    oleo: [7.5, 7.4, 7.6, 7.8, 7.7, 7.6],
    leite: [4.9, 5.0, 5.2, 5.5, 5.8, 6.1],
    acucar: [4.8, 4.7, 4.6, 4.65, 4.6, 4.55],
    farinha: [7.9, 8.1, 8.2, 8.5, 8.6, 8.9]
  }
};

/* ---------- Comércios fictícios de Manaus ---------- */
const COMERCIOS = [
  { id: 1, nome: "Mercadinho Boa Vista", bairro: "Centro", tipo: "pequeno", horario: "07h às 19h" },
  { id: 2, nome: "Mercearia do Seu Raimundo", bairro: "Cachoeirinha", tipo: "pequeno", horario: "06h30 às 20h" },
  { id: 3, nome: "Empório Amazônia", bairro: "Parque 10 de Novembro", tipo: "pequeno", horario: "08h às 21h" },
  { id: 4, nome: "Mini Mercado Alvorada", bairro: "Alvorada", tipo: "pequeno", horario: "07h às 20h" },
  { id: 5, nome: "Mercearia Nova Esperança", bairro: "Compensa", tipo: "pequeno", horario: "06h às 19h" },
  { id: 6, nome: "Hiper Rio Negro (rede)", bairro: "Adrianópolis", tipo: "grande", horario: "08h às 22h" },
  { id: 7, nome: "Atacarejo Igarapé (rede)", bairro: "Cidade Nova", tipo: "grande", horario: "07h às 21h" }
];

/* Fator aplicado ao preço médio para gerar o preço de cada comércio.
   Pequenos pagam mais caro na compra (menos poder de barganha); grandes redes, menos. */
const FATOR_PRECO = { 1: 1.06, 2: 1.04, 3: 1.10, 4: 1.07, 5: 1.05, 6: 0.97, 7: 0.92 };

/* Estoque de cada comércio, na ordem dos PRODUTOS: o = normal, p = pouco, s = sem estoque */
const ESTOQUE_PADRAO = {
  1: "ooopoop",
  2: "oopooso",
  3: "pooosoo",
  4: "ooposop",
  5: "soooopo",
  6: "oooooop",
  7: "ooooooo"
};
const MAPA_ESTOQUE = { o: "ok", p: "pouco", s: "sem" };

/* Preço de cada produto em cada comércio (gerado a partir da última média) */
const PRECOS_COMERCIOS = [];
COMERCIOS.forEach((comercio) => {
  PRODUTOS.forEach((produto, i) => {
    const base = HISTORICO_PRECOS.valores[produto.id].slice(-1)[0];
    const variacao = (((i * 3 + comercio.id) % 5) - 2) * 0.012;
    const preco = Math.round(base * (FATOR_PRECO[comercio.id] + variacao) * 100) / 100;
    PRECOS_COMERCIOS.push({
      comercioId: comercio.id,
      produtoId: produto.id,
      preco: preco,
      estoque: MAPA_ESTOQUE[ESTOQUE_PADRAO[comercio.id][i]]
    });
  });
});

/* ---------- Pedidos de exemplo (datas relativas a hoje) ---------- */
function dataEmDias(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return paraISO(d);
}

const PEDIDOS_EXEMPLO = [
  { id: 1, fornecedor: "Distribuidora Rio Solimões", produto: "Arroz branco 5 kg", quantidade: 40, previsao: dataEmDias(-2), status: "transporte" },
  { id: 2, fornecedor: "Cafés do Planalto", produto: "Café torrado e moído 500 g", quantidade: 60, previsao: dataEmDias(3), status: "transporte" },
  { id: 3, fornecedor: "Atacado Boa Safra", produto: "Óleo de soja 900 ml", quantidade: 30, previsao: dataEmDias(5), status: "separacao" },
  { id: 4, fornecedor: "Laticínios Vale Verde", produto: "Leite integral 1 L", quantidade: 120, previsao: dataEmDias(1), status: "pedido" },
  { id: 5, fornecedor: "Distribuidora Rio Solimões", produto: "Feijão carioca 1 kg", quantidade: 50, previsao: dataEmDias(-5), status: "entregue" },
  { id: 6, fornecedor: "Atacado Boa Safra", produto: "Açúcar cristal 1 kg", quantidade: 45, previsao: dataEmDias(7), status: "pedido" }
];

/* ---------- Compras conjuntas de exemplo ---------- */
const COMPRAS_EXEMPLO = [
  { id: 1, produto: "Arroz branco 5 kg", fornecedor: "Distribuidora Rio Solimões", organizador: "Mercadinho Boa Vista",
    metaQtd: 200, qtdAtual: 132, participantes: 5, precoIndividual: 29.8, precoConjunto: 26.4, prazo: dataEmDias(6) },
  { id: 2, produto: "Café torrado e moído 500 g", fornecedor: "Cafés do Planalto", organizador: "Empório Amazônia",
    metaQtd: 150, qtdAtual: 150, participantes: 6, precoIndividual: 34.1, precoConjunto: 30.9, prazo: dataEmDias(4) },
  { id: 3, produto: "Leite integral 1 L", fornecedor: "Laticínios Vale Verde", organizador: "Mercearia do Seu Raimundo",
    metaQtd: 300, qtdAtual: 84, participantes: 3, precoIndividual: 6.1, precoConjunto: 5.35, prazo: dataEmDias(10) },
  { id: 4, produto: "Feijão carioca 1 kg", fornecedor: "Distribuidora Rio Solimões", organizador: "Mini Mercado Alvorada",
    metaQtd: 120, qtdAtual: 40, participantes: 2, precoIndividual: 9.9, precoConjunto: 8.7, prazo: dataEmDias(-1) }
];
