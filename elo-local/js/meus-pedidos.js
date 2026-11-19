/* ==========================================================================
   meus-pedidos.js — Pedidos do consumidor e andamento de cada um
   ========================================================================== */

(function () {
  const usuario = Auth.usuarioAtual();
  const area = document.getElementById("listaPedidos");

  function linhaDoTempo(p) {
    return `<ol class="linha-tempo list-unstyled small mb-0">${p.historico.map((h) => {
      const rot = h.status === "pronto" ? (p.entrega === "entrega" ? "Saiu para entrega" : "Pronto para retirar") : PedidosLoja.STATUS[h.status].rotulo;
      return `<li><i class="bi bi-dot"></i>${escapar(rot)} <span class="text-secondary">· ${PedidosLoja.dataHora(h.em)}</span></li>`;
    }).join("")}</ol>`;
  }

  function desenhar() {
    const pedidos = PedidosLoja.doConsumidor(usuario.id);
    if (!pedidos.length) {
      area.innerHTML = `<div class="card-el p-5 text-center text-secondary">
        <i class="bi bi-bag fs-2 d-block mb-2"></i>Você ainda não fez nenhum pedido.<br>
        <a class="btn btn-primary mt-3" href="lojas.html"><i class="bi bi-shop-window me-2"></i>Ver lojas</a></div>`;
      return;
    }
    area.innerHTML = pedidos.map((p) => {
      const loja = Auth.usuarioPorId(p.vendedorId);
      const verificada = !!(loja && loja.empresa && loja.empresa.verificacao && loja.empresa.verificacao.status === "verificada");
      return `<article class="card-el p-4">
        <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
          <div>
            <h2 class="h6 mb-1">Pedido #${p.id} · ${escapar(p.lojaNome)}</h2>
            <div class="small text-secondary">${PedidosLoja.dataHora(p.criadoEm)} · ${p.entrega === "entrega" ? "Entrega em casa" : "Retirada na loja"}</div>
          </div>
          <div class="text-end">${PedidosLoja.selo(p)}<div class="mt-1">${seloVerificacao(verificada)}</div></div>
        </div>
        <div class="row g-3">
          <div class="col-md-6">
            <div class="small fw-semibold mb-1">Itens</div>
            ${PedidosLoja.itensHtml(p)}
            ${p.entrega === "entrega" ? `<div class="small mt-2"><i class="bi bi-geo-alt me-1"></i>${escapar(p.endereco)}</div>` : ""}
            ${p.obs ? `<div class="small mt-1 text-secondary"><i class="bi bi-chat-left-text me-1"></i>${escapar(p.obs)}</div>` : ""}
            <div class="mt-2"><span class="text-secondary small">Total estimado</span> <strong>${moeda(p.total)}</strong></div>
          </div>
          <div class="col-md-6">
            <div class="small fw-semibold mb-1">Andamento</div>
            ${linhaDoTempo(p)}
          </div>
        </div>
        ${p.status === "novo" ? `<div class="mt-3"><button type="button" class="btn btn-sm btn-outline-danger" data-cancelar="${p.id}"><i class="bi bi-x-circle me-1"></i>Cancelar pedido</button></div>` : ""}
      </article>`;
    }).join("");
  }

  area.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-cancelar]");
    if (!b) return;
    const id = Number(b.dataset.cancelar);
    if (confirm(`Cancelar o pedido #${id}?`)) {
      PedidosLoja.mudarStatus(id, "cancelado");
      desenhar();
      avisar("Pedido cancelado.", "secondary");
    }
  });

  // Se o vendedor mudar o status em outra aba, atualiza aqui
  window.addEventListener("storage", desenhar);
  setInterval(desenhar, 5000);
  document.addEventListener("DOMContentLoaded", desenhar);
})();
