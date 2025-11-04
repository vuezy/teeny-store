/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineConfig } from 'vitepress';
import { groupIconMdPlugin, groupIconVitePlugin } from 'vitepress-plugin-group-icons';
import path from 'node:path';

export default defineConfig({
  title: 'Teeny Store',
  description: 'A stupidly small and simple store for state and effect management',
  head: [
    ['link', { rel: 'icon', href: '/logo.ico' }],
  ],
  cleanUrls: true,
  base: '/teeny-store/',
  appearance: 'dark',
  themeConfig: {
    logo: '/logo.png',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/guide/examples' },
      { text: 'Reference', link: '/api/teeny-store' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Learn the Basics', link: '/guide/basics' },
            { text: 'Extend the Store', link: '/guide/extensibility' },
            { text: 'Examples', link: '/guide/examples' },
          ],
        },
        {
          items: [
            { text: 'API Reference', link: '/api/teeny-store' },
          ],
        },
      ],

      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Teeny Store', link: '/api/teeny-store' },
            { text: 'Effect Processor', link: '/api/effect-processor' },
            { text: 'Effect Service', link: '/api/effect-service' },
            { text: 'Computation Service', link: '/api/computation-service' },
            { text: 'Persistence Plugin', link: '/api/persistence-plugin' },
          ],
        },
      ],
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025-PRESENT Shane Christian Kwok',
    },

    search: {
      provider: 'local',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuezy/teeny-store' }
    ],

    outline: {
      level: [2, 3],
    },
  },
  markdown: {
    config: (md) => {
      md.use(groupIconMdPlugin);
    },
    codeTransformers: [
      {
        preprocess: (code, options) => {
          if (!['js', 'ts', 'jsx', 'tsx'].includes(options.lang)) return code;

          if (!code.includes('/* @docs-strip-export */') && !code.includes('/* @docs-exclude */')) return code;

          const stripped = code.replace(
            /\/\* @docs-strip-export \*\/\s*export\s+.*\{\r?\n([\t ]+)([\s\S]*?)\r?\n\};\s*\/\* @end-docs-strip-export \*\//,
            (match, indent, body) => body.replace(new RegExp('^' + indent, 'gm'), '')
          ).replace(/\s*\/\* @docs-exclude \*\/[\s\S]*\/\* @end-docs-exclude \*\//, '');
          
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
