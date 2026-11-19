/* ==========================================================================
   lojas.js — Lojas cadastradas (área do consumidor)
   Lista os vendedores cadastrados e permite fazer um pedido a eles.
   ========================================================================== */

(function () {
  const usuario = Auth.usuarioAtual();
  const lista = document.getElementById("listaLojas");
  const busca = document.getElementById("busca");
  const selCategoria = document.getElementById("fCategoria");
  const soVerificadas = document.getElementById("soVerificadas");
  const modalEl = document.getElementById("modalPedido");
  const form = document.getElementById("formPedido");
  let lojaEscolhida = null;

  selCategoria.innerHTML += Object.entries(Auth.CATEGORIAS)
    .map(([id, nome]) => `<option value="${id}">${escapar(nome)}</option>`).join("");

  /* ---------- Lista de lojas ---------- */
  function desenhar() {
    const todas = Auth.lojas();
    const texto = busca.value.trim().toLowerCase();
    const itens = todas.filter((l) =>
      (!texto || (l.nomeFantasia + " " + l.bairro + " " + l.cidade).toLowerCase().includes(texto)) &&
      (!selCategoria.value || l.categoria === selCategoria.value) &&
      (!soVerificadas.checked || l.verificada));

    document.getElementById("contador").textContent = `(${itens.length})`;

    if (!todas.length) {
      lista.innerHTML = `<div class="card-el p-4 text-center text-secondary" style="grid-column: 1 / -1;">
        <i class="bi bi-shop-window fs-3 d-block mb-2"></i>
        Ainda não há lojas cadastradas.<br>
        <span class="small">Para testar o protótipo, saia e crie uma conta de <strong>vendedor</strong>; ela aparecerá aqui.</span></div>`;
      return;
    }
    if (!itens.length) {
      lista.innerHTML = `<div class="card-el p-4 text-center text-secondary" style="grid-column: 1 / -1;">
        <i class="bi bi-search fs-3 d-block mb-2"></i>Nenhuma loja encontrada com esses filtros.</div>`;
      return;
    }

    lista.innerHTML = itens.map((l) => `
      <article class="card-el p-4 d-flex flex-column">
        <h3 class="h6 mb-2">${escapar(l.nomeFantasia)}</h3>
        <div class="mb-2">${seloVerificacao(l.verificada)}</div>
        <p class="small text-secondary my-2 flex-grow-1">
          <i class="bi bi-tag me-1"></i>${escapar(Auth.CATEGORIAS[l.categoria] || "Comércio")}<br>
          <i class="bi bi-geo-alt me-1"></i>${escapar(l.bairro)} · ${escapar(l.cidade)}/${escapar(l.uf)}<br>
          <i class="bi bi-telephone me-1"></i>${Auth.Mascara.telefone(l.telefone)}
        </p>
        <button type="button" class="btn btn-primary" data-loja="${l.id}"><i class="bi bi-bag-plus me-2"></i>Fazer pedido</button>
      </article>`).join("");
  }

  [busca, selCategoria, soVerificadas].forEach((el) => el.addEventListener("input", desenhar));

  /* ---------- Janela de pedido ---------- */
  const precoRef = (id) => HISTORICO_PRECOS.valores[id].slice(-1)[0];

  document.getElementById("linhasProdutos").innerHTML = PRODUTOS.map((p) => `
    <div class="linha-produto">
      <label for="q-${p.id}" class="flex-grow-1">
        <span class="d-block fw-medium">${escapar(p.nome)}</span>
        <span class="small text-secondary">${moeda(precoRef(p.id))} cada</span>
      </label>
      <input id="q-${p.id}" type="number" min="0" max="999" value="0" class="form-control form-control-sm campo-qtd"
             data-produto="${p.id}" inputmode="numeric" aria-label="Quantidade de ${escapar(p.curto)}">
    </div>`).join("");

  function itensEscolhidos() {
    return PRODUTOS.map((p) => ({
      produtoId: p.id, nome: p.nome, qtd: Math.max(0, Math.min(999, parseInt(document.getElementById("q-" + p.id).value, 10) || 0)),
      precoRef: precoRef(p.id)
    })).filter((i) => i.qtd > 0);
  }

  function atualizarTotal() {
    document.getElementById("totalEstimado").textContent =
      moeda(itensEscolhidos().reduce((s, i) => s + i.qtd * i.precoRef, 0));
    document.getElementById("erroItens").classList.add("d-none");
  }

  document.getElementById("linhasProdutos").addEventListener("input", atualizarTotal);
  form.querySelectorAll('input[name="entrega"]').forEach((r) => r.addEventListener("change", () => {
    document.getElementById("blocoEndereco").hidden = form.elements.entrega.value !== "entrega";
  }));

  lista.addEventListener("click", (e) => {
    const botao = e.target.closest("button[data-loja]");
    if (!botao) return;
    lojaEscolhida = Auth.lojas().find((l) => l.id === botao.dataset.loja);
    if (!lojaEscolhida) return;
    document.getElementById("lojaDoPedido").textContent = lojaEscolhida.nomeFantasia;
    form.reset();
    document.getElementById("blocoEndereco").hidden = true;
    form.classList.remove("was-validated");
    atualizarTotal();
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const itens = itensEscolhidos();
    const entrega = form.elements.entrega.value;
    const campoEnd = document.getElementById("pEndereco");
    let ok = true;

    if (!itens.length) { document.getElementById("erroItens").classList.remove("d-none"); ok = false; }
    campoEnd.classList.remove("is-invalid");
    if (entrega === "entrega" && campoEnd.value.trim().length < 5) { campoEnd.classList.add("is-invalid"); ok = false; }
    if (!ok) return;

    const pedido = PedidosLoja.criar({
      vendedorId: lojaEscolhida.id, lojaNome: lojaEscolhida.nomeFantasia,
      consumidorId: usuario.id, consumidorNome: usuario.nome, consumidorTelefone: usuario.telefone,
      itens, entrega, endereco: entrega === "entrega" ? campoEnd.value.trim() : "",
      obs: document.getElementById("pObs").value.trim()
    });
    bootstrap.Modal.getInstance(modalEl).hide();
    avisar(`Pedido #${pedido.id} enviado para ${lojaEscolhida.nomeFantasia}! Acompanhe em "Meus pedidos".`);
  });

  // A análise do CNPJ pode terminar enquanto a página está aberta
  setInterval(() => { if (!modalEl.classList.contains("show")) desenhar(); }, 4000);
  document.addEventListener("DOMContentLoaded", desenhar);
})();
