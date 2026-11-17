// Lê os arquivos de conteúdo (posts, exercícios, produtos, categorias), confere se
// estão completos e monta o "catálogo" que os templates usam para ligar tudo.
// Se algo estiver errado, o build para com uma mensagem em português.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const SRC = path.resolve("src");
const IMG = path.join(SRC, "assets", "img");
const ASSETS = path.join(SRC, "assets");

// Um placeholder é um texto entre colchetes começando em MAIÚSCULAS: [POST TITLE]
export const PLACEHOLDER = /\[[A-Z][A-Z0-9 ]{2,}[^\]]*\](?!\()/;
export const hasPlaceholder = (...parts) => PLACEHOLDER.test(parts.map((p) => (typeof p === "string" ? p : JSON.stringify(p ?? ""))).join("\n"));

export const CHARACTERS = ["senior-woman", "senior-man", "woman-50", "younger-woman", "younger-man"];

const json = (f) => JSON.parse(fs.readFileSync(path.join(SRC, "_data", f), "utf8"));

function loadDir(dir) {
  const full = path.join(SRC, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .sort()
    .map((f) => {
      const parsed = matter(fs.readFileSync(path.join(full, f), "utf8"));
      return { file: `${dir}/${f}`, slug: f.replace(/\.md$/, ""), data: parsed.data, body: parsed.content };
    });
}

const isText = (v) => typeof v === "string" && v.trim().length > 0;
const isList = (v) => Array.isArray(v) && v.length > 0;

export function buildCatalog() {
  const site = json("site.json");
  const cats = json("categories.json");
  const catKeys = cats.map((c) => c.key);
  const errors = [];
  const warnings = [];
  const err = (file, msg) => errors.push(`${file}: ${msg}`);
  const showDrafts = !!process.env.DRAFTS;

  const needText = (item, fields) => {
    for (const f of fields) {
      const v = item.data[f];
      if (Array.isArray(v)) err(item.file, `o campo "${f}" precisa estar entre aspas (ex.: ${f}: "[TEXTO]"). Sem aspas, os colchetes viram lista.`);
      else if (!isText(v)) err(item.file, `falta o campo "${f}".`);
    }
  };
  const needList = (item, fields) => {
    for (const f of fields) if (!isList(item.data[f])) err(item.file, `o campo "${f}" precisa ter pelo menos 1 item.`);
  };
  const needCategory = (item) => {
    if (!catKeys.includes(item.data.category)) err(item.file, `categoria "${item.data.category}" não existe. Use uma destas: ${catKeys.join(", ")}.`);
  };
  const needSources = (item) => {
    needList(item, ["sources"]);
    for (const s of item.data.sources || []) if (!isText(s?.name) || !isText(s?.url)) err(item.file, `cada fonte em "sources" precisa de "name" e "url".`);
  };
  const needImage = (item, rel, label) => {
    if (!isText(rel)) return err(item.file, `falta a imagem "${label}".`);
    if (!fs.existsSync(path.join(IMG, rel))) err(item.file, `a imagem "${rel}" (${label}) não existe em src/assets/img/.`);
  };

  // ---------- exercícios ----------
  const exercises = {};
  for (const it of loadDir("exercises")) {
    const d = it.data;
    needText(it, ["name", "answer", "tip"]);
    needCategory(it);
    needList(it, ["muscles", "equipment", "common_mistakes", "variants"]);
    if (!Array.isArray(d.steps) || d.steps.length < 2) err(it.file, `"steps" precisa ter pelo menos 2 passos.`);
    needSources(it);
    for (const v of d.variants || []) {
      if (!CHARACTERS.includes(v.character)) err(it.file, `personagem "${v.character}" não existe. Use: ${CHARACTERS.join(", ")}.`);
      needImage(it, v.start, "start");
      needImage(it, v.finish, "finish");
      if (!isText(v.alt)) err(it.file, `falta o texto alternativo ("alt") da versão ${v.character}.`);
      for (const k of ["mp4", "webm", "gif"]) {
        if (v.video?.[k] && !fs.existsSync(path.join(ASSETS, "video", v.video[k]))) err(it.file, `o vídeo "${v.video[k]}" não existe em src/assets/video/.`);
      }
      if (v.video && !v.video.mp4) err(it.file, `o vídeo da versão ${v.character} precisa do arquivo "mp4".`);
    }
    if (d.draft && !showDrafts) continue;
    exercises[it.slug] = {
      ...d,
      slug: it.slug,
      url: `/exercises/${it.slug}/`,
      placeholder: hasPlaceholder(d, it.body),
      posts: [],
      products: [],
    };
  }

  // ---------- produtos ----------
  const products = {};
  for (const it of loadDir("products")) {
    const d = it.data;
    needText(it, ["name", "etsy_url", "description"]);
    needCategory(it);
    needList(it, ["includes"]);
    needImage(it, d.cover, "cover");
    for (const t of d.thumbs || []) needImage(it, t.src, "thumbs");
    for (const ref of d.sample_exercises || []) {
      if (!exercises[ref]) err(it.file, `"sample_exercises" cita o exercício "${ref}", que não existe em src/exercises/.`);
      else exercises[ref].products.push(it.slug);
    }
    if (d.draft && !showDrafts) continue;
    const placeholder = hasPlaceholder(d, it.body);
    products[it.slug] = { ...d, slug: it.slug, url: `/printables/${it.slug}/`, placeholder, indexable: d.index === true && !placeholder };
  }

  // ---------- posts ----------
  const posts = [];
  const keywords = new Map();
  const catOf = (key) => cats.find((c) => c.key === key);
  for (const it of loadDir("posts")) {
    const d = it.data;
    const kind = d.kind || "routine";
    if (!["routine", "article"].includes(kind)) err(it.file, `"kind" precisa ser "routine" ou "article".`);
    if (d.type) err(it.file, `não use o campo "type" no post; o tipo do post vai em "kind" (routine ou article).`);
    needText(it, ["title", "description", "keyword"]);
    needCategory(it);
    needList(it, ["key_takeaways"]);
    needSources(it);
    if (!(d.date instanceof Date)) err(it.file, `falta a data ("date"), no formato 2026-11-30.`);
    if (d.updated && !(d.updated instanceof Date)) err(it.file, `"updated" precisa estar no formato 2026-11-30.`);
    if (d.audience && !CHARACTERS.includes(d.audience)) err(it.file, `"audience" precisa ser um destes: ${CHARACTERS.join(", ")}.`);
    if (kind === "routine") {
      needList(it, ["exercises", "faq"]);
      if (!isText(d.product)) err(it.file, `falta o campo "product" (post de rotina sempre aponta para um produto).`);
    }
    for (const q of d.faq || []) if (!isText(q?.q) || !isText(q?.a)) err(it.file, `cada item de "faq" precisa de "q" (pergunta) e "a" (resposta).`);
    for (const e of d.exercises || []) {
      if (!exercises[e?.ref]) err(it.file, `cita o exercício "${e?.ref}", que não existe em src/exercises/ (ou está como rascunho).`);
      if (!isText(e?.dose)) err(it.file, `o exercício "${e?.ref}" está sem "dose" (ex.: "3 × 10 REPS").`);
    }
    if (d.product && !products[d.product]) err(it.file, `cita o produto "${d.product}", que não existe em src/products/.`);
    if (isText(d.keyword)) {
      const k = d.keyword.trim().toLowerCase();
      if (!hasPlaceholder(k) && keywords.has(k)) err(it.file, `a keyword "${d.keyword}" já é usada em ${keywords.get(k)}. Cada post precisa de uma keyword só dele.`);
      keywords.set(k, it.file);
    }
    if (isText(d.description) && !hasPlaceholder(d.description) && d.description.length > 160) warnings.push(`${it.file}: a "description" tem ${d.description.length} caracteres (o ideal é até 160).`);
    if (d.draft && !showDrafts) continue;
    const cat = catOf(d.category);
    let placeholder = hasPlaceholder(d, it.body);
    for (const e of d.exercises || []) {
      const ex = exercises[e.ref];
      if (!ex) continue;
      if (ex.placeholder) placeholder = true;
      if (!ex.posts.includes(it.slug)) ex.posts.push(it.slug);
    }
    if (d.product && products[d.product]) {
      for (const e of d.exercises || []) if (exercises[e.ref] && !exercises[e.ref].products.includes(d.product)) exercises[e.ref].products.push(d.product);
    }
    posts.push({
      ...d,
      kind,
      slug: it.slug,
      file: it.file,
      url: cat ? `/${cat.slug}/${it.slug}/` : "/",
      placeholder,
      indexable: !placeholder && d.index !== false,
    });
  }
  for (const slug of site.home?.popular || []) if (!posts.find((x) => x.slug === slug)) warnings.push(`site.json: "home.popular" cita o post "${slug}", que não existe (ou é rascunho).`);
  if (site.home?.printable_of_the_week && !products[site.home.printable_of_the_week]) warnings.push(`site.json: "home.printable_of_the_week" cita o produto "${site.home.printable_of_the_week}", que não existe.`);
  for (const p of posts) for (const r of p.related || []) if (!posts.find((x) => x.slug === r)) err(p.file, `"related" cita o post "${r}", que não existe.`);
  posts.sort((a, b) => (b.date?.getTime?.() || 0) - (a.date?.getTime?.() || 0));

  // ---------- categorias ----------
  const pages = Object.fromEntries(loadDir("categories").map((it) => [it.data.key, it]));
  const categories = {};
  for (const c of cats) {
    const page = pages[c.key];
    if (!page) {
      err(`categories/${c.slug}.md`, `falta o arquivo da categoria "${c.name}".`);
      continue;
    }
    needText(page, ["title", "description", "intro"]);
    const count = posts.filter((p) => p.category === c.key).length;
    const ready = page.data.guide_ready === true;
    const status = count === 0 ? "off" : count >= site.min_posts_per_category && ready ? "live" : "soft";
    const placeholder = hasPlaceholder(page.data, page.body);
    categories[c.key] = { ...c, ...page.data, url: `/${c.slug}/`, postCount: count, status, placeholder, indexable: status === "live" && !placeholder };
  }

  if (errors.length) {
    throw new Error(`\n\nERROS NO CONTEÚDO — corrija e gere o site de novo:\n\n - ${errors.join("\n - ")}\n`);
  }

  const exerciseList = Object.values(exercises).sort((a, b) => a.name.localeCompare(b.name));
  for (const e of exerciseList) e.indexable = !e.placeholder;
  const productList = Object.values(products);
  const catList = cats.map((c) => categories[c.key]);
  return {
    categories,
    catList,
    liveCats: catList.filter((c) => c.status === "live"),
    posts,
    exercises,
    exerciseList,
    products,
    productList,
    warnings,
    counts: {
      indexableProducts: productList.filter((p) => p.indexable).length,
      indexableExercises: exerciseList.filter((e) => e.indexable).length,
    },
  };
}
