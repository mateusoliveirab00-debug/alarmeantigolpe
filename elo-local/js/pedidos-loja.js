/* ==========================================================================
   pedidos-loja.js — Pedidos feitos por consumidores a vendedores cadastrados
   Liga os dois lados: o consumidor cria o pedido e acompanha o status;
   o vendedor recebe, aceita/recusa e avança as etapas.
   Tudo no localStorage (chave compartilhada entre as contas deste navegador).
   ========================================================================== */

const PedidosLoja = (function () {
  const CHAVE = CONFIG.chaves.pedidosLoja;

  // Etapas normais; "recusado" e "cancelado" são finais
  const FLUXO = ["novo", "aceito", "preparo", "pronto", "concluido"];

  const STATUS = {
    novo: { rotulo: "Novo pedido", classe: "st-pedido", icone: "bi-bell" },
    aceito: { rotulo: "Aceito", classe: "st-separacao", icone: "bi-hand-thumbs-up" },
    preparo: { rotulo: "Em preparo", classe: "st-separacao", icone: "bi-box-seam" },
    pronto: { rotulo: "Pronto", classe: "st-transporte", icone: "bi-bag-check" },
    concluido: { rotulo: "Concluído", classe: "st-entregue", icone: "bi-check2-circle" },
    recusado: { rotulo: "Recusado", classe: "st-atrasado", icone: "bi-x-circle" },
    cancelado: { rotulo: "Cancelado", classe: "tipo-grande", icone: "bi-slash-circle" }
  };

  // Texto da etapa "pronto" depende de retirada ou entrega
  function rotulo(pedido) {
    if (pedido.status === "pronto") return pedido.entrega === "entrega" ? "Saiu para entrega" : "Pronto para retirar";
    return STATUS[pedido.status].rotulo;
  }

  // Texto do botão do vendedor para avançar a etapa atual
  function acaoAvancar(pedido) {
    return { novo: "Aceitar", aceito: "Iniciar preparo", preparo: pedido.entrega === "entrega" ? "Saiu para entrega" : "Pronto para retirar", pronto: "Concluir" }[pedido.status] || null;
  }

  const ler = () => { const l = Armazenamento.ler(CHAVE, []); return Array.isArray(l) ? l : []; };
  const gravar = (lista) => Armazenamento.gravar(CHAVE, lista);

  function criar(dados) {
    const lista = ler();
    const agora = new Date().toISOString();
    const pedido = {
      id: lista.length ? Math.max(...lista.map((p) => p.id)) + 1 : 1,
      vendedorId: dados.vendedorId,
      lojaNome: dados.lojaNome,
      consumidorId: dados.consumidorId,
      consumidorNome: dados.consumidorNome,
      consumidorTelefone: dados.consumidorTelefone,
      itens: dados.itens,
      total: dados.itens.reduce((s, i) => s + i.qtd * i.precoRef, 0),
      entrega: dados.entrega,
      endereco: dados.endereco || "",
      obs: dados.obs || "",
      status: "novo",
      criadoEm: agora,
      historico: [{ status: "novo", em: agora }]
    };
    lista.push(pedido);
    gravar(lista);
    return pedido;
  }

  function mudarStatus(id, status) {
    const lista = ler();
    const p = lista.find((x) => x.id === id);
    if (!p) return null;
    p.status = status;
    p.historico.push({ status, em: new Date().toISOString() });
    gravar(lista);
    return p;
  }

  function avancar(id) {
    const p = ler().find((x) => x.id === id);
    if (!p) return null;
    const proximo = FLUXO[FLUXO.indexOf(p.status) + 1];
    return proximo ? mudarStatus(id, proximo) : null;
  }

  const doVendedor = (id) => ler().filter((p) => p.vendedorId === id).sort((a, b) => b.id - a.id);
  const doConsumidor = (id) => ler().filter((p) => p.consumidorId === id).sort((a, b) => b.id - a.id);

  function dataHora(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  // Selo de status pronto para colocar na tela
  function selo(pedido) {
    const st = STATUS[pedido.status];
    return `<span class="status-badge ${st.classe}"><i class="bi ${st.icone}"></i>${escapar(rotulo(pedido))}</span>`;
  }

  // Lista de itens em HTML simples
  function itensHtml(pedido) {
    return `<ul class="lista-itens list-unstyled small mb-0">${pedido.itens.map((i) =>
      `<li>${i.qtd}× ${escapar(i.nome)}</li>`).join("")}</ul>`;
  }

  return { STATUS, FLUXO, rotulo, acaoAvancar, criar, mudarStatus, avancar, doVendedor, doConsumidor, dataHora, selo, itensHtml };
})();
