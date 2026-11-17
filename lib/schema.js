// Dados estruturados (JSON-LD) de cada tipo de página.
// Decisões: sem Product (o site não vende e o preço muda no Etsy) e sem HowTo
// (o Google não mostra mais). FAQPage fica porque sai dos mesmos dados.
import { imgUrl, shareUrl, isoDate, etsyUrl } from "./helpers.js";

const abs = (site, url) => (String(url).startsWith("http") ? url : site.url + url);

function org(site) {
  return {
    "@type": "Organization",
    "@id": `${site.url}/#organization`,
    name: site.name,
    url: `${site.url}/`,
    logo: { "@type": "ImageObject", url: abs(site, "/assets/brand/exercise-no-no-512.png") },
    sameAs: [site.shop_url],
  };
}

function breadcrumbs(site, crumbs) {
  if (!crumbs?.length) return null;
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: abs(site, c.url) })),
  };
}

function faq(items) {
  if (!items?.length) return null;
  return { "@type": "FAQPage", mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
}

function image(site, rel, alt) {
  return {
    "@type": "ImageObject",
    contentUrl: abs(site, imgUrl(rel)),
    caption: alt,
    creditText: site.name,
    creator: { "@id": `${site.url}/#organization` },
    copyrightNotice: `© ${site.name}`,
    license: abs(site, "/free-illustrations/"),
    acquireLicensePage: abs(site, "/free-illustrations/"),
  };
}

export function schemaFor(data) {
  const { site, catalog, page } = data;
  if (!page?.url) return ""; // página não publicada (rascunho ou categoria sem posts)
  const url = abs(site, page.url);
  const graph = [];
  const add = (n) => n && graph.push(n);
  const kind = data.schema || data.type;

  if (kind === "home") {
    add(org(site));
    add({ "@type": "WebSite", "@id": `${site.url}/#website`, url: `${site.url}/`, name: site.name, inLanguage: site.lang, publisher: { "@id": `${site.url}/#organization` } });
  }

  if (kind === "post") {
    const post = catalog.posts.find((p) => p.slug === page.fileSlug);
    const images = [];
    for (const e of post?.exercises || []) {
      const v = catalog.exercises[e.ref]?.variants?.[0];
      if (v) images.push(abs(site, imgUrl(v.finish)));
    }
    if (data.og_image) images.unshift(abs(site, shareUrl(data.og_image)));
    add(org(site));
    add({
      "@type": "BlogPosting",
      "@id": `${url}#article`,
      mainEntityOfPage: url,
      headline: data.title,
      description: data.description,
      inLanguage: site.lang,
      datePublished: isoDate(data.date),
      dateModified: isoDate(data.updated || data.date),
      author: { "@type": "Organization", name: site.author, url: abs(site, "/editorial-policy/") },
      publisher: { "@id": `${site.url}/#organization` },
      image: images.length ? images : undefined,
      citation: (data.sources || []).map((s) => ({ "@type": "CreativeWork", name: s.name, url: s.url })),
    });
    add(faq(data.faq));
  }

  if (kind === "exercise") {
    const ex = catalog.exercises[page.fileSlug];
    const v = ex?.variants?.[0];
    add(org(site));
    add({
      "@type": "Article",
      "@id": `${url}#article`,
      mainEntityOfPage: url,
      headline: data.title || data.name,
      description: data.description || data.answer,
      inLanguage: site.lang,
      datePublished: isoDate(data.date),
      dateModified: isoDate(data.updated || data.date),
      author: { "@type": "Organization", name: site.author, url: abs(site, "/editorial-policy/") },
      publisher: { "@id": `${site.url}/#organization` },
      image: (ex?.variants || []).flatMap((x) => [image(site, x.start, `${x.alt} — start position`), image(site, x.finish, `${x.alt} — finish position`)]),
      citation: (data.sources || []).map((s) => ({ "@type": "CreativeWork", name: s.name, url: s.url })),
    });
    // VideoObject só aqui, onde o vídeo é o conteúdo principal da página
    if (v?.video?.mp4 && data.date instanceof Date) {
      add({
        "@type": "VideoObject",
        name: `${data.name} demo`,
        description: data.answer,
        thumbnailUrl: [abs(site, shareUrl(v.finish))],
        uploadDate: isoDate(data.date),
        contentUrl: abs(site, `/assets/video/${v.video.mp4}`),
      });
    }
    add(faq(data.faq));
  }

  if (kind === "category") {
    add(org(site));
    add({ "@type": "CollectionPage", "@id": `${url}#page`, url, name: data.title, description: data.description, inLanguage: site.lang, isPartOf: { "@id": `${site.url}/#website` } });
    add(faq(data.faq));
  }

  if (kind === "product") {
    // página de apresentação: quem vende é o Etsy, por isso não há Product/Offer
    const p = catalog.products[page.fileSlug];
    add({ "@type": "WebPage", "@id": `${url}#page`, url, name: data.title || data.name, description: data.description, inLanguage: site.lang, significantLink: p ? etsyUrl(site, p.etsy_url, p.slug, "schema") : undefined });
    add(faq(data.faq));
  }

  add(breadcrumbs(site, data.crumbs));
  if (!graph.length) return "";
  const jsonText = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">${jsonText}</script>`;
}
