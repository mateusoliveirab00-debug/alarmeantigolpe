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

// Estes dados pertencem a cada conta: a chave ganha o id do usuário logado
const CHAVES_POR_USUARIO = ["pedidos", "compras", "participacoes", "favoritos"].map((k) => CONFIG.chaves[k]);

function chaveDoUsuario(chave) {
  if (CHAVES_POR_USUARIO.includes(chave) && typeof Auth !== "undefined") {
    const u = Auth.usuarioAtual();
    if (u) return `${chave}:${u.id}`;
  }
  return chave;
}

const Armazenamento = {
  ler(chave, padrao) {
    chave = chaveDoUsuario(chave);
    try {
      const texto = localStorage.getItem(chave);
      return texto ? JSON.parse(texto) : padrao;
    } catch (erro) {
      return padrao;
    }
  },
  gravar(chave, valor) {
    chave = chaveDoUsuario(chave);
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
      return true;
    } catch (erro) {
      return false;
    }
  },
  remover(chave) {
    chave = chaveDoUsuario(chave);
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

/* ---------- Selo de empresa verificada ---------- */

function seloVerificacao(verificada) {
  return verificada
    ? '<span class="selo-verificada"><i class="bi bi-patch-check-fill"></i>Empresa verificada</span>'
    : '<span class="selo-analise"><i class="bi bi-hourglass-split"></i>Em análise</span>';
}

// Selo para o vendedor logado (nada para consumidor)
function seloEmpresa(usuario) {
  if (!usuario || usuario.perfil !== "vendedor" || !usuario.empresa) return "";
  const v = usuario.empresa.verificacao;
  return `<div class="mt-1">${seloVerificacao(!!v && v.status === "verificada")}</div>`;
}

/* ---------- Menu e rodapé (iguais em todas as páginas) ---------- */

function montarLayout() {
  const raiz = document.body.dataset.raiz || "";
  const pagina = document.body.dataset.pagina || "";
  const titulo = document.body.dataset.titulo;

  document.title = titulo ? `${titulo} | ${CONFIG.nome}` : `${CONFIG.nome} | ${CONFIG.slogan}`;

  // Cada perfil vê somente as suas telas
  const TELAS = {
    vendedor: [
      { id: "painel", href: "pages/painel-pedidos.html", texto: "Pedidos", icone: "bi-truck" },
      { id: "precos", href: "pages/precos.html", texto: "Preços", icone: "bi-graph-up-arrow" },
      { id: "compras", href: "pages/compras-conjuntas.html", texto: "Compras conjuntas", icone: "bi-people" },
      { id: "clientes", href: "pages/pedidos-clientes.html", texto: "Pedidos de clientes", icone: "bi-bag-check", contador: true }
    ],
    consumidor: [
      { id: "consumidor", href: "pages/consumidor.html", texto: "Comparar preços", icone: "bi-basket2" },
      { id: "lojas", href: "pages/lojas.html", texto: "Lojas", icone: "bi-shop-window" },
      { id: "meus-pedidos", href: "pages/meus-pedidos.html", texto: "Meus pedidos", icone: "bi-bag-check" }
    ]
  };

  const usuario = (typeof Auth !== "undefined") ? Auth.usuarioAtual() : null;
  const links = [{ id: "inicio", href: "index.html", texto: "Início", icone: "bi-house-door" }]
    .concat(usuario ? TELAS[usuario.perfil] : []);

  // Pedidos novos de clientes que o vendedor ainda não respondeu (bolinha no menu)
  const novosPedidos = (usuario && usuario.perfil === "vendedor")
    ? Armazenamento.ler(CONFIG.chaves.pedidosLoja, []).filter((p) => p.vendedorId === usuario.id && p.status === "novo").length
    : 0;

  let itens = links.map((l) => {
    const ativo = l.id === pagina;
    const bolinha = (l.contador && novosPedidos)
      ? ` <span class="badge rounded-pill text-bg-danger" aria-label="${novosPedidos} novo(s)">${novosPedidos}</span>` : "";
    return `<li class="nav-item">
      <a class="nav-link ${ativo ? "active" : ""}" href="${raiz}${l.href}" ${ativo ? 'aria-current="page"' : ""}>
        <i class="bi ${l.icone} me-1"></i>${l.texto}${bolinha}</a></li>`;
  }).join("");

  if (usuario) {
    const empresa = usuario.empresa ? usuario.empresa.nomeFantasia : "";
    const primeiroNome = escapar(usuario.nome.split(" ")[0]);
    itens += `<li class="nav-item dropdown ms-lg-2">
      <button class="btn btn-usuario dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
        <i class="bi ${usuario.perfil === "vendedor" ? "bi-shop" : "bi-person-circle"} me-1"></i>${primeiroNome}
      </button>
      <ul class="dropdown-menu dropdown-menu-end">
        <li class="px-3 py-2">
          <div class="fw-semibold">${escapar(usuario.nome)}</div>
          ${empresa ? `<div class="small text-secondary">${escapar(empresa)}</div>` : ""}
          <div class="small text-secondary">${escapar(usuario.email)}</div>
          <span class="badge mt-1 ${usuario.perfil === "vendedor" ? "tipo-pequeno" : "est-pouco"}">${usuario.perfil === "vendedor" ? "Vendedor" : "Consumidor"}</span>
          ${seloEmpresa(usuario)}
        </li>
        <li><hr class="dropdown-divider"></li>
        <li><a class="dropdown-item" href="${raiz}pages/perfil.html"><i class="bi bi-person-gear me-2"></i>Minha conta</a></li>
        <li><button class="dropdown-item" type="button" id="btnSair"><i class="bi bi-box-arrow-right me-2"></i>Sair</button></li>
      </ul></li>`;
  } else {
    itens += `<li class="nav-item ms-lg-2"><a class="nav-link ${pagina === "login" ? "active" : ""}" href="${raiz}pages/login.html"><i class="bi bi-box-arrow-in-right me-1"></i>Entrar</a></li>
      <li class="nav-item"><a class="btn btn-accent btn-sm mt-1 mt-lg-0 ms-lg-1" href="${raiz}pages/cadastro.html">Criar conta</a></li>`;
  }

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
            <ul class="navbar-nav ms-auto gap-lg-1 align-items-lg-center">${itens}</ul>
          </div>
        </div>
      </nav>`;
    const btnSair = document.getElementById("btnSair");
    if (btnSair) btnSair.addEventListener("click", () => Auth.sair());
  }

  const rodape = document.getElementById("rodape");
  if (rodape && !rodape.childElementCount) { // só monta uma vez (evita apagar avisos na tela)
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

  // Boas-vindas logo após entrar ou criar a conta
  if (usuario && Auth.consumirBoasVindas()) {
    avisar(`Bem-vindo(a), ${usuario.nome.split(" ")[0]}!`);
  }
}

document.addEventListener("DOMContentLoaded", montarLayout);
