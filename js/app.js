/* ==========================================================================
   app.js — Funções compartilhadas por todas as páginas
   (datas, moeda, armazenamento local, avisos e montagem do menu/rodapé)
   ========================================================================== */

/* ---------- Datas ---------- */

// Converte um objeto Date para o texto "AAAA-MM-DD" usando a data local
function paraISO(d) {
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// Data de hoje no formato "AAAA-MM-DD"
function hojeISO() {
  return paraISO(new Date());
}

// Quantos dias faltam até uma data (negativo = já passou)
function diasAte(iso) {
  const alvo = new Date(iso + "T00:00:00");
  const hoje = new Date(hojeISO() + "T00:00:00");
  return Math.round((alvo - hoje) / 86400000);
}

// "2026-11-10" -> "10/11/2026"
function dataBR(iso) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

/* ---------- Formatação ---------- */

function moeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function porcento(valor, casas = 1) {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas
  }) + "%";
}

// Evita que texto digitado pelo usuário vire HTML (segurança básica contra XSS)
function escapar(texto) {
  const mapa = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(texto).replace(/[&<>"']/g, (c) => mapa[c]);
}

// Cópia profunda de um objeto/lista simples
function clonar(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/* ---------- Armazenamento no navegador ---------- */

const Armazenamento = {
  ler(chave, padrao) {
    try {
      const texto = localStorage.getItem(chave);
      return texto ? JSON.parse(texto) : padrao;
    } catch (erro) {
      return padrao;
    }
  },
  gravar(chave, valor) {
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
      return true;
    } catch (erro) {
      return false;
    }
  },
  remover(chave) {
    try { localStorage.removeItem(chave); } catch (erro) { /* ignora */ }
  }
};

/* ---------- Avisos (toast do Bootstrap) ---------- */

function avisar(mensagem, tipo = "success") {
  const area = document.getElementById("areaAvisos");
  if (!area || typeof bootstrap === "undefined") return;
  const el = document.createElement("div");
  el.className = `toast align-items-center text-bg-${tipo} border-0`;
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", "polite");
  el.innerHTML = `<div class="d-flex"><div class="toast-body">${escapar(mensagem)}</div>
    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fechar"></button></div>`;
  area.appendChild(el);
  const toast = new bootstrap.Toast(el, { delay: 3500 });
  el.addEventListener("hidden.bs.toast", () => el.remove());
  toast.show();
}

/* ---------- Menu e rodapé (iguais em todas as páginas) ---------- */

function montarLayout() {
  const raiz = document.body.dataset.raiz || "";
  const pagina = document.body.dataset.pagina || "";
  const titulo = document.body.dataset.titulo;

  document.title = titulo ? `${titulo} | ${CONFIG.nome}` : `${CONFIG.nome} | ${CONFIG.slogan}`;

  const links = [
    { id: "inicio", href: "index.html", texto: "Início", icone: "bi-house-door" },
    { id: "painel", href: "pages/painel-pedidos.html", texto: "Pedidos", icone: "bi-truck" },
    { id: "precos", href: "pages/precos.html", texto: "Preços", icone: "bi-graph-up-arrow" },
    { id: "compras", href: "pages/compras-conjuntas.html", texto: "Compras conjuntas", icone: "bi-people" },
    { id: "consumidor", href: "pages/consumidor.html", texto: "Consumidor", icone: "bi-basket2" }
  ];

  const itens = links.map((l) => {
    const ativo = l.id === pagina;
    return `<li class="nav-item">
      <a class="nav-link ${ativo ? "active" : ""}" href="${raiz}${l.href}" ${ativo ? 'aria-current="page"' : ""}>
        <i class="bi ${l.icone} me-1"></i>${l.texto}</a></li>`;
  }).join("");

  const cabecalho = document.getElementById("cabecalho");
  if (cabecalho) {
    cabecalho.innerHTML = `
      <nav class="navbar navbar-expand-lg navbar-el sticky-top" aria-label="Navegação principal">
        <div class="container">
          <a class="navbar-brand" href="${raiz}index.html">
            <img src="${raiz}img/logo.svg" alt="" width="34" height="34">
            <span>${escapar(CONFIG.nome)}</span>
          </a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menuPrincipal"
                  aria-controls="menuPrincipal" aria-expanded="false" aria-label="Abrir menu">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="menuPrincipal">
            <ul class="navbar-nav ms-auto gap-lg-1">${itens}</ul>
          </div>
        </div>
      </nav>`;
  }

  const rodape = document.getElementById("rodape");
  if (rodape) {
    rodape.innerHTML = `
      <footer class="rodape-el py-4">
        <div class="container d-flex flex-column flex-md-row justify-content-between gap-2 small">
          <span><strong>${escapar(CONFIG.nome)}</strong> · Protótipo acadêmico da disciplina Web Coding (HTML5)</span>
          <span>Preços, pedidos e comércios são <strong>dados fictícios de exemplo</strong>.</span>
        </div>
      </footer>
      <div class="toast-container position-fixed bottom-0 end-0 p-3" id="areaAvisos"></div>`;
  }

  document.querySelectorAll("[data-nome-plataforma]").forEach((el) => {
    el.textContent = CONFIG.nome;
  });
}

document.addEventListener("DOMContentLoaded", montarLayout);
