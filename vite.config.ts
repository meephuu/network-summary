import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
import { viteSingleFile } from 'vite-plugin-singlefile'

/** KaTeX ships woff2 + woff + ttf for every font. Modern browsers only need woff2,
 *  so drop the others to keep the single-file build small. */
function katexWoff2Only(): Plugin {
  return {
    name: 'katex-woff2-only',
    enforce: 'pre',
    transform(code, id) {
      if (!/katex(\.min)?\.css/.test(id)) return
      return code.replace(/,\s*url\([^)]*\.(woff|ttf)\)\s*format\("(woff|truetype)"\)/g, '')
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [
    { enforce: 'pre', ...mdx({ remarkPlugins: [remarkGfm, remarkMath], rehypePlugins: [rehypeSlug, rehypeKatex] }) },
    react({ include: /\.(mdx|tsx|ts)$/ }),
    katexWoff2Only(),
    viteSingleFile(),
  ],
  build: { assetsInlineLimit: 100_000_000 },
})
