import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Teeny Store',
  description: 'A stupidly small and simple store for state and effect management',
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: 'Examples', link: '/markdown-examples' }
    ],

    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      }
    ],

    search: {
      provider: 'local',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuezy/teeny-store' }
    ]
  }
})
