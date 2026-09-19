import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'

const docsRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

function sidebarItems(dir: string, prefix: string) {
  const files = readdirSync(join(docsRoot, dir))
    .filter((name) => name.endsWith('.md') && name !== 'index.md')
    .sort((a, b) => a.localeCompare(b))

  return [
    { text: '개요', link: `${prefix}/` },
    ...files.map((name) => {
      const stem = name.replace(/\.md$/, '')
      return { text: stem, link: `${prefix}/${stem}` }
    })
  ]
}

export default defineConfig({
  title: '서울:전국',
  description: '게임설계·세계관 문서 서비스',
  lang: 'ko',
  outDir: 'dist',
  ignoreDeadLinks: true,
  themeConfig: {
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '검색',
            buttonAriaLabel: '검색'
          },
          modal: {
            displayDetails: '상세 목록 표시',
            resetButtonTitle: '검색 초기화',
            backButtonTitle: '검색 닫기',
            noResultsText: '결과를 찾을 수 없습니다',
            footer: {
              selectText: '선택',
              selectKeyAriaLabel: '선택',
              navigateText: '이동',
              navigateUpKeyAriaLabel: '위로',
              navigateDownKeyAriaLabel: '아래로',
              closeText: '닫기',
              closeKeyAriaLabel: '닫기'
            }
          }
        }
      }
    },
    nav: [
      { text: '게임설계', link: '/design/' },
      { text: '세계관', link: '/world/' }
    ],
    sidebar: {
      '/design/': [
        {
          text: '게임설계',
          collapsed: false,
          items: sidebarItems('design', '/design')
        },
        {
          text: '규칙 문서',
          collapsed: true,
          items: sidebarItems('rules', '/rules')
        }
      ],
      '/world/': [
        {
          text: '세계관',
          collapsed: false,
          items: sidebarItems('world', '/world')
        }
      ]
    },
    outlineTitle: '이 페이지에서',
    docFooter: {
      prev: '이전',
      next: '다음'
    },
    darkModeSwitchLabel: '테마',
    lightModeSwitchTitle: '라이트 모드로 전환',
    darkModeSwitchTitle: '다크 모드로 전환',
    sidebarMenuLabel: '메뉴',
    returnToTopLabel: '맨 위로',
    langMenuLabel: '언어 변경'
  }
})
