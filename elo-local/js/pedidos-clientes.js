/* ==========================================================================
   pedidos-clientes.js — Pedidos de clientes (área do vendedor)
   Aceitar/recusar e avançar: Novo → Aceito → Em preparo → Pronto → Concluído
   ========================================================================== */

(function () {
  const usuario = Auth.usuarioAtual();
  let filtro = "todos";

  const emAndamento = (p) => ["aceito", "preparo", "pronto"].includes(p.status);
  const encerrado = (p) => ["recusado", "cancelado"].includes(p.status);

  function desenharResumo(pedidos) {
    const cartoes = [
      { valor: pedidos.filter((p) => p.status === "novo").length, rotulo: "Novos", icone: "bi-bell", cor: "var(--el-info)" },
      { valor: pedidos.filter(emAndamento).length, rotulo: "Em andamento", icone: "bi-box-seam", cor: "var(--el-alerta)" },
      { valor: pedidos.filter((p) => p.status === "concluido").length, rotulo: "Concluídos", icone: "bi-check2-circle", cor: "var(--el-sucesso)" },
      { valor: moeda(pedidos.filter((p) => p.status === "concluido").reduce((s, p) => s + p.total, 0)), rotulo: "Vendas concluídas (est.)", icone: "bi-cash-coin", cor: "var(--el-primary)" }
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

  function desenhar() {
    const todos = PedidosLoja.doVendedor(usuario.id);
    desenharResumo(todos);

    const lista = todos.filter((p) =>
      filtro === "todos" ||
      (filtro === "novo" && p.status === "novo") ||
      (filtro === "andamento" && emAndamento(p)) ||
      (filtro === "concluido" && p.status === "concluido") ||
      (filtro === "encerrado" && encerrado(p)));

    const corpo = document.getElementById("corpoTabela");
    if (!lista.length) {
      corpo.innerHTML = `<tr><td colspan="7" class="text-center text-secondary py-5">
        <i class="bi bi-inbox fs-3 d-block mb-2"></i>${todos.length ? "Nenhum pedido nesta situação." : "Você ainda não recebeu pedidos de clientes.<br><span class=\"small\">Entre como consumidor e peça na sua loja para ver o fluxo funcionando.</span>"}</td></tr>`;
      return;
    }

    corpo.innerHTML = lista.map((p) => {
      const acao = PedidosLoja.acaoAvancar(p);
      return `<tr>
        <td class="text-secondary">#${p.id}<div class="small">${PedidosLoja.dataHora(p.criadoEm)}</div></td>
        <td class="fw-medium">${escapar(p.consumidorNome)}
          <div class="small text-secondary fw-normal"><i class="bi bi-telephone me-1"></i>${Auth.Mascara.telefone(p.consumidorTelefone)}</div></td>
        <td>${PedidosLoja.itensHtml(p)}${p.obs ? `<div class="small text-secondary mt-1"><i class="bi bi-chat-left-text me-1"></i>${escapar(p.obs)}</div>` : ""}</td>
        <td class="text-end">${moeda(p.total)}</td>
        <td>${p.entrega === "entrega" ? `<i class="bi bi-truck me-1"></i>Entrega<div class="small text-secondary">${escapar(p.endereco)}</div>` : '<i class="bi bi-shop me-1"></i>Retirada'}</td>
        <td>${PedidosLoja.selo(p)}</td>
        <td class="text-end text-nowrap">
          ${acao ? `<button type="button" class="btn btn-sm btn-primary" data-acao="avancar" data-id="${p.id}">${acao}</button>` : ""}
          ${p.status === "novo" ? `<button type="button" class="btn btn-sm btn-outline-danger" data-acao="recusar" data-id="${p.id}">Recusar</button>` : ""}
        </td>
      </tr>`;
    }).join("");
  }

  document.getElementById("corpoTabela").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-acao]");
    if (!b) return;
    const id = Number(b.dataset.id);
    if (b.dataset.acao === "avancar") {
      const p = PedidosLoja.avancar(id);
      if (p) avisar(`Pedido #${id}: ${PedidosLoja.rotulo(p)}.`);
    } else if (confirm(`Recusar o pedido #${id}?`)) {
      PedidosLoja.mudarStatus(id, "recusado");
      avisar(`Pedido #${id} recusado.`, "secondary");
    } else {
      return;
    }
    desenhar();
    if (typeof montarLayout === "function") montarLayout(); // atualiza a bolinha do menu
  });

  document.getElementById("filtros").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-filtro]");
    if (!b) return;
    filtro = b.dataset.filtro;
    document.querySelectorAll("#filtros .btn-filtro").forEach((x) => x.classList.toggle("ativo", x === b));
    desenhar();
  });

  // Novos pedidos chegam enquanto a página está aberta (outra aba/janela)
  window.addEventListener("storage", () => { desenhar(); if (typeof montarLayout === "function") montarLayout(); });
  document.addEventListener("DOMContentLoaded", desenhar);
})();
