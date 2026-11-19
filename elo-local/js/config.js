/* ==========================================================================
   config.js — Configurações gerais da plataforma
   Para trocar o nome, basta alterar "nome" aqui: ele é aplicado
   automaticamente no menu, no título das páginas e no rodapé.
   Sugestões de nome: "Elo Local", "Rota Justa", "Feira Conectada", "Cesta Clara".
   ========================================================================== */

const CONFIG = {
  nome: "Elo Local",
  slogan: "Abastecimento previsível e preço transparente para o comércio de bairro",

  // Chaves usadas para guardar dados no navegador (localStorage)
  chaves: {
    pedidos: "elolocal:pedidos",
    compras: "elolocal:compras",
    participacoes: "elolocal:participacoes",
    favoritos: "elolocal:favoritos",
    usuarios: "elolocal:usuarios",
    sessao: "elolocal:sessao",
    boasVindas: "elolocal:boasvindas",
    pedidosLoja: "elolocal:pedidosloja",
    recuperacao: "elolocal:recuperacao"
  }
};
