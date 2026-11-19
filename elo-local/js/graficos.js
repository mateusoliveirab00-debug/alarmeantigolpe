/* ==========================================================================
   graficos.js — Gráficos feitos só com HTML/CSS e SVG (sem bibliotecas)
   ========================================================================== */

/* Gráfico de barras horizontais.
   itens: [{ rotulo, valor, destaque? }]   opcoes: { sufixo, casas } */
function graficoBarras(elemento, itens, opcoes = {}) {
  const sufixo = opcoes.sufixo !== undefined ? opcoes.sufixo : "%";
  const casas = opcoes.casas !== undefined ? opcoes.casas : 1;
  const maximo = Math.max(...itens.map((i) => i.valor));

  elemento.innerHTML = itens.map((item) => {
    const largura = ((item.valor / maximo) * 100).toFixed(1);
    const valorTexto = item.valor.toLocaleString("pt-BR", {
      minimumFractionDigits: casas, maximumFractionDigits: casas
    }) + sufixo;
    return `<div class="barra-linha">
      <div class="barra-rotulo">${escapar(item.rotulo)}</div>
      <div class="barra-trilho" role="img" aria-label="${escapar(item.rotulo)}: ${valorTexto}">
        <div class="barra-preenchimento ${item.destaque ? "destaque" : ""}" data-largura="${largura}"></div>
      </div>
      <div class="barra-valor">${valorTexto}</div>
    </div>`;
  }).join("");

  // Anima as barras depois de desenhar
  requestAnimationFrame(() => {
    elemento.querySelectorAll(".barra-preenchimento").forEach((b) => {
      b.style.width = b.dataset.largura + "%";
    });
  });
}

/* Gráfico de linha em SVG.
   rotulos: ["Mai", "Jun", ...]   valores: [31.9, 32.8, ...] */
function graficoLinha(elemento, rotulos, valores, opcoes = {}) {
  const prefixo = opcoes.prefixo !== undefined ? opcoes.prefixo : "R$ ";
  const L = 640, A = 300, mEsq = 62, mDir = 24, mTopo = 20, mBase = 42;
  const n = valores.length;
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  const folga = (maximo - minimo) * 0.25 || 1;
  const yMin = Math.max(0, minimo - folga);
  const yMax = maximo + folga;

  const x = (i) => mEsq + (i * (L - mEsq - mDir)) / (n - 1);
  const y = (v) => mTopo + ((yMax - v) * (A - mTopo - mBase)) / (yMax - yMin);
  const formatar = (v) => prefixo + v.toFixed(2).replace(".", ",");

  // Linhas de grade e valores do eixo vertical
  let grade = "";
  for (let k = 0; k <= 4; k++) {
    const valor = yMin + (k * (yMax - yMin)) / 4;
    const py = y(valor);
    grade += `<line class="gl-grade" x1="${mEsq}" x2="${L - mDir}" y1="${py}" y2="${py}"></line>
      <text class="gl-texto" x="${mEsq - 8}" y="${py + 4}" text-anchor="end">${formatar(valor)}</text>`;
  }

  const pontos = valores.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${x(0)},${A - mBase} ${pontos} ${x(n - 1)},${A - mBase}`;

  const marcas = valores.map((v, i) =>
    `<circle class="gl-ponto" cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="5">
       <title>${escapar(rotulos[i])}: ${formatar(v)}</title></circle>
     <text class="gl-texto" x="${x(i).toFixed(1)}" y="${A - 14}" text-anchor="middle">${escapar(rotulos[i])}</text>`
  ).join("");

  const descricao = `Evolução do preço de ${formatar(valores[0])} para ${formatar(valores[n - 1])} entre ${rotulos[0]} e ${rotulos[n - 1]}`;

  elemento.innerHTML = `<svg class="grafico-linha" viewBox="0 0 ${L} ${A}" role="img" aria-label="${escapar(descricao)}">
    ${grade}
    <polygon class="gl-area" points="${area}"></polygon>
    <polyline class="gl-linha" points="${pontos}"></polyline>
    ${marcas}
  </svg>`;
}
