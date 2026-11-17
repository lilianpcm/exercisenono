// Vale para todos os exercícios desta pasta: layout e endereço /exercises/<nome-do-arquivo>/
export default {
  layout: "layouts/exercise.njk",
  type: "exercise",
  eleventyComputed: {
    permalink: (data) => (data.catalog?.exercises?.[data.page.fileSlug] ? `/exercises/${data.page.fileSlug}/` : false),
  },
};
