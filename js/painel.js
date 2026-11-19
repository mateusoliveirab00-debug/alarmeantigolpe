/* ==========================================================================
   painel.js — Painel de pedidos e entregas (área do comerciante)
   - Lista, filtra e busca pedidos
   - Avança o status (Pedido feito → Em separação → Em transporte → Entregue)
   - Cadastra e remove pedidos
   - Guarda tudo no localStorage
   ========================================================================== */

(function () {
  const CHAVE = CONFIG.chaves.pedidos;
  const ETAPAS = ["pedido", "separacao", "transporte", "entregue"];

  const STATUS = {
    pedido: { rotulo: "Pedido feito", classe: "st-pedido", icone: "bi-receipt" },
    separacao: { rotulo: "Em separação", classe: "st-separacao", icone: "bi-box-seam" },
    transporte: { rotulo: "Em transporte", classe: "st-transporte", icone: "bi-truck" },
    entregue: { rotulo: "Entregue", classe: "st-entregue", icone: "bi-check2-circle" }
  };

  // Carrega os pedidos salvos; se não houver, usa os exemplos
  let pedidos = Armazenamento.ler(CHAVE, null);
  if (!Array.isArray(pedidos)) {
    pedidos = clonar(PEDIDOS_EXEMPLO);
    salvar();
  }

  let filtroAtual = "todos";
  let textoBusca = "";

  /* ---------- Auxiliares ---------- */

  function salvar() {
    Armazenamento.gravar(CHAVE, pedidos);
  }

  // Um pedido está atrasado se a previsão já passou e ele ainda não foi entregue
  function estaAtrasado(p) {
    return p.status !== "entregue" && p.previsao < hojeISO();
  }

  function textoPrazo(p) {
    if (p.status === "entregue") return "Recebido";
    const d = diasAte(p.previsao);
    if (d < 0) return `${Math.abs(d)} dia(s) de atraso`;
    if (d === 0) return "Chega hoje";
    if (d === 1) return "Chega amanhã";
    return `Em ${d} dias`;
  }

  /* ---------- Resumo (cartões no topo) ---------- */

  function desenharResumo() {
    const abertos = pedidos.filter((p) => p.status !== "entregue").length;
    const emTransporte = pedidos.filter((p) => p.status === "transporte").length;
    const atrasados = pedidos.filter(estaAtrasado).length;
    const entregues = pedidos.filter((p) => p.status === "entregue").length;

    const cartoes = [
      { valor: abertos, rotulo: "Pedidos em aberto", icone: "bi-inbox", cor: "var(--el-primary)" },
      { valor: emTransporte, rotulo: "Em transporte", icone: "bi-truck", cor: "var(--el-info)" },
      { valor: atrasados, rotulo: "Atrasados", icone: "bi-exclamation-triangle", cor: "var(--el-perigo)" },
      { valor: entregues, rotulo: "Entregues", icone: "bi-check2-circle", cor: "var(--el-sucesso)" }
    ];

    document.getElementById("resumo").innerHTML = cartoes.map((c) => `
      <div class="card-el indicador">
        <div class="d-flex justify-content-between align-items-start">
          <div class="valor" style="color:${c.cor}">${c.valor}</div>
          <i class="bi ${c.icone} fs-4" style="color:${c.cor}"></i>
        </div>
        <div class="rotulo">${c.rotulo}</div>
      </div>`).join("");
  }

  /* ---------- Tabela ---------- */

  function desenharTabela() {
    const lista = pedidos
      .filter((p) => {
        const passaFiltro =
          filtroAtual === "todos" ||
          (filtroAtual === "atrasado" ? estaAtrasado(p) : p.status === filtroAtual);
        const texto = (p.fornecedor + " " + p.produto).toLowerCase();
        return passaFiltro && texto.includes(textoBusca);
      })
      .sort((a, b) => a.previsao.localeCompare(b.previsao));

    const corpo = document.getElementById("corpoTabela");

    if (lista.length === 0) {
      corpo.innerHTML = `<tr><td colspan="7" class="text-center text-secondary py-5">
        <i class="bi bi-inbox fs-3 d-block mb-2"></i>Nenhum pedido encontrado.</td></tr>`;
      return;
    }

    corpo.innerHTML = lista.map((p) => {
      const st = STATUS[p.status];
      const atrasado = estaAtrasado(p);
      const podeAvancar = p.status !== "entregue";
      return `<tr>
        <td class="text-secondary">#${p.id}</td>
        <td class="fw-medium">${escapar(p.fornecedor)}</td>
        <td>${escapar(p.produto)}</td>
        <td class="text-end">${p.quantidade}</td>
        <td>
          ${dataBR(p.previsao)}
          <div class="small ${atrasado ? "text-danger fw-semibold" : "text-secondary"}">${textoPrazo(p)}</div>
        </td>
        <td>
          <span class="status-badge ${st.classe}"><i class="bi ${st.icone}"></i>${st.rotulo}</span>
          ${atrasado ? '<span class="status-badge st-atrasado ms-1"><i class="bi bi-exclamation-triangle"></i>Atrasado</span>' : ""}
        </td>
        <td class="text-end text-nowrap">
          ${podeAvancar ? `<button type="button" class="btn btn-sm btn-outline-primary" data-acao="avancar" data-id="${p.id}" title="Avançar para a próxima etapa">
            <i class="bi bi-arrow-right-circle"></i><span class="visually-hidden">Avançar status do pedido ${p.id}</span></button>` : ""}
          <button type="button" class="btn btn-sm btn-outline-danger" data-acao="remover" data-id="${p.id}" title="Remover pedido">
            <i class="bi bi-trash"></i><span class="visually-hidden">Remover pedido ${p.id}</span></button>
        </td>
      </tr>`;
    }).join("");
  }

  function atualizarTudo() {
    desenharResumo();
    desenharTabela();
  }

  /* ---------- Eventos ---------- */

  // Botões da tabela (avançar / remover) — usa delegação de eventos
  document.getElementById("corpoTabela").addEventListener("click", function (evento) {
    const botao = evento.target.closest("button[data-acao]");
    if (!botao) return;
    const id = Number(botao.dataset.id);
    const pedido = pedidos.find((p) => p.id === id);
    if (!pedido) return;

    if (botao.dataset.acao === "avancar") {
      const proxima = ETAPAS[ETAPAS.indexOf(pedido.status) + 1];
      if (proxima) {
        pedido.status = proxima;
        salvar();
        atualizarTudo();
        avisar(`Pedido #${id}: ${STATUS[proxima].rotulo}.`);
      }
    } else if (botao.dataset.acao === "remover") {
      if (confirm(`Remover o pedido #${id}?`)) {
        pedidos = pedidos.filter((p) => p.id !== id);
        salvar();
        atualizarTudo();
        avisar("Pedido removido.", "secondary");
      }
    }
  });

  // Filtros por status
  document.getElementById("filtros").addEventListener("click", function (evento) {
    const botao = evento.target.closest("button[data-filtro]");
    if (!botao) return;
    filtroAtual = botao.dataset.filtro;
    document.querySelectorAll("#filtros .btn-filtro").forEach((b) => b.classList.toggle("ativo", b === botao));
    desenharTabela();
  });

  // Busca por texto
  document.getElementById("busca").addEventListener("input", function (evento) {
    textoBusca = evento.target.value.trim().toLowerCase();
    desenharTabela();
  });

  // Restaurar dados de exemplo
  document.getElementById("btnRestaurar").addEventListener("click", function () {
    if (confirm("Voltar para os pedidos de exemplo? Os pedidos cadastrados serão perdidos.")) {
      pedidos = clonar(PEDIDOS_EXEMPLO);
      salvar();
      atualizarTudo();
      avisar("Dados de exemplo restaurados.", "secondary");
    }
  });

  /* ---------- Formulário de novo pedido ---------- */

  const form = document.getElementById("formPedido");
  const campoProduto = document.getElementById("pProduto");
  const campoPrevisao = document.getElementById("pPrevisao");

  campoProduto.innerHTML = '<option value="" selected disabled>Selecione...</option>' +
    PRODUTOS.map((p) => `<option value="${escapar(p.nome)}">${escapar(p.nome)}</option>`).join("");
  campoPrevisao.min = hojeISO();

  form.addEventListener("submit", function (evento) {
    evento.preventDefault();
    form.classList.add("was-validated");
    if (!form.checkValidity()) return;

    const novoId = pedidos.length ? Math.max(...pedidos.map((p) => p.id)) + 1 : 1;
    pedidos.push({
      id: novoId,
      fornecedor: document.getElementById("pFornecedor").value.trim(),
      produto: campoProduto.value,
      quantidade: Number(document.getElementById("pQuantidade").value),
      previsao: campoPrevisao.value,
      status: "pedido"
    });
    salvar();
    atualizarTudo();

    bootstrap.Modal.getInstance(document.getElementById("modalPedido")).hide();
    form.reset();
    form.classList.remove("was-validated");
    avisar(`Pedido #${novoId} cadastrado.`);
  });

  // Limpa a validação ao fechar a janela
  document.getElementById("modalPedido").addEventListener("hidden.bs.modal", function () {
    form.reset();
    form.classList.remove("was-validated");
  });

  /* ---------- Início ---------- */
  document.addEventListener("DOMContentLoaded", atualizarTudo);
})();
