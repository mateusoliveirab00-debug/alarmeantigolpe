# Elo Local — Protótipo de plataforma web para o pequeno comércio

Protótipo da disciplina **Web Coding (HTML5)** — Engenharia da Computação.
Tema: **Comércio — Logística, Abastecimento e Formação de Preços**.

> Nome de trabalho: **Elo Local**. Para trocar, edite `nome` em `js/config.js`
> (sugestões: *Rota Justa*, *Feira Conectada*, *Cesta Clara*).

## Integrantes

- Gabriel Luiz Azuelos de Almeida
- Hugo Gabriel de Freitas Cruz
- João Pedro de Oliveira Lopes
- Kethelen Rebeca Viana Sobrinho
- Leandro Façanha Alves
- Mateus Oliveira Barbosa
- Murilo Nuncio Sampaio

## O que o protótipo faz

| Página | Arquivo | Para quem | O que oferece |
|---|---|---|---|
| Início | `index.html` | Todos | Apresentação, acesso ao login/cadastro e dados do diagnóstico |
| Entrar | `pages/login.html` | Visitante | Login como consumidor ou vendedor |
| Criar conta | `pages/cadastro.html` | Visitante | Cadastro de consumidor ou de vendedor (com dados da empresa) |
| Recuperar senha | `pages/recuperar-senha.html` | Visitante | Código simulado e nova senha |
| Minha conta | `pages/perfil.html` | Logado | Editar dados, empresa, senha e ver o selo de verificação |
| Lojas | `pages/lojas.html` | Consumidor | Lojas cadastradas e pedido |
| Meus pedidos | `pages/meus-pedidos.html` | Consumidor | Andamento dos pedidos feitos |
| Pedidos de clientes | `pages/pedidos-clientes.html` | Vendedor | Receber, aceitar e avançar pedidos |
| Pedidos e entregas | `pages/painel-pedidos.html` | Vendedor | Lista, filtros, busca, avanço de status, atraso automático e cadastro de pedidos |
| Preços e histórico | `pages/precos.html` | Vendedor | Histórico de 6 meses, comparação entre comércios e planejador de reposição |
| Compras conjuntas | `pages/compras-conjuntas.html` | Vendedor | Metas em grupo, participação, economia estimada e criação de novas compras |
| Área do consumidor | `pages/consumidor.html` | Consumidor | Preço e disponibilidade por bairro, favoritos e comparação pequeno comércio × grande rede |

## Login, cadastro e perfis

- **Consumidor** vê: *Comparar preços*, *Lojas*, *Meus pedidos* e *Minha conta*.
  **Vendedor** vê: *Pedidos*, *Preços*, *Compras conjuntas*, *Pedidos de clientes* e *Minha conta*.
  Quem tenta abrir uma tela de outro perfil (ou sem estar logado) é redirecionado.
- O cadastro de **vendedor** exige dados da empresa: razão social, nome fantasia, CNPJ (validado pelos dígitos),
  categoria, telefone, CEP e endereço completo. Ao digitar o **CEP**, rua, bairro, cidade e estado são preenchidos
  sozinhos (consulta ao ViaCEP, precisa de internet; se falhar, preencha à mão).
- Todos os campos têm máscara e validação de formato (e-mail, celular com DDD, CNPJ, CEP, senha com 8+ caracteres, letras e números).
- **Dados por conta:** pedidos, compras conjuntas, participações e favoritos pertencem a cada usuário.
- **Recuperar senha** (`recuperar-senha.html`): simulado. O "e-mail" com o código de 6 números aparece na própria tela.
- **Minha conta** (`perfil.html`): editar dados pessoais e da empresa, e trocar a senha.
- **Empresa verificada:** todo vendedor começa "Em análise"; a conferência do CNPJ é simulada, termina sozinha em ~15 s
  (ou no botão *Concluir análise agora*) e mostra o selo. Trocar o CNPJ reinicia a análise.
