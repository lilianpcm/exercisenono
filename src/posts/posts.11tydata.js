// Vale para todos os posts desta pasta: layout e endereço /<categoria>/<nome-do-arquivo>/
export default {
  layout: "layouts/post.njk",
  type: "post",
  eleventyComputed: {
    permalink: (data) => {
      const post = data.catalog?.posts?.find?.((p) => p.slug === data.page.fileSlug);
      return post ? post.url : false; // rascunho (draft: true) não é publicado
    },
  },
};
