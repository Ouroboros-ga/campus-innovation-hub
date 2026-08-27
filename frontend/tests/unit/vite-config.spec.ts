import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('development API proxy', () => {
  it('proxies API and media through the loopback SSH tunnel by default', () => {
    const content = readFileSync(resolve(import.meta.dirname, '../../vite.config.ts'), 'utf-8')
    expect(content).toContain("'/api'")
    expect(content).toContain("'/media'")
    expect(content).toContain('http://127.0.0.1:18000')
    expect(content).toContain('changeOrigin: false')
  })
})
