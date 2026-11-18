# Exercise No No — exercisenono.com

Site estático (HTML puro) gerado com o Eleventy. Você escreve o conteúdo em arquivos de texto (`.md`), o gerador monta as páginas e a pasta `_site/` vai para a Hostinger.

**Regra de ouro:** nada com `[TEXTO ENTRE COLCHETES]` aparece no Google. Enquanto uma página tiver placeholder, ela sai com `noindex` e fica fora do sitemap, sozinha.

---

## 1. Onde fica cada coisa

| Pasta / arquivo | O que é |
| --- | --- |
| `src/posts/` | Um arquivo por post |
| `src/exercises/` | Um arquivo por exercício (biblioteca) |
| `src/products/` | Um arquivo por produto (listing do Etsy) |
| `src/categories/` | Uma página-pilar por categoria (as 10 já existem) |
| `src/pages/` | Home, About, Disclaimer, Privacy, Contact etc. |
| `src/assets/img/` | Imagens originais (PNG/JPG). O gerador cria os WebP sozinho |
| `src/assets/video/` | Vídeos de demonstração (mp4, webm, gif) |
| `src/_data/site.json` | Configurações do site (mínimos, códigos de verificação, e-mail) |
| `src/_data/redirects.csv` | Redirecionamentos do blog antigo |
| `_site/` | O site pronto (gerado). É o que sobe para a Hostinger |

O nome do arquivo vira o endereço e **não deve mudar depois de publicado**:
`src/posts/meu-post.md` → `exercisenono.com/<categoria>/meu-post/`

---

## 2. Como criar um post novo

1. Copie `src/posts/example-dumbbell-routine.md` (post de rotina) ou `src/posts/example-common-mistake-article.md` (artigo de "erro comum").
2. Dê um nome curto, em minúsculas, com hífens: `dumbbell-workout-men-over-50.md`.
3. Preencha os campos do topo (entre as linhas `---`) e o texto abaixo.

Regras dos campos:

- Texto sempre **entre aspas**: `title: "My title"`.
- `kind`: `routine` (com lista de exercícios e produto) ou `article` (só texto).
- `category`: `joint`, `taichi`, `balance`, `chair`, `recovery`, `wellness`, `gym`, `pain`, `stretching` ou `pilates`.
- `keyword`: uma por post. O gerador recusa keyword repetida.
- `audience`: `senior-woman`, `senior-man`, `woman-50`, `younger-woman` ou `younger-man`. Define qual personagem aparece nos cards.
- `hero_image`: imagem do topo do post (opcional), com a descrição em `hero_alt`. `og_image` é a imagem de compartilhamento e `pin_image` a vertical do Pinterest.
- `product`: nome do arquivo em `src/products/` (sem `.md`). O link do Etsy vem de lá.
- `exercises`: cada item cita um arquivo de `src/exercises/` (`ref`), com a dose do post (`dose`) e uma frase só deste post (`note`).
- `sources`: pelo menos uma fonte, com `name` e `url`.
- `draft: true` não publica.
- No artigo, a linha `<!--cta-->` no texto marca onde entra a caixa do produto.

Os exercícios citados precisam existir antes em `src/exercises/`. O texto do exercício fica só lá: o post nunca reescreve os passos.

## 3. Como criar um exercício ou um produto

- **Exercício:** copie `src/exercises/bicep-curl.md`. Coloque as imagens START e FINISH em `src/assets/img/exercises/` e os vídeos em `src/assets/video/`. Um exercício pode ter várias versões (`variants`), uma por personagem.
- **Produto:** copie `src/products/dumbbell-workout-men-over-50.md`. Cole o link da listing em `etsy_url`. Imagens em `src/assets/img/products/<nome-do-produto>/`.

Para transformar o GIF do produto em vídeo (precisa do ffmpeg):

```
ffmpeg -i entrada.gif -movflags +faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -crf 26 -an saida.mp4
ffmpeg -i entrada.gif -c:v libvpx-vp9 -crf 38 -b:v 0 -an saida.webm
```

---

## 4. Como gerar o site

Precisa do Node.js 20 ou mais novo. Na pasta do projeto:

```
npm install        (só na primeira vez)
npm run build
```

O site pronto fica em `_site/`. Para ver no navegador antes de subir: `npm start` e abra `http://localhost:8080`.

Se algo estiver errado no conteúdo (campo faltando, exercício que não existe, imagem que não existe, keyword repetida), o gerador **para e explica em português** o que corrigir. Avisos (`AVISO:`) não impedem a geração.

