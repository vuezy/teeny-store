/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineConfig } from 'vitepress';
import { groupIconMdPlugin, groupIconVitePlugin } from 'vitepress-plugin-group-icons';
import path from 'node:path';

export default defineConfig({
  title: 'Teeny Store',
  description: 'A stupidly small and simple store for state and effect management',
  cleanUrls: true,
  appearance: 'dark',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/guide/examples' },
      { text: 'Reference', link: '/reference' },
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Examples', link: '/guide/examples' },
        ],
      },
      {
        items: [
          { text: 'API Reference', link: '/reference' },
        ],
      },
    ],

    search: {
      provider: 'local',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuezy/teeny-store' }
    ],
  },
  markdown: {
    config: (md) => {
      md.use(groupIconMdPlugin);
    },
    codeTransformers: [
      {
        preprocess: (code, options) => {
          if (!['js', 'ts', 'jsx', 'tsx'].includes(options.lang)) return code;

          if (!code.includes('/* @docs-strip-export */')) return code;

          const stripped = code.replace(
            /\/\* @docs-strip-export \*\/\s*export\s+.*\{\r?\n([\t ]+)([\s\S]*?)\r?\n\};\s*\/\* @docs-strip-export \*\//,
            (match, indent, body) => body.replace(new RegExp('^' + indent, 'gm'), '')
          );
          
          return stripped;
        },
      }
    ],
  },
  vite: {
    resolve: {
      alias: {
        '@vuezy/teeny-store': path.resolve(__dirname, '../../src'),
        '@examples': path.resolve(__dirname, '../examples'),
      },
    },
    plugins: [groupIconVitePlugin() as any],
  },
});
