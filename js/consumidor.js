/* ==========================================================================
   consumidor.js — Área do consumidor
   - Compara preço e disponibilidade de um produto nos comércios
   - Filtra por bairro, tipo, estoque e favoritos
   - Guarda os comércios favoritos no localStorage
   ========================================================================== */

(function () {
  const CH_FAV = CONFIG.chaves.favoritos;
  const ROTULO_ESTOQUE = { ok: "Em estoque", pouco: "Pouco estoque", sem: "Sem estoque" };
  const ROTULO_TIPO = { pequeno: "Pequeno comércio", grande: "Grande rede" };

  let favoritos = Armazenamento.ler(CH_FAV, []);
  if (!Array.isArray(favoritos)) favoritos = [];

  const selProduto = document.getElementById("fProduto");
  const selBairro = document.getElementById("fBairro");
  const selOrdem = document.getElementById("fOrdem");
  const selTipo = document.getElementById("fTipo");
  const chkEstoque = document.getElementById("fEstoque");
  const chkFavoritos = document.getElementById("fFavoritos");

  // Preenche as listas de escolha
  selProduto.innerHTML = PRODUTOS.map((p) => `<option value="${p.id}">${escapar(p.nome)}</option>`).join("");
  const bairros = [...new Set(COMERCIOS.map((c) => c.bairro))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  selBairro.innerHTML = '<option value="todos">Todos os bairros</option>' +
    bairros.map((b) => `<option value="${escapar(b)}">${escapar(b)}</option>`).join("");

  function media(lista) {
    return lista.reduce((soma, x) => soma + x.preco, 0) / lista.length;
  }

  // Compara o preço médio do pequeno comércio com o da grande rede
  function desenharComparacaoTipos(produtoId) {
    const todos = PRECOS_COMERCIOS
      .filter((x) => x.produtoId === produtoId)
      .map((x) => ({ ...x, tipo: COMERCIOS.find((c) => c.id === x.comercioId).tipo }));
    const pequenos = todos.filter((x) => x.tipo === "pequeno");
    const grandes = todos.filter((x) => x.tipo === "grande");
    const mediaPequeno = media(pequenos);
    const mediaGrande = media(grandes);
    const dif = (mediaPequeno / mediaGrande - 1) * 100;

    document.getElementById("comparacaoTipos").innerHTML = `
      <div class="card-el p-3 d-flex flex-wrap align-items-center gap-3">
        <span class="icone-circulo acento"><i class="bi bi-bar-chart"></i></span>
        <div class="flex-grow-1">
          <div class="fw-semibold">Preço médio deste produto</div>
          <div class="small text-secondary">
            Pequeno comércio: <strong>${moeda(mediaPequeno)}</strong> ·
            Grande rede: <strong>${moeda(mediaGrande)}</strong>
            (${dif >= 0 ? "+" : ""}${porcento(dif)} de diferença)
          </div>
        </div>
      </div>`;
  }

  function desenhar() {
    const produtoId = selProduto.value;

    let itens = PRECOS_COMERCIOS
      .filter((x) => x.produtoId === produtoId)
      .map((x) => ({ ...x, comercio: COMERCIOS.find((c) => c.id === x.comercioId) }));

    // Aplica os filtros
    if (selBairro.value !== "todos") itens = itens.filter((x) => x.comercio.bairro === selBairro.value);
    if (selTipo.value !== "todos") itens = itens.filter((x) => x.comercio.tipo === selTipo.value);
    if (chkEstoque.checked) itens = itens.filter((x) => x.estoque !== "sem");
    if (chkFavoritos.checked) itens = itens.filter((x) => favoritos.includes(x.comercio.id));

    // Ordena
    if (selOrdem.value === "nome") {
      itens.sort((a, b) => a.comercio.nome.localeCompare(b.comercio.nome, "pt-BR"));
    } else {
      itens.sort((a, b) => a.preco - b.preco);
    }

    // "Melhor preço" = menor preço entre os que têm estoque na lista filtrada
    const disponiveis = itens.filter((x) => x.estoque !== "sem");
    const melhor = disponiveis.length ? Math.min(...disponiveis.map((x) => x.preco)) : null;

    document.getElementById("contadorResultados").textContent = `(${itens.length})`;
    document.getElementById("contadorFavoritos").textContent = favoritos.length ? `(${favoritos.length})` : "";
    desenharComparacaoTipos(produtoId);

    const area = document.getElementById("resultados");
    if (itens.length === 0) {
      area.innerHTML = `<div class="card-el p-4 text-center text-secondary" style="grid-column: 1 / -1;">
        <i class="bi bi-search fs-3 d-block mb-2"></i>Nenhum comércio encontrado com esses filtros.</div>`;
      return;
    }

    area.innerHTML = itens.map((x) => {
      const c = x.comercio;
      const ehFavorito = favoritos.includes(c.id);
      const ehMelhor = melhor !== null && x.estoque !== "sem" && x.preco === melhor;
      return `<article class="card-el p-4 ${ehMelhor ? "border-warning" : ""}">
        <div class="d-flex justify-content-between align-items-start gap-2">
          <div>
            <h3 class="h6 mb-1">${escapar(c.nome)}</h3>
            <span class="status-badge tipo-${c.tipo}">${ROTULO_TIPO[c.tipo]}</span>
          </div>
          <button type="button" class="btn-favorito" data-id="${c.id}"
                  aria-pressed="${ehFavorito}" aria-label="${ehFavorito ? "Remover" : "Adicionar"} ${escapar(c.nome)} dos favoritos">
            <i class="bi ${ehFavorito ? "bi-heart-fill" : "bi-heart"}"></i>
          </button>
        </div>
        <p class="small text-secondary my-2">
          <i class="bi bi-geo-alt me-1"></i>${escapar(c.bairro)}<br>
          <i class="bi bi-clock me-1"></i>${escapar(c.horario)}
        </p>
        <div class="d-flex justify-content-between align-items-center">
          <span class="preco-grande">${moeda(x.preco)}</span>
          <span class="status-badge est-${x.estoque}">${ROTULO_ESTOQUE[x.estoque]}</span>
        </div>
        ${ehMelhor ? '<div class="mt-2"><span class="selo-melhor"><i class="bi bi-star-fill me-1"></i>Melhor preço</span></div>' : ""}
      </article>`;
    }).join("");
  }

  // Favoritar / desfavoritar
  document.getElementById("resultados").addEventListener("click", function (evento) {
    const botao = evento.target.closest(".btn-favorito");
    if (!botao) return;
    const id = Number(botao.dataset.id);
    if (favoritos.includes(id)) {
      favoritos = favoritos.filter((f) => f !== id);
    } else {
      favoritos.push(id);
    }
    Armazenamento.gravar(CH_FAV, favoritos);
    desenhar();
  });

  [selProduto, selBairro, selOrdem, selTipo, chkEstoque, chkFavoritos].forEach((el) => {
    el.addEventListener("change", desenhar);
  });

  document.addEventListener("DOMContentLoaded", desenhar);
})();
