/* ==========================================================================
   auth.js — Cadastro, login e controle de acesso por perfil
   (consumidor × vendedor). Carregado no <head>, antes da página aparecer.

   ATENÇÃO: protótipo sem banco de dados. As contas ficam no localStorage do
   navegador e NÃO oferecem segurança real. Em produção, a autenticação precisa
   de um servidor (senha com bcrypt/argon2, sessão/token, HTTPS).

   Como usar em cada página (dentro do <head>, depois de config.js):
     <script src="../js/auth.js" data-raiz="../" data-acesso="vendedor"></script>
   data-acesso:
     "publica"    -> qualquer pessoa (página inicial)
     "visitante"  -> só quem NÃO está logado (login, cadastro, recuperar senha)
     "logado"     -> qualquer perfil logado (minha conta)
     "consumidor" -> só consumidor logado
     "vendedor"   -> só vendedor logado
   ========================================================================== */

(function (global) {
  "use strict";

  const script = document.currentScript;
  const RAIZ = script ? (script.dataset.raiz || "") : "";
  const ACESSO = script ? (script.dataset.acesso || "publica") : "publica";

  const CH = (global.CONFIG && CONFIG.chaves) || {};
  const CH_USUARIOS = CH.usuarios || "elolocal:usuarios";
  const CH_SESSAO = CH.sessao || "elolocal:sessao";
  const CH_BOAS_VINDAS = CH.boasVindas || "elolocal:boasvindas";
  const CH_RECUPERACAO = CH.recuperacao || "elolocal:recuperacao";

  // No protótipo a "análise do CNPJ" é simulada e termina sozinha após alguns segundos
  const TEMPO_ANALISE_MS = 15000;

  const CATEGORIAS = {
    mercearia: "Mercearia / mercadinho", hortifruti: "Hortifruti / feira", padaria: "Padaria / confeitaria",
    acougue: "Açougue / peixaria", bebidas: "Bebidas / conveniência", atacado: "Atacado / distribuidor", outro: "Outro"
  };

  const PAGINA_INICIAL = {
    consumidor: "pages/consumidor.html",
    vendedor: "pages/painel-pedidos.html"
  };

  /* ---------- Armazenamento (com proteção contra navegador bloqueado) ---------- */
  function ler(chave, padrao) {
    try {
      const t = localStorage.getItem(chave);
      return t ? JSON.parse(t) : padrao;
    } catch (e) { return padrao; }
  }
  function gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); return true; }
    catch (e) { return false; }
  }

  /* ---------- Validações ----------
     Cada função devolve "" quando está certo ou o texto do erro. */
  const apenasDigitos = (v) => String(v || "").replace(/\D/g, "");

  const Validar = {
    nome(v, rotulo = "o nome completo") {
      const t = String(v || "").trim().replace(/\s+/g, " ");
      if (!t) return `Informe ${rotulo}.`;
      const partes = t.split(" ");
      const letras = /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ'.\-]*$/;
      if (partes.length < 2 || !partes.every((p) => letras.test(p))) {
        return "Digite nome e sobrenome, só com letras. Ex.: Maria da Silva";
      }
      return "";
    },

    email(v) {
      const t = String(v || "").trim();
      if (!t) return "Informe o e-mail.";
      const ok = t.length <= 254 &&
        /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}$/.test(t) &&
        !t.includes("..") && !t.startsWith(".") && !t.split("@")[0].endsWith(".");
      return ok ? "" : "E-mail inválido. Use o formato nome@dominio.com (ex.: maria@gmail.com)";
    },

    telefone(v) {
      const d = apenasDigitos(v);
      if (!d) return "Informe o telefone.";
      if (d.length !== 10 && d.length !== 11) return "Digite o DDD e o número. Ex.: (92) 91234-5678";
      if (!/^[1-9][1-9]/.test(d)) return "DDD inválido. Ex.: (92) 91234-5678";
      if (d.length === 11 && d[2] !== "9") return "Celular deve começar com 9 depois do DDD. Ex.: (92) 91234-5678";
      if (d.length === 10 && !/[2-5]/.test(d[2])) return "Telefone fixo inválido. Ex.: (92) 3234-5678";
      return "";
    },

    cnpj(v) {
      const d = apenasDigitos(v);
      if (!d) return "Informe o CNPJ da empresa.";
      if (d.length !== 14) return "O CNPJ tem 14 números. Ex.: 11.222.333/0001-81";
      if (/^(\d)\1+$/.test(d)) return "CNPJ inválido.";
      const calc = (base) => {
        let soma = 0;
        let peso = base.length - 7;
        for (let i = 0; i < base.length; i++) {
          soma += Number(base[i]) * peso--;
          if (peso < 2) peso = 9;
        }
        const r = soma % 11;
        return r < 2 ? 0 : 11 - r;
      };
      const d1 = calc(d.slice(0, 12));
      const d2 = calc(d.slice(0, 12) + d1);
      return (d1 === Number(d[12]) && d2 === Number(d[13])) ? "" : "CNPJ inválido. Confira os números digitados.";
    },

    codigo(v) {
      return /^\d{6}$/.test(apenasDigitos(v)) ? "" : "O código tem 6 números. Ex.: 123456";
    },

    cep(v) {
      const d = apenasDigitos(v);
      if (!d) return "Informe o CEP.";
      return d.length === 8 ? "" : "O CEP tem 8 números. Ex.: 69010-000";
    },

    senha(v) {
      const t = String(v || "");
      if (!t) return "Crie uma senha.";
      if (t.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
      if (!/[A-Za-zÀ-ÿ]/.test(t) || !/\d/.test(t)) return "Use letras e números na senha.";
      return "";
    },

    obrigatorio(v, rotulo = "este campo", minimo = 2) {
      const t = String(v || "").trim();
      if (!t) return `Preencha ${rotulo}.`;
      if (t.length < minimo) return `Use pelo menos ${minimo} caracteres em ${rotulo}.`;
      return "";
    }
  };

  /* ---------- Máscaras de digitação ---------- */
  const Mascara = {
    telefone(v) {
      const d = apenasDigitos(v).slice(0, 11);
      if (d.length <= 2) return d ? `(${d}` : "";
      if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
      if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
      return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    },
    cnpj(v) {
      const d = apenasDigitos(v).slice(0, 14);
      return d.replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    },
    codigo(v) { return apenasDigitos(v).slice(0, 6); },
    cep(v) {
      const d = apenasDigitos(v).slice(0, 8);
      return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
    }
  };

  /* ---------- Senha (hash com sal; só para o protótipo) ---------- */
  async function gerarHash(texto, sal) {
    const dados = `${sal}:${texto}`;
    if (global.crypto && crypto.subtle && global.TextEncoder) {
      try {
        const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(dados));
        return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
      } catch (e) { /* cai no método simples abaixo */ }
    }
    let h = 5381;
    for (const c of dados) h = ((h << 5) + h + c.charCodeAt(0)) | 0;
    return "d" + (h >>> 0).toString(16);
  }

  function novoSal() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  /* ---------- Contas e sessão ---------- */
  const todos = () => { const l = ler(CH_USUARIOS, []); return Array.isArray(l) ? l : []; };
  const normalizarEmail = (e) => String(e || "").trim().toLowerCase();

  // Devolve o usuário sem dados sensíveis (hash e sal)
  function publico(u) {
    if (!u) return null;
    const { senhaHash, sal, ...resto } = u;
    return resto;
  }

  // Conclui sozinha a análise simulada quando o tempo passou (e grava)
  function resolverVerificacoes(lista) {
    let mudou = false;
    lista.forEach((u) => {
      if (u.perfil !== "vendedor" || !u.empresa) return;
      let v = u.empresa.verificacao;
      if (!v) {
        v = u.empresa.verificacao = { status: "analise", solicitadaEm: Date.parse(u.criadoEm) || Date.now() };
        mudou = true;
      }
      if (v.status === "analise" && Date.now() - v.solicitadaEm >= TEMPO_ANALISE_MS) {
        v.status = "verificada";
        v.verificadaEm = Date.now();
        mudou = true;
      }
    });
    if (mudou) gravar(CH_USUARIOS, lista);
    return lista;
  }

  function usuarioCompleto() {
    const s = ler(CH_SESSAO, null);
    if (!s || !s.id) return null;
    return resolverVerificacoes(todos()).find((x) => x.id === s.id) || null;
  }

  function usuarioAtual() {
    return publico(usuarioCompleto());
  }

  const verificada = (u) => !!(u && u.empresa && u.empresa.verificacao && u.empresa.verificacao.status === "verificada");

  // Botão "simular conclusão": termina a análise na hora (só demonstração)
  function concluirVerificacao() {
    const lista = todos();
    const s = ler(CH_SESSAO, null);
    const u = s && lista.find((x) => x.id === s.id);
    if (!u || u.perfil !== "vendedor") return false;
    u.empresa.verificacao = { status: "verificada", solicitadaEm: Date.now(), verificadaEm: Date.now() };
    return gravar(CH_USUARIOS, lista);
  }

  // Lojas (vendedores) cadastradas, para o consumidor escolher onde pedir
  function lojas() {
    return resolverVerificacoes(todos())
      .filter((u) => u.perfil === "vendedor" && u.empresa)
      .map((u) => ({
        id: u.id, nomeFantasia: u.empresa.nomeFantasia, categoria: u.empresa.categoria,
        bairro: u.empresa.bairro, cidade: u.empresa.cidade, uf: u.empresa.uf,
        telefone: u.empresa.telefone, verificada: verificada(u)
      }))
      .sort((a, b) => (b.verificada - a.verificada) || a.nomeFantasia.localeCompare(b.nomeFantasia, "pt-BR"));
  }

  function usuarioPorId(id) {
    return publico(todos().find((u) => u.id === id));
  }

  function iniciarSessao(u) {
    gravar(CH_SESSAO, { id: u.id, perfil: u.perfil, desde: Date.now() });
    try { sessionStorage.setItem(CH_BOAS_VINDAS, "1"); } catch (e) { /* ignora */ }
  }

  async function cadastrar(dados) {
    const perfil = dados.perfil === "vendedor" ? "vendedor" : "consumidor";
    const email = normalizarEmail(dados.email);
    const lista = todos();

    if (lista.some((u) => u.email === email)) {
      return { ok: false, campo: "email", erro: "Já existe uma conta com este e-mail. Tente entrar." };
    }
    if (perfil === "vendedor") {
      const cnpj = apenasDigitos(dados.empresa && dados.empresa.cnpj);
      if (lista.some((u) => u.perfil === "vendedor" && apenasDigitos(u.empresa && u.empresa.cnpj) === cnpj)) {
        return { ok: false, campo: "cnpj", erro: "Este CNPJ já está cadastrado." };
      }
    }

    const sal = novoSal();
    const usuario = {
      id: "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      perfil,
      nome: String(dados.nome).trim().replace(/\s+/g, " "),
      email,
      telefone: apenasDigitos(dados.telefone),
      sal,
      senhaHash: await gerarHash(dados.senha, sal),
      criadoEm: new Date().toISOString()
    };
    if (perfil === "vendedor") {
      usuario.empresa = dados.empresa;
      usuario.empresa.verificacao = { status: "analise", solicitadaEm: Date.now() };
    }

    lista.push(usuario);
    if (!gravar(CH_USUARIOS, lista)) {
      return { ok: false, erro: "Não foi possível salvar. Verifique se o navegador permite armazenamento local." };
    }
    iniciarSessao(usuario);
    return { ok: true, usuario: publico(usuario) };
  }

  async function entrar(email, senha, perfilEscolhido) {
    const u = todos().find((x) => x.email === normalizarEmail(email));
    const hash = u ? await gerarHash(senha, u.sal) : null;
    if (!u || hash !== u.senhaHash) {
      return { ok: false, erro: "E-mail ou senha incorretos." };
    }
    if (perfilEscolhido && u.perfil !== perfilEscolhido) {
      const nome = u.perfil === "vendedor" ? "vendedor" : "consumidor";
      return { ok: false, erro: `Esta conta é de ${nome}. Selecione "${u.perfil === "vendedor" ? "Vendedor" : "Consumidor"}" para entrar.`, perfilCorreto: u.perfil };
    }
    iniciarSessao(u);
    return { ok: true, usuario: publico(u) };
  }

  /* ---------- Editar conta ---------- */
  function salvarUsuario(u) {
    const lista = todos();
    const i = lista.findIndex((x) => x.id === u.id);
    if (i < 0) return false;
    lista[i] = u;
    return gravar(CH_USUARIOS, lista);
  }

  async function atualizarPerfil(dados) {
    const u = usuarioCompleto();
    if (!u) return { ok: false, erro: "Sessão expirada. Entre novamente." };
    const lista = todos();
    const email = normalizarEmail(dados.email);

    if (lista.some((x) => x.id !== u.id && x.email === email)) {
      return { ok: false, campo: "email", erro: "Já existe outra conta com este e-mail." };
    }
    u.nome = String(dados.nome).trim().replace(/\s+/g, " ");
    u.email = email;
    u.telefone = apenasDigitos(dados.telefone);

    if (u.perfil === "vendedor" && dados.empresa) {
      const cnpjNovo = apenasDigitos(dados.empresa.cnpj);
      const cnpjAntigo = apenasDigitos(u.empresa.cnpj);
      if (lista.some((x) => x.id !== u.id && x.perfil === "vendedor" && apenasDigitos(x.empresa && x.empresa.cnpj) === cnpjNovo)) {
        return { ok: false, campo: "cnpj", erro: "Este CNPJ já está cadastrado em outra conta." };
      }
      const verificacao = cnpjNovo === cnpjAntigo
        ? u.empresa.verificacao
        : { status: "analise", solicitadaEm: Date.now() }; // CNPJ novo = nova verificação
      u.empresa = { ...dados.empresa, verificacao };
    }
    if (!salvarUsuario(u)) return { ok: false, erro: "Não foi possível salvar. Tente novamente." };
    return { ok: true, usuario: publico(u) };
  }

  async function trocarSenha(atual, nova) {
    const u = usuarioCompleto();
    if (!u) return { ok: false, erro: "Sessão expirada. Entre novamente." };
    if (await gerarHash(atual, u.sal) !== u.senhaHash) {
      return { ok: false, campo: "senhaAtual", erro: "A senha atual está incorreta." };
    }
    u.sal = novoSal();
    u.senhaHash = await gerarHash(nova, u.sal);
    return salvarUsuario(u) ? { ok: true } : { ok: false, erro: "Não foi possível salvar. Tente novamente." };
  }

  /* ---------- Recuperar senha (simulado: não envia e-mail de verdade) ---------- */
  async function iniciarRecuperacao(email) {
    const e = normalizarEmail(email);
    const u = todos().find((x) => x.email === e);
    if (!u) return { ok: true, codigo: null }; // não revela se o e-mail existe
    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    gravar(CH_RECUPERACAO, {
      email: e, hash: await gerarHash(codigo, u.sal), expira: Date.now() + 10 * 60000, tentativas: 0
    });
    return { ok: true, codigo };
  }

  async function redefinirSenha(email, codigo, nova) {
    const e = normalizarEmail(email);
    const r = ler(CH_RECUPERACAO, null);
    const lista = todos();
    const u = lista.find((x) => x.email === e);
    if (!r || !u || r.email !== e || Date.now() > r.expira) {
      return { ok: false, campo: "codigo", erro: "Código expirado. Peça um novo código." };
    }
    if (r.tentativas >= 5) {
      return { ok: false, campo: "codigo", erro: "Muitas tentativas. Peça um novo código." };
    }
    if (await gerarHash(apenasDigitos(codigo), u.sal) !== r.hash) {
      r.tentativas++;
      gravar(CH_RECUPERACAO, r);
      return { ok: false, campo: "codigo", erro: "Código incorreto. Confira o e-mail simulado." };
    }
    u.sal = novoSal();
    u.senhaHash = await gerarHash(nova, u.sal);
    try { localStorage.removeItem(CH_RECUPERACAO); } catch (err) { /* ignora */ }
    return gravar(CH_USUARIOS, lista) ? { ok: true } : { ok: false, erro: "Não foi possível salvar." };
  }

  /* ---------- CEP -> endereço (ViaCEP; precisa de internet) ---------- */
  async function buscarCep(cep) {
    const d = apenasDigitos(cep);
    if (d.length !== 8) return { ok: false };
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 6000);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${d}/json/`, { signal: ctl.signal });
      const j = await r.json();
      if (j.erro) return { ok: false, naoEncontrado: true };
      return { ok: true, endereco: j.logradouro || "", bairro: j.bairro || "", cidade: j.localidade || "", uf: j.uf || "" };
    } catch (e) {
      return { ok: false, falhaRede: true };
    } finally {
      clearTimeout(t);
    }
  }

  function sair() {
    try { localStorage.removeItem(CH_SESSAO); } catch (e) { /* ignora */ }
    location.href = RAIZ + "index.html";
  }

  const caminhoInicial = (perfil) => RAIZ + (PAGINA_INICIAL[perfil] || "index.html");

  // Mostra a mensagem de boas-vindas uma única vez após entrar/cadastrar
  function consumirBoasVindas() {
    try {
      if (sessionStorage.getItem(CH_BOAS_VINDAS)) {
        sessionStorage.removeItem(CH_BOAS_VINDAS);
        return true;
      }
    } catch (e) { /* ignora */ }
    return false;
  }

  /* ---------- Controle de acesso (roda imediatamente) ---------- */
  function guardar() {
    const u = usuarioAtual();
    let destino = null;

    if (ACESSO === "visitante" && u) {
      destino = caminhoInicial(u.perfil);
    } else if (ACESSO === "logado" && !u) {
      destino = RAIZ + "pages/login.html?aviso=entre";
    } else if (ACESSO === "consumidor" || ACESSO === "vendedor") {
      if (!u) destino = RAIZ + "pages/login.html?perfil=" + ACESSO + "&aviso=entre";
      else if (u.perfil !== ACESSO) destino = caminhoInicial(u.perfil);
    }

    if (destino) {
      document.documentElement.style.visibility = "hidden"; // evita "piscar" a tela proibida
      location.replace(destino);
    }
  }
  guardar();

  global.Auth = {
    usuarioAtual, usuarioPorId, cadastrar, entrar, sair, consumirBoasVindas,
    atualizarPerfil, trocarSenha, iniciarRecuperacao, redefinirSenha,
    concluirVerificacao, lojas, buscarCep, CATEGORIAS, TEMPO_ANALISE_MS,
    caminhoInicial, Validar, Mascara, raiz: RAIZ, acesso: ACESSO
  };
})(window);
