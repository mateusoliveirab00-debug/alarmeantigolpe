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
| Início | `index.html` | Todos | Apresentação, escolha do perfil e dados do diagnóstico |
| Pedidos e entregas | `pages/painel-pedidos.html` | Comerciante | Lista, filtros, busca, avanço de status, atraso automático e cadastro de pedidos |
| Preços e histórico | `pages/precos.html` | Comerciante | Histórico de 6 meses, comparação entre comércios e planejador de reposição |
| Compras conjuntas | `pages/compras-conjuntas.html` | Comerciante | Metas em grupo, participação, economia estimada e criação de novas compras |
| Área do consumidor | `pages/consumidor.html` | Consumidor | Preço e disponibilidade por bairro, favoritos e comparação pequeno comércio × grande rede |

Não há login: a página inicial direciona para o perfil de comerciante ou de consumidor.

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
│   └── consumidor.html
├── css/
│   └── styles.css        (identidade visual e componentes)
├── js/
│   ├── config.js         (nome da plataforma e chaves do localStorage)
│   ├── app.js            (funções comuns: datas, moeda, menu, rodapé, avisos)
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