## 5. Como subir para a Hostinger

1. No hPanel, abra o **Gerenciador de Arquivos** do domínio e entre em `public_html`.
2. Envie **todo o conteúdo de dentro** de `_site/` (não a pasta `_site` em si), substituindo os arquivos antigos.
3. Confira se o arquivo `.htaccess` foi junto. Ele começa com ponto e fica oculto em alguns programas; no Gerenciador de Arquivos, ative a opção de mostrar arquivos ocultos.

Por FTP é igual: o conteúdo de `_site/` vai para `public_html/`.

---

## 6. Quando uma página aparece no Google

| Página | Entra no Google e no sitemap quando |
| --- | --- |
| Qualquer uma | Não tem mais nenhum `[PLACEHOLDER]` |
| Post | Os exercícios e o produto que ele usa também estão sem placeholder |
| Categoria | Tem `guide_ready: true` **e** 3 posts publicados. Antes disso existe, mas com `noindex` e fora do menu e da home |
| Produto | Tem `index: true` no arquivo (ligue só quando a página tiver texto próprio) |
| `/printables/` | Há 3 produtos indexáveis |
| `/exercises/` | Há 6 exercícios completos |
| `/free-printables/`, `/free-illustrations/` | Você tirar a linha `noindex: true` do arquivo |

Os números (3, 3 e 6) ficam em `src/_data/site.json`.

**Antes do lançamento:** apague os dois posts de exemplo (`src/posts/example-*.md`) e substitua os exercícios e o produto de exemplo pelos de verdade.

## 7. Redirecionamentos do blog antigo

Edite `src/_data/redirects.csv`. Cada linha é uma URL antiga:

- `pending`: ainda sem destino (dá erro 404, com a página que lista as categorias).
- `301`: redireciona para `new_path`. Use só quando houver página nova **sobre o mesmo assunto**.
- `410`: página removida de vez.

Não redirecione tudo para a home: o Google trata isso como página inexistente. Quando o domínio estiver verificado no Search Console, o relatório "Links" mostra quais URLs antigas recebem links.

## 8. Configurações em `src/_data/site.json`

- `verification`: códigos do Google Search Console, Bing e Pinterest (vazio = não aparece).
- `contact_email`, `tagline`, `description`: textos do site.
- `analytics_html`: código do serviço de estatísticas, quando for escolhido.

## 9. Home

A home segue a estrutura do mockup (barra lateral, cards horizontais, faixa do Pinterest, bloco de e-mail), sem destaque no topo.

- **Imagem do card de post:** `card_image`; sem ela usa `og_image`, depois a ilustração do primeiro exercício, depois um bloco com o nome da categoria.
- **Em `src/_data/site.json`:** `tagline`, `brand_line` (frase da marca), `about_blurb`, `social` (links do Pinterest e do Instagram) e `home` (`popular`, `printable_of_the_week`, `free_printable`, `pins`). Em `free_printable`, o campo `image` é opcional: com imagem o card da barra lateral mostra a capa; sem imagem fica compacto.

## 10. Marca

Cores e fontes vêm de `src/_data/tokens.json` (cópia do design system "The Shop Curator — Exercises Brand"). Mudou lá, muda no site inteiro. Todos os componentes aparecem em `/styleguide/` (página fora do Google).

## Printable grátis por e-mail (configurar uma vez na Hostinger)

O formulário do printable grátis envia o link de download pelo **hello@exercisenono.com**, com o servidor de e-mail da própria Hostinger (como o Post SMTP fazia no WordPress). O PDF não fica público: só abre pelo link do e-mail, que vale 30 dias.

1. No Gerenciador de Arquivos, vá para a pasta **acima** do `public_html` e crie a pasta `exercisenono-private`.
2. Dentro dela, crie o arquivo `config.php` copiando o modelo `public_html/api/lib/config.example.php` e troque `SUA-SENHA` pela senha da caixa hello@exercisenono.com. **Nunca** coloque a senha no GitHub.
3. Em **E-mails** no hPanel, confira se SPF e DKIM do domínio estão ativos (evita cair no spam).
4. Teste: peça o printable no site com um e-mail seu.

Nessa mesma pasta privada ficam a **lista de e-mails** (`subscribers.csv`, abre no Excel) e o controle contra abuso (`ratelimit.json`). Os PDFs ficam em `src/api/files/` (bloqueados para acesso direto).
