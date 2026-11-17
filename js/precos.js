/* ==========================================================================
   precos.js — Comparação e histórico de preços (área do comerciante)
   - Indicadores do produto escolhido
   - Gráfico de linha com o histórico
   - Tabela comparando os comércios
   - Planejador simples de reposição de estoque
   ========================================================================== */

(function () {
  const select = document.getElementById("selProduto");
  const ROTULO_ESTOQUE = { ok: "Em estoque", pouco: "Pouco estoque", sem: "Sem estoque" };
  const ROTULO_TIPO = { pequeno: "Pequeno comércio", grande: "Grande rede" };

  let tendenciaAtual = "estavel";

  select.innerHTML = PRODUTOS.map((p) => `<option value="${p.id}">${escapar(p.nome)}</option>`).join("");

  // Compara o último mês com 3 meses antes para classificar a tendência
  function calcularTendencia(serie) {
    const recente = serie[serie.length - 1];
    const antes = serie[serie.length - 4];
    const variacao = (recente / antes - 1) * 100;
    if (variacao >= 5) return "alta";
    if (variacao <= -3) return "queda";
    return "estavel";
  }

  function desenharProduto() {
    const produto = PRODUTOS.find((p) => p.id === select.value);
    const serie = HISTORICO_PRECOS.valores[produto.id];
    const meses = HISTORICO_PRECOS.meses;

    const primeiro = serie[0];
    const ultimo = serie[serie.length - 1];
    const variacao = (ultimo / primeiro - 1) * 100;
    tendenciaAtual = calcularTendencia(serie);

    // Preços por comércio, do menor para o maior
    const linhas = PRECOS_COMERCIOS
      .filter((x) => x.produtoId === produto.id)
      .map((x) => ({ ...x, comercio: COMERCIOS.find((c) => c.id === x.comercioId) }))
      .sort((a, b) => a.preco - b.preco);
    const menor = linhas[0];

    /* Indicadores */
    const subiu = variacao > 0;
    const corVariacao = variacao > 1 ? "var(--el-perigo)" : variacao < -1 ? "var(--el-sucesso)" : "var(--el-texto)";
    const iconeVariacao = variacao > 1 ? "bi-arrow-up-right" : variacao < -1 ? "bi-arrow-down-right" : "bi-dash";
    const textoTendencia = { alta: "Em alta", queda: "Em queda", estavel: "Estável" }[tendenciaAtual];

    document.getElementById("indicadores").innerHTML = `
      <div class="card-el indicador">
        <div class="valor">${moeda(ultimo)}</div>
        <div class="rotulo">Preço médio em ${meses[meses.length - 1]}</div>
      </div>
      <div class="card-el indicador">
        <div class="valor" style="color:${corVariacao}"><i class="bi ${iconeVariacao}"></i> ${subiu ? "+" : ""}${porcento(variacao)}</div>
        <div class="rotulo">Variação em 6 meses</div>
      </div>
      <div class="card-el indicador">
        <div class="valor">${moeda(menor.preco)}</div>
        <div class="rotulo">Menor preço: ${escapar(menor.comercio.nome)}</div>
      </div>
      <div class="card-el indicador">
        <div class="valor">${textoTendencia}</div>
        <div class="rotulo">Tendência nos últimos 3 meses</div>
      </div>`;

    /* Gráfico */
    graficoLinha(document.getElementById("graficoHistorico"), meses, serie);

    /* Tabela de comparação */
    document.getElementById("corpoComparacao").innerHTML = linhas.map((l, i) => {
      const dif = l.preco - menor.preco;
      const difTexto = i === 0 ? '<span class="selo-melhor">Menor preço</span>' :
        `+${moeda(dif)} <span class="text-secondary small">(+${porcento((dif / menor.preco) * 100)})</span>`;
      return `<tr class="${i === 0 ? "linha-destaque" : ""}">
        <td class="text-secondary">${i + 1}</td>
        <td class="fw-medium">${escapar(l.comercio.nome)}</td>
        <td>${escapar(l.comercio.bairro)}</td>
        <td><span class="status-badge tipo-${l.comercio.tipo}">${ROTULO_TIPO[l.comercio.tipo]}</span></td>
        <td class="text-end fw-semibold">${moeda(l.preco)}</td>
        <td class="text-end">${difTexto}</td>
        <td><span class="status-badge est-${l.estoque}">${ROTULO_ESTOQUE[l.estoque]}</span></td>
      </tr>`;
    }).join("");

    // Limpa o resultado do planejador ao trocar de produto
    document.getElementById("resultadoPlano").innerHTML = "";
  }

  /* ---------- Planejador de reposição ---------- */

  const formPlano = document.getElementById("formPlano");
  formPlano.addEventListener("submit", function (evento) {
    evento.preventDefault();
    formPlano.classList.add("was-validated");
    if (!formPlano.checkValidity()) return;

    const estoque = Number(document.getElementById("planoEstoque").value);
    const consumo = Number(document.getElementById("planoConsumo").value);
    const semanas = estoque / consumo;
    const diasRestantes = Math.floor(semanas * 7);

    const fim = new Date();
    fim.setDate(fim.getDate() + diasRestantes);
    const dataFim = dataBR(paraISO(fim));
    const semanasTexto = semanas.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

    let orientacao;
    if (tendenciaAtual === "alta" && semanas <= 4) {
      orientacao = "O preço está em alta e o estoque dura poucas semanas: vale antecipar a reposição ou procurar uma compra conjunta.";
    } else if (tendenciaAtual === "alta") {
      orientacao = "O preço está em alta. Seu estoque ainda dura, mas acompanhe e programe a reposição antes de acabar.";
    } else if (tendenciaAtual === "queda") {
      orientacao = "O preço está em queda: dá para repor só o necessário e acompanhar se continua caindo.";
    } else {
      orientacao = "O preço está estável: reponha conforme o ritmo de vendas.";
    }

    document.getElementById("resultadoPlano").innerHTML = `
      <div class="alert alert-success mb-0">
        <div class="fw-semibold mb-1"><i class="bi bi-calendar-check me-1"></i>Estoque para ${semanasTexto} semana(s)</div>
        <div class="small mb-2">Acaba por volta de <strong>${dataFim}</strong>.</div>
        <div class="small">${orientacao}</div>
      </div>`;
  });

  select.addEventListener("change", desenharProduto);

  document.addEventListener("DOMContentLoaded", function () {
    desenharProduto();
    graficoBarras(document.getElementById("graficoCafeContexto"), DIAGNOSTICO.cafe);
  });
})();
