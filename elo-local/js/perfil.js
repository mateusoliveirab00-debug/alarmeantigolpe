/* ==========================================================================
   perfil.js — Minha conta: painel de verificação da empresa (vendedor)
   A análise do CNPJ é SIMULADA: termina sozinha em alguns segundos ou ao
   clicar em "Concluir análise agora". Em produção, seria feita por consulta
   à Receita Federal / equipe de cadastro.
   ========================================================================== */

(function () {
  const painel = document.getElementById("painelVerificacao");
  if (!painel) return;

  let temporizador = null;

  function desenhar() {
    const u = Auth.usuarioAtual();
    if (!u || u.perfil !== "vendedor" || !u.empresa) { painel.hidden = true; return; }

    const v = u.empresa.verificacao || { status: "analise", solicitadaEm: Date.now() };
    const ok = v.status === "verificada";
    painel.hidden = false;

    if (ok) {
      painel.innerHTML = `
        <div class="d-flex flex-wrap align-items-center gap-3">
          <span class="icone-circulo" style="background:#dcfce7;color:#166534"><i class="bi bi-patch-check-fill"></i></span>
          <div class="flex-grow-1">
            <h2 id="tituloVerif" class="h5 mb-1">${escapar(u.empresa.nomeFantasia)} ${seloVerificacao(true)}</h2>
            <p class="text-secondary small mb-0">CNPJ ${Auth.Mascara.cnpj(u.empresa.cnpj)} conferido. O selo aparece para os consumidores na lista de lojas.</p>
          </div>
        </div>`;
      pararAtualizacao();
      return;
    }

    const falta = Math.max(0, Math.ceil((v.solicitadaEm + Auth.TEMPO_ANALISE_MS - Date.now()) / 1000));
    painel.innerHTML = `
      <div class="d-flex flex-wrap align-items-center gap-3">
        <span class="icone-circulo acento"><i class="bi bi-hourglass-split"></i></span>
        <div class="flex-grow-1">
          <h2 id="tituloVerif" class="h5 mb-1">Verificação da empresa ${seloVerificacao(false)}</h2>
          <p class="text-secondary small mb-0">Estamos conferindo o CNPJ ${Auth.Mascara.cnpj(u.empresa.cnpj)}.
            Enquanto isso você já pode usar a plataforma; o selo aparece quando terminar<span id="segVerif">${falta ? ` (cerca de ${falta} s)` : ""}</span>.</p>
        </div>
        <button type="button" class="btn btn-outline-primary btn-sm" id="btnConcluirVerif">
          <i class="bi bi-fast-forward me-1"></i>Concluir análise agora
        </button>
      </div>
      <p class="fonte-dado mb-0 mt-2">Protótipo: a análise é simulada. Se você trocar o CNPJ abaixo, ela recomeça.</p>`;

    document.getElementById("btnConcluirVerif").addEventListener("click", () => {
      Auth.concluirVerificacao();
      desenhar();
      if (typeof montarLayout === "function") montarLayout();
      avisar("Empresa verificada!");
    });
    iniciarAtualizacao();
  }

  // Enquanto em análise: atualiza só a contagem; ao terminar, redesenha o painel e o menu
  function iniciarAtualizacao() {
    if (temporizador) return;
    temporizador = setInterval(() => {
      const u = Auth.usuarioAtual();
      const v = u && u.empresa && u.empresa.verificacao;
      if (v && v.status === "verificada") {
        desenhar();
        if (typeof montarLayout === "function") montarLayout();
        return;
      }
      const falta = v ? Math.max(0, Math.ceil((v.solicitadaEm + Auth.TEMPO_ANALISE_MS - Date.now()) / 1000)) : 0;
      const el = document.getElementById("segVerif");
      if (el) el.textContent = falta ? ` (cerca de ${falta} s)` : "";
    }, 1000);
  }
  function pararAtualizacao() {
    if (temporizador) { clearInterval(temporizador); temporizador = null; }
  }

  document.addEventListener("conta:atualizada", desenhar);
  document.addEventListener("DOMContentLoaded", desenhar);
})();
