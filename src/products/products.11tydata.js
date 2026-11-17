// Vale para todos os produtos desta pasta: layout e endereço /printables/<nome-do-arquivo>/
export default {
  layout: "layouts/product.njk",
  type: "product",
  eleventyComputed: {
    permalink: (data) => (data.catalog?.products?.[data.page.fileSlug] ? `/printables/${data.page.fileSlug}/` : false),
  },
};
