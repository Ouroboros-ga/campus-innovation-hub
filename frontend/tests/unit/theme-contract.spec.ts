import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { uiColors } from '@/shared/theme/config'

const tokensCss = readFileSync(
  path.resolve('src/shared/styles/tokens.css'),
  'utf8'
)

function ruleBody(selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = tokensCss.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\n\\}`))

  if (!match?.[1]) {
    throw new Error(`未找到主题规则：${selector}`)
  }

  return match[1]
}

function hexToken(scope: string, token: string): string {
  const match = scope.match(new RegExp(`--${token}:\\s*(#[0-9A-Fa-f]{6})`))

  if (!match?.[1]) {
    throw new Error(`未找到颜色 token：${token}`)
  }

  return match[1].toUpperCase()
}

function relativeLuminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    ?.map(channel => Number.parseInt(channel, 16) / 255)

  if (!channels || channels.length !== 3) {
    throw new Error(`无效颜色：${hex}`)
  }

  const [red, green, blue] = channels.map(channel =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  )

  return 0.2126 * red! + 0.7152 * green! + 0.0722 * blue!
}

function contrastRatio(first: string, second: string): number {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort(
    (left, right) => right - left
  )

  return (lighter! + 0.05) / (darker! + 0.05)
}

describe('主题契约', () => {
  const lightTheme = ruleBody('@theme static')
  const darkTheme = ruleBody('.dark')

  it('primary 色阶保持锚点并按明度连续递减', () => {
    const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
    const colors = shades.map(shade => hexToken(lightTheme, `color-primary-${shade}`))
    const luminances = colors.map(relativeLuminance)

    expect(colors[0]).toBe('#EEF6FF')
    expect(colors[1]).toBe('#DDEBFF')
    expect(colors[5]).toBe('#1677FF')
    expect(colors[6]).toBe('#0F6FE8')
    expect(colors[7]).toBe('#0B5FC7')

    for (let index = 1; index < luminances.length; index += 1) {
      expect(luminances[index]).toBeLessThan(luminances[index - 1]!)
    }
  })

  it('核心文字颜色在亮暗表面均达到 WCAG AA', () => {
    expect(
      contrastRatio('#FFFFFF', hexToken(lightTheme, 'color-primary-600'))
    ).toBeGreaterThanOrEqual(4.5)
    expect(
      contrastRatio(
        hexToken(lightTheme, 'color-text-muted'),
        hexToken(lightTheme, 'color-surface')
      )
    ).toBeGreaterThanOrEqual(4.5)
    expect(
      contrastRatio(
        hexToken(darkTheme, 'color-primary-400'),
        hexToken(darkTheme, 'color-canvas')
      )
    ).toBeGreaterThanOrEqual(4.5)
    expect(
      contrastRatio(
        hexToken(darkTheme, 'color-text-muted'),
        hexToken(darkTheme, 'color-surface')
      )
    ).toBeGreaterThanOrEqual(4.5)
  })

  it('将项目 danger 语义适配到 Nuxt UI error alias', () => {
    expect(uiColors.error).toBe('danger')
    expect(uiColors.info).toBe('primary')
  })
})
