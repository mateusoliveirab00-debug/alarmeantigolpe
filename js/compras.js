/* ==========================================================================
   compras.js — Compras conjuntas (área do comerciante)
   - Mostra as compras abertas com barra de progresso até a meta
   - Permite participar (soma a quantidade à meta) e cancelar a participação
   - Permite criar uma nova compra conjunta
   - Guarda tudo no localStorage
   ========================================================================== */

(function () {
  const CH_COMPRAS = CONFIG.chaves.compras;
  const CH_PART = CONFIG.chaves.participacoes;

  let compras = Armazenamento.ler(CH_COMPRAS, null);
  if (!Array.isArray(compras)) compras = clonar(COMPRAS_EXEMPLO);
  let participacoes = Armazenamento.ler(CH_PART, null);
  if (!Array.isArray(participacoes)) participacoes = [];
  salvarTudo();

  const pequenos = COMERCIOS.filter((c) => c.tipo === "pequeno");

  function salvarTudo() {
    Armazenamento.gravar(CH_COMPRAS, compras);
    Armazenamento.gravar(CH_PART, participacoes);
  }

  // Situação da compra: meta atingida, encerrada (prazo vencido sem meta) ou aberta
  function situacao(c) {
    if (c.qtdAtual >= c.metaQtd) return "meta";
    if (diasAte(c.prazo) < 0) return "encerrada";
    return "aberta";
  }

  /* ---------- Resumo ---------- */

  function desenharResumo() {
    const abertas = compras.filter((c) => situacao(c) === "aberta").length;
    const participantes = compras.reduce((soma, c) => soma + c.participantes, 0);
    const economia = compras.reduce((soma, c) => soma + (c.precoIndividual - c.precoConjunto) * c.qtdAtual, 0);

    document.getElementById("resumo").innerHTML = `
      <div class="card-el indicador"><div class="valor">${abertas}</div><div class="rotulo">Compras abertas</div></div>
      <div class="card-el indicador"><div class="valor">${participantes}</div><div class="rotulo">Participações de comerciantes</div></div>
      <div class="card-el indicador"><div class="valor" style="color:var(--el-sucesso)">${moeda(economia)}</div>
        <div class="rotulo">Economia estimada do grupo</div></div>`;
  }

  /* ---------- Cartões das compras ---------- */

  function textoPrazo(c) {
    const d = diasAte(c.prazo);
    if (d < 0) return "Prazo encerrado";
    if (d === 0) return "Último dia";
    if (d === 1) return "Falta 1 dia";
    return `Faltam ${d} dias`;
  }

  function desenharCartoes() {
    const lista = document.getElementById("listaCompras");
    if (compras.length === 0) {
      lista.innerHTML = '<p class="text-secondary">Nenhuma compra conjunta cadastrada.</p>';
      return;
    }

    lista.innerHTML = compras.map((c) => {
      const sit = situacao(c);
      const pct = Math.min(100, Math.round((c.qtdAtual / c.metaQtd) * 100));
      const economiaUn = c.precoIndividual - c.precoConjunto;
      const economiaPct = (economiaUn / c.precoIndividual) * 100;

      const selo = {
        aberta: '<span class="status-badge st-pedido"><i class="bi bi-hourglass-split"></i>Aberta</span>',
        meta: '<span class="status-badge st-entregue"><i class="bi bi-check2-circle"></i>Meta atingida</span>',
        encerrada: '<span class="status-badge est-sem"><i class="bi bi-x-circle"></i>Encerrada</span>'
      }[sit];

      return `<article class="card-el p-4 d-flex flex-column">
        <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
          <h3 class="h6 mb-0">${escapar(c.produto)}</h3>${selo}
        </div>
        <p class="small text-secondary mb-3">
          Fornecedor: ${escapar(c.fornecedor)}<br>Organiza: ${escapar(c.organizador)}
        </p>
        <div class="d-flex align-items-baseline gap-2">
          <span class="preco-grande">${moeda(c.precoConjunto)}</span>
          <span class="preco-riscado small">${moeda(c.precoIndividual)}</span>
          <span class="selo-melhor ms-auto">−${porcento(economiaPct, 0)}</span>
        </div>
        <p class="small text-secondary mb-3">Economia de ${moeda(economiaUn)} por unidade</p>

        <div class="d-flex justify-content-between small mb-1">
          <span>${c.qtdAtual} de ${c.metaQtd} un.</span><span class="fw-semibold">${pct}%</span>
        </div>
        <div class="progress mb-2" role="progressbar" aria-label="Progresso da meta" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
          <div class="progress-bar ${sit === "meta" ? "meta-atingida" : ""}" style="width:${pct}%"></div>
        </div>
        <div class="d-flex justify-content-between small text-secondary mb-3">
          <span><i class="bi bi-people me-1"></i>${c.participantes} comerciante(s)</span>
          <span><i class="bi bi-clock me-1"></i>${textoPrazo(c)}</span>
        </div>
        <button type="button" class="btn btn-primary mt-auto" data-acao="participar" data-id="${c.id}" ${sit === "aberta" ? "" : "disabled"}>
          <i class="bi bi-plus-circle me-1"></i>Participar
        </button>
      </article>`;
    }).join("");
  }

  /* ---------- Minhas participações ---------- */

  function desenharParticipacoes() {
    const corpo = document.getElementById("corpoParticipacoes");
    if (participacoes.length === 0) {
      corpo.innerHTML = `<tr><td colspan="5" class="text-center text-secondary py-4">
        Você ainda não participou de nenhuma compra conjunta.</td></tr>`;
      return;
    }
    corpo.innerHTML = participacoes.map((p, indice) => {
      const c = compras.find((x) => x.id === p.compraId);
      if (!c) return "";
      const economia = (c.precoIndividual - c.precoConjunto) * p.quantidade;
      return `<tr>
        <td class="fw-medium">${escapar(c.produto)}</td>
        <td>${escapar(p.comercio)}</td>
        <td class="text-end">${p.quantidade}</td>
        <td class="text-end text-success fw-semibold">${moeda(economia)}</td>
        <td class="text-end">
          <button type="button" class="btn btn-sm btn-outline-danger" data-acao="cancelar" data-indice="${indice}">
            Cancelar</button>
        </td>
      </tr>`;
    }).join("");
  }

  function atualizarTudo() {
    desenharResumo();
    desenharCartoes();
    desenharParticipacoes();
  }

  /* ---------- Participar ---------- */

  const formParticipar = document.getElementById("formParticipar");
  const campoComercio = document.getElementById("partComercio");
  const campoQtd = document.getElementById("partQtd");
  const campoId = document.getElementById("partCompraId");

  campoComercio.innerHTML = '<option value="" selected disabled>Selecione...</option>' +
    pequenos.map((c) => `<option value="${escapar(c.nome)}">${escapar(c.nome)}</option>`).join("");

  function simularEconomia() {
    const c = compras.find((x) => x.id === Number(campoId.value));
    const qtd = Number(campoQtd.value);
    const caixa = document.getElementById("simulacaoParticipar");
    if (!c || !qtd || qtd < 1) {
      caixa.textContent = "Informe a quantidade para ver a economia.";
      return;
    }
    const total = qtd * c.precoConjunto;
    const economia = qtd * (c.precoIndividual - c.precoConjunto);
    caixa.innerHTML = `Total: <strong>${moeda(total)}</strong> · Economia: <strong>${moeda(economia)}</strong>`;
  }
  campoQtd.addEventListener("input", simularEconomia);

  document.getElementById("listaCompras").addEventListener("click", function (evento) {
    const botao = evento.target.closest('button[data-acao="participar"]');
    if (!botao) return;
    const c = compras.find((x) => x.id === Number(botao.dataset.id));
    if (!c) return;
    campoId.value = c.id;
    document.getElementById("resumoParticipar").textContent = `${c.produto} — ${moeda(c.precoConjunto)} por unidade`;
    formParticipar.reset();
    formParticipar.classList.remove("was-validated");
    simularEconomia();
    bootstrap.Modal.getOrCreateInstance(document.getElementById("modalParticipar")).show();
  });

  formParticipar.addEventListener("submit", function (evento) {
    evento.preventDefault();
    formParticipar.classList.add("was-validated");
    if (!formParticipar.checkValidity()) return;

    const c = compras.find((x) => x.id === Number(campoId.value));
    const qtd = Number(campoQtd.value);
    c.qtdAtual += qtd;
    c.participantes += 1;
    participacoes.push({ compraId: c.id, comercio: campoComercio.value, quantidade: qtd });
    salvarTudo();
    atualizarTudo();
    bootstrap.Modal.getInstance(document.getElementById("modalParticipar")).hide();
    avisar(situacao(c) === "meta" ? "Participação registrada — meta atingida!" : "Participação registrada.");
  });

  // Cancelar participação (devolve a quantidade à compra)
  document.getElementById("corpoParticipacoes").addEventListener("click", function (evento) {
    const botao = evento.target.closest('button[data-acao="cancelar"]');
    if (!botao) return;
    const indice = Number(botao.dataset.indice);
    const p = participacoes[indice];
    if (!p || !confirm("Cancelar esta participação?")) return;
    const c = compras.find((x) => x.id === p.compraId);
    if (c) {
      c.qtdAtual = Math.max(0, c.qtdAtual - p.quantidade);
      c.participantes = Math.max(0, c.participantes - 1);
    }
    participacoes.splice(indice, 1);
    salvarTudo();
    atualizarTudo();
    avisar("Participação cancelada.", "secondary");
  });

  /* ---------- Nova compra conjunta ---------- */

  const formNova = document.getElementById("formNova");
  const nProduto = document.getElementById("nProduto");
  const nOrganizador = document.getElementById("nOrganizador");
  const nPrazo = document.getElementById("nPrazo");
  const nPrecoInd = document.getElementById("nPrecoInd");
  const nPrecoConj = document.getElementById("nPrecoConj");

  nProduto.innerHTML = '<option value="" selected disabled>Selecione...</option>' +
    PRODUTOS.map((p) => `<option value="${escapar(p.nome)}">${escapar(p.nome)}</option>`).join("");
  nOrganizador.innerHTML = '<option value="" selected disabled>Selecione...</option>' +
    pequenos.map((c) => `<option value="${escapar(c.nome)}">${escapar(c.nome)}</option>`).join("");
  nPrazo.min = hojeISO();

  // O preço conjunto precisa ser menor que o individual
  function validarPrecos() {
    const ind = Number(nPrecoInd.value);
    const conj = Number(nPrecoConj.value);
    if (nPrecoConj.value && ind && conj >= ind) {
      nPrecoConj.setCustomValidity("O preço conjunto deve ser menor que o individual.");
    } else {
      nPrecoConj.setCustomValidity("");
    }
  }
  nPrecoInd.addEventListener("input", validarPrecos);
  nPrecoConj.addEventListener("input", validarPrecos);

  formNova.addEventListener("submit", function (evento) {
    evento.preventDefault();
    validarPrecos();
    formNova.classList.add("was-validated");
    if (!formNova.checkValidity()) return;

    const novoId = compras.length ? Math.max(...compras.map((c) => c.id)) + 1 : 1;
    compras.push({
      id: novoId,
      produto: nProduto.value,
      fornecedor: document.getElementById("nFornecedor").value.trim(),
      organizador: nOrganizador.value,
      metaQtd: Number(document.getElementById("nMeta").value),
      qtdAtual: 0,
      participantes: 0,
      precoIndividual: Number(nPrecoInd.value),
      precoConjunto: Number(nPrecoConj.value),
      prazo: nPrazo.value
    });
    salvarTudo();
    atualizarTudo();
    bootstrap.Modal.getInstance(document.getElementById("modalNova")).hide();
    avisar("Compra conjunta criada.");
  });

  document.getElementById("modalNova").addEventListener("hidden.bs.modal", function () {
    formNova.reset();
    nPrecoConj.setCustomValidity("");
    formNova.classList.remove("was-validated");
  });

  /* ---------- Restaurar exemplos ---------- */

  document.getElementById("btnRestaurar").addEventListener("click", function () {
    if (confirm("Voltar para as compras de exemplo? O que você cadastrou será perdido.")) {
      compras = clonar(COMPRAS_EXEMPLO);
      participacoes = [];
      salvarTudo();
      atualizarTudo();
      avisar("Dados de exemplo restaurados.", "secondary");
    }
  });

  document.addEventListener("DOMContentLoaded", atualizarTudo);
})();