- **Pedidos reais entre os dois lados:** o consumidor escolhe uma loja cadastrada em *Lojas* e faz o pedido;
  o vendedor vê em *Pedidos de clientes* e avança *Novo → Aceito → Em preparo → Pronto → Concluído* (ou recusa).
  O consumidor acompanha em *Meus pedidos* e pode cancelar enquanto o pedido está novo.
  Para testar: crie um vendedor, saia, crie um consumidor, peça, saia e entre de novo como vendedor.
- Sem banco de dados: contas e pedidos ficam no `localStorage` do navegador. **Não é segurança real**, serve só para
  demonstração visual. Em produção, a autenticação precisaria de um servidor.
- Atalho para testar: botão **Preencher com dados de exemplo** no cadastro. CNPJs de teste válidos: `11.222.333/0001-81`, `45.723.174/0001-10`.
- Para limpar tudo, apague os dados do site no navegador (chaves que começam com `elolocal:`).

## Como abrir

**Opção 1 (mais simples):** dê dois cliques em `index.html`.

**Opção 2 (recomendada no VS Code):** instale a extensão **Live Server**, clique com o botão
direito em `index.html` e escolha **Open with Live Server**.

É preciso estar **conectado à internet**: Bootstrap, Tailwind, ícones e fontes são carregados por CDN.

## Estrutura de pastas

```
elo-local/
├── index.html
├── pages/
│   ├── painel-pedidos.html
│   ├── precos.html
│   ├── compras-conjuntas.html
│   ├── consumidor.html
│   ├── login.html
│   ├── cadastro.html
│   ├── recuperar-senha.html
│   ├── perfil.html
│   ├── lojas.html
│   ├── meus-pedidos.html
│   └── pedidos-clientes.html
├── css/
│   └── styles.css        (identidade visual e componentes)
├── js/
│   ├── config.js         (nome da plataforma e chaves do localStorage)
│   ├── app.js            (funções comuns: datas, moeda, menu por perfil, rodapé, avisos)
│   ├── auth.js           (contas, sessão, validações e bloqueio de acesso por perfil)
│   ├── autenticacao.js   (formulários de conta: login, cadastro, perfil, senha)
│   ├── perfil.js         (selo de empresa verificada)
│   ├── pedidos-loja.js   (pedidos consumidor → vendedor)
│   ├── lojas.js / meus-pedidos.js / pedidos-clientes.js
│   ├── dados.js          (dados fictícios + dados reais do diagnóstico)
│   ├── graficos.js       (gráficos em CSS/SVG, sem bibliotecas)
│   ├── painel.js
│   ├── precos.js
│   ├── compras.js
│   └── consumidor.js
├── img/
│   └── logo.svg
└── README.md
```

## Tecnologias

- HTML5 semântico, CSS e JavaScript puro
- **Bootstrap 5** (layout, formulários, janelas, tabelas) e **Tailwind CSS** (utilitários de grade e espaçamento, com prefixo `tw-` para não conflitar com o Bootstrap)
- Dados salvos no navegador com **localStorage** (pedidos, compras conjuntas, participações e favoritos)
- Responsivo (celular, tablet e computador) e com atenção à acessibilidade (rótulos, foco visível, contraste)

## Identidade visual

- **Verde-azulado (teal):** confiança, estabilidade e crescimento. É a cor principal.
- **Âmbar:** energia e atenção, usado em preços, selos de destaque e ações principais.
- **Fundo off-white esverdeado:** conforto na leitura.
- **Cores de status** em padrão de semáforo (azul = novo, âmbar = atenção, verde = ok, vermelho = problema).
- Fontes: **Poppins** (títulos) e **Inter** (textos).

## Sobre os dados

- Pedidos, comércios, preços, estoques e compras conjuntas são **fictícios**, só para demonstração.
- Os números dos gráficos de **custo logístico, café e mortalidade de empresas** são os do Plano de Projeto
  (fontes: ILOS, IBGE/IPCA, Abic, Procon-SP e Sebrae/Receita Federal).
- Para limpar os dados salvos, use os botões **Restaurar exemplos** ou limpe os dados do site no navegador.

## Ideias para as próximas etapas

- Validar as páginas no validador do W3C
- Adicionar mais produtos e comércios em `js/dados.js`
- Ligar a um back-end/banco de dados no lugar do localStorage
