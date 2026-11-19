/* ==========================================================================
   autenticacao.js — Comportamento dos formulários de conta
   Cada <form data-modo="..."> da página é iniciado separadamente:
     login | cadastro | perfil | senha | recuperar1 | recuperar2
   - máscaras (telefone, CNPJ, CEP, código) e validação campo a campo
   - troca de perfil (consumidor × vendedor) e dados da empresa
   - preenchimento do endereço pelo CEP
   ========================================================================== */

(function () {
  const { Validar, Mascara } = Auth;
  const params = new URLSearchParams(location.search);

  document.querySelectorAll("form[data-modo]").forEach(iniciar);

  function iniciar(form) {
    const modo = form.dataset.modo;
    const alerta = form.querySelector("[data-alerta]");
    const botao = form.querySelector("[data-enviar]");

    const perfilAtual = () =>
      (form.querySelector('input[name="perfil"]:checked') || {}).value || form.dataset.perfil || "consumidor";
    const campos = () => Array.from(form.querySelectorAll("[data-validar]")).filter((c) => !c.matches(":disabled"));

    /* ---------- Regras por tipo de campo ---------- */
    const REGRAS = {
      nome: (c) => Validar.nome(c.value, c.dataset.rotulo || "o nome completo"),
      email: (c) => Validar.email(c.value),
      telefone: (c) => Validar.telefone(c.value),
      cnpj: (c) => Validar.cnpj(c.value),
      cep: (c) => Validar.cep(c.value),
      codigo: (c) => Validar.codigo(c.value),
      senha: (c) => Validar.senha(c.value),
      senhaLogin: (c) => (c.value ? "" : "Digite a senha."),
      obrigatorio: (c) => Validar.obrigatorio(c.value, c.dataset.rotulo || "este campo", Number(c.dataset.min || 2)),
      uf: (c) => (c.value ? "" : "Escolha o estado."),
      categoria: (c) => (c.value ? "" : "Escolha a categoria do negócio."),
      confirmar: (c) => {
        if (!c.value) return "Repita a senha.";
        return c.value === form.elements.senha.value ? "" : "As senhas não coincidem.";
      },
      termos: (c) => (c.checked ? "" : "É preciso aceitar os termos para criar a conta.")
    };

    function mostrarErro(campo, msg) {
      const aviso = document.getElementById(campo.id + "Erro");
      campo.classList.toggle("is-invalid", !!msg);
      campo.classList.toggle("is-valid", !msg && campo.type !== "checkbox" && campo.value !== "");
      campo.setAttribute("aria-invalid", msg ? "true" : "false");
      if (aviso) {
        aviso.textContent = msg;
        aviso.classList.toggle("d-block", !!msg);
      }
    }

    function validarCampo(campo) {
      const regra = REGRAS[campo.dataset.validar];
      const msg = regra ? regra(campo) : "";
      mostrarErro(campo, msg);
      return !msg;
    }

    /* ---------- Máscaras e validação enquanto digita ---------- */
    form.querySelectorAll("[data-mascara]").forEach((campo) => {
      campo.addEventListener("input", () => {
        campo.value = Mascara[campo.dataset.mascara](campo.value);
      });
    });

    form.addEventListener("focusout", (e) => {
      if (e.target.matches("[data-validar]")) {
        e.target.dataset.tocado = "1";
        validarCampo(e.target);
      }
    });
    form.addEventListener("input", (e) => {
      const c = e.target;
      if (!c.matches("[data-validar]")) return;
      if (c.dataset.tocado || c.classList.contains("is-invalid")) validarCampo(c);
      if (c.name === "senha") {
        atualizarRequisitos();
        const conf = form.elements.confirmar;
        if (conf && conf.dataset.tocado) validarCampo(conf);
      }
      if (alerta) alerta.className = "alert d-none";
    });
    form.addEventListener("change", (e) => {
      if (e.target.matches("select[data-validar], input[type=checkbox][data-validar]")) validarCampo(e.target);
    });

    /* ---------- Mostrar/ocultar senha ---------- */
    form.querySelectorAll("[data-alternar-senha]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const alvo = document.getElementById(btn.dataset.alternarSenha);
        const mostrar = alvo.type === "password";
        alvo.type = mostrar ? "text" : "password";
        btn.innerHTML = `<i class="bi ${mostrar ? "bi-eye-slash" : "bi-eye"}"></i>`;
        btn.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
        btn.setAttribute("aria-pressed", mostrar ? "true" : "false");
      });
    });

    /* ---------- Requisitos da senha ---------- */
    function atualizarRequisitos() {
      const lista = form.querySelector("[data-requisitos]");
      if (!lista || !form.elements.senha) return;
      const v = form.elements.senha.value;
      const regras = { len: v.length >= 8, letra: /[A-Za-zÀ-ÿ]/.test(v), num: /\d/.test(v) };
      lista.querySelectorAll("[data-req]").forEach((li) => {
        const ok = regras[li.dataset.req];
        li.classList.toggle("req-ok", ok);
        li.querySelector("i").className = "bi " + (ok ? "bi-check-circle-fill" : "bi-circle");
      });
    }

    /* ---------- Perfil: consumidor × vendedor ---------- */
    function aplicarPerfil() {
      const perfil = perfilAtual();
      const empresa = form.querySelector("[data-bloco-empresa]");
      if (empresa) {
        const vendedor = perfil === "vendedor";
        empresa.hidden = !vendedor;
        empresa.disabled = !vendedor; // campos desativados não entram na validação
      }
      form.querySelectorAll("[data-texto-consumidor]").forEach((el) => {
        el.textContent = perfil === "vendedor" ? el.dataset.textoVendedor : el.dataset.textoConsumidor;
      });
      form.querySelectorAll(".opcao-perfil").forEach((lb) => {
        lb.classList.toggle("ativa", lb.querySelector("input").checked);
      });
      const link = document.getElementById("linkTrocaModo");
      if (link) link.href = link.dataset.base + "?perfil=" + perfil;
    }
    form.querySelectorAll('input[name="perfil"]').forEach((r) => r.addEventListener("change", aplicarPerfil));

    if (modo === "login" || modo === "cadastro") {
      const perfilUrl = params.get("perfil");
      if (perfilUrl === "vendedor" || perfilUrl === "consumidor") {
        const radio = form.querySelector(`input[name="perfil"][value="${perfilUrl}"]`);
        if (radio) radio.checked = true;
      }
    }

    /* ---------- Minha conta: preenche com os dados atuais ---------- */
    if (modo === "perfil") {
      const u = Auth.usuarioAtual();
      form.dataset.perfil = u.perfil;
      const f = form.elements;
      f.nome.value = u.nome;
      f.email.value = u.email;
      f.telefone.value = Mascara.telefone(u.telefone);
      if (u.empresa) {
        const e = u.empresa;
        f.razaoSocial.value = e.razaoSocial;
        f.nomeFantasia.value = e.nomeFantasia;
        f.cnpj.value = Mascara.cnpj(e.cnpj);
        f.categoria.value = e.categoria;
        f.telefoneEmpresa.value = Mascara.telefone(e.telefone);
        f.cep.value = Mascara.cep(e.cep);
        f.endereco.value = e.endereco;
        f.numero.value = e.numero;
        f.bairro.value = e.bairro;
        f.cidade.value = e.cidade;
        f.uf.value = e.uf;
      }
    }

    aplicarPerfil();
    atualizarRequisitos();

    if (modo === "login" && params.get("aviso") === "entre" && alerta) {
      alerta.className = "alert alert-info";
      alerta.textContent = "Entre na sua conta para acessar esta área.";
    }
    if (modo === "login" && params.get("aviso") === "senha" && alerta) {
      alerta.className = "alert alert-success";
      alerta.textContent = "Senha redefinida! Entre com a nova senha.";
    }

    /* ---------- CEP: preenche rua, bairro, cidade e estado ---------- */
    const campoCep = form.elements.cep;
    if (campoCep) {
      const status = document.getElementById("cepStatus");
      let ultimoCep = "";
      const dizer = (texto, classe) => {
        if (!status) return;
        status.textContent = texto;
        status.className = "form-text " + (classe || "");
      };
      async function preencherPeloCep() {
        const digitos = campoCep.value.replace(/\D/g, "");
        if (digitos.length !== 8 || digitos === ultimoCep) return;
        ultimoCep = digitos;
        dizer("Buscando endereço…");
        const r = await Auth.buscarCep(digitos);
        if (campoCep.value.replace(/\D/g, "") !== digitos) return; // CEP mudou enquanto buscava
        if (!r.ok) {
          ultimoCep = "";
          dizer(r.naoEncontrado ? "CEP não encontrado. Preencha o endereço manualmente."
            : "Não foi possível buscar agora. Preencha o endereço manualmente.", "text-warning-emphasis");
          return;
        }
        const f = form.elements;
        if (r.endereco) f.endereco.value = r.endereco;
        if (r.bairro) f.bairro.value = r.bairro;
        if (r.cidade) f.cidade.value = r.cidade;
        if (r.uf) f.uf.value = r.uf;
        ["endereco", "bairro", "cidade", "uf"].forEach((n) => { if (f[n].value) validarCampo(f[n]); });
        dizer("Endereço preenchido. Confira e informe o número.", "text-success");
        (r.endereco ? f.numero : f.endereco).focus();
      }
      campoCep.addEventListener("input", preencherPeloCep);
    }

    /* ---------- Mensagem geral e botão ---------- */
    function mostrarAlerta(texto, tipo = "danger") {
      if (!alerta) return;
      alerta.className = `alert alert-${tipo}`;
      alerta.textContent = texto;
    }

    function carregando(sim) {
      if (!botao) return;
      botao.disabled = sim;
      botao.querySelector(".rotulo").classList.toggle("d-none", sim);
      botao.querySelector(".carregando").classList.toggle("d-none", !sim);
    }

    function dadosEmpresa(f) {
      return {
        razaoSocial: f.razaoSocial.value.trim(),
        nomeFantasia: f.nomeFantasia.value.trim(),
        cnpj: f.cnpj.value,
        categoria: f.categoria.value,
        telefone: f.telefoneEmpresa.value,
        cep: f.cep.value,
        endereco: f.endereco.value.trim(),
        numero: f.numero.value.trim(),
        bairro: f.bairro.value.trim(),
        cidade: f.cidade.value.trim(),
        uf: f.uf.value
      };
    }

    function campoDoErro(f, nome) {
      return { email: f.email, cnpj: f.cnpj, senhaAtual: f.senhaAtual, codigo: f.codigo }[nome];
    }

    /* ---------- Envio ---------- */
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (alerta) alerta.className = "alert d-none";

      let primeiroErro = null;
      campos().forEach((c) => {
        c.dataset.tocado = "1";
        if (!validarCampo(c) && !primeiroErro) primeiroErro = c;
      });
      if (primeiroErro) {
        primeiroErro.focus();
        mostrarAlerta("Corrija os campos destacados para continuar.");
        return;
      }

      carregando(true);
      try {
        const f = form.elements;
        let r;

        if (modo === "login") {
          r = await Auth.entrar(f.email.value, f.senha.value, perfilAtual());
          if (!r.ok && r.perfilCorreto) {
            form.querySelector(`input[name="perfil"][value="${r.perfilCorreto}"]`).checked = true;
            aplicarPerfil();
          }
          if (r.ok) { location.href = Auth.caminhoInicial(r.usuario.perfil); return; }

        } else if (modo === "cadastro") {
          const perfil = perfilAtual();
          const dados = { perfil, nome: f.nome.value, email: f.email.value, telefone: f.telefone.value, senha: f.senha.value };
          if (perfil === "vendedor") dados.empresa = dadosEmpresa(f);
          r = await Auth.cadastrar(dados);
          if (r.ok) { location.href = Auth.caminhoInicial(r.usuario.perfil); return; }

        } else if (modo === "perfil") {
          const dados = { nome: f.nome.value, email: f.email.value, telefone: f.telefone.value };
          if (perfilAtual() === "vendedor") dados.empresa = dadosEmpresa(f);
          r = await Auth.atualizarPerfil(dados);
          if (r.ok) {
            mostrarAlerta("Dados atualizados com sucesso.", "success");
            document.dispatchEvent(new CustomEvent("conta:atualizada"));
            if (typeof montarLayout === "function") montarLayout();
            carregando(false);
            return;
          }

        } else if (modo === "senha") {
          r = await Auth.trocarSenha(f.senhaAtual.value, f.senha.value);
          if (r.ok) {
            form.reset();
            form.querySelectorAll(".is-valid, .is-invalid").forEach((c) => c.classList.remove("is-valid", "is-invalid"));
            campos().forEach((c) => { delete c.dataset.tocado; });
            atualizarRequisitos();
            mostrarAlerta("Senha alterada com sucesso.", "success");
            carregando(false);
            return;
          }

        } else if (modo === "recuperar1") {
          r = await Auth.iniciarRecuperacao(f.email.value);
          if (r.ok) {
            document.dispatchEvent(new CustomEvent("recuperar:codigo", { detail: { email: f.email.value.trim(), codigo: r.codigo } }));
            carregando(false);
            return;
          }

        } else if (modo === "recuperar2") {
          r = await Auth.redefinirSenha(f.email.value, f.codigo.value, f.senha.value);
          if (r.ok) { location.href = "login.html?aviso=senha"; return; }
        }

        // Erro: mostra no campo (quando houver) e/ou no aviso geral
        if (r.campo) {
          const alvo = campoDoErro(f, r.campo);
          if (alvo) {
            mostrarErro(alvo, r.erro);
            alvo.focus();
            carregando(false);
            return; // o erro já aparece no próprio campo
          }
        }
        mostrarAlerta(r.erro);
      } catch (erro) {
        mostrarAlerta("Algo deu errado. Tente novamente.");
      }
      carregando(false);
    });

    /* ---------- Preencher exemplo (só para demonstrar o protótipo) ---------- */
    const btnExemplo = document.getElementById("btnExemplo");
    if (btnExemplo && modo === "cadastro") {
      btnExemplo.addEventListener("click", () => {
        const f = form.elements;
        const v = perfilAtual() === "vendedor";
        const rnd = Math.random().toString(36).slice(2, 6);
        const set = (nome, valor) => { if (f[nome]) { f[nome].value = valor; } };
        set("nome", v ? "Maria das Graças Lima" : "João Pedro Santos");
        set("email", `${v ? "maria.lima" : "joao.santos"}${rnd}@gmail.com`);
        set("telefone", "(92) 91234-5678");
        set("senha", "elolocal123");
        set("confirmar", "elolocal123");
        if (v) {
          set("razaoSocial", "Lima Comércio de Alimentos Ltda");
          set("nomeFantasia", "Mercadinho da Graça");
          set("cnpj", "11.222.333/0001-81");
          set("categoria", "mercearia");
          set("telefoneEmpresa", "(92) 3234-5678");
          set("cep", "69010-000");
          set("endereco", "Rua Costa Azevedo");
          set("numero", "120");
          set("bairro", "Centro");
          set("cidade", "Manaus");
          set("uf", "AM");
        }
        if (f.termos) f.termos.checked = true;
        campos().forEach((c) => { c.dataset.tocado = "1"; validarCampo(c); });
        atualizarRequisitos();
      });
    }
  }
})();
