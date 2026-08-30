import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'
import { build } from 'vite'

const frontendRoot = path.resolve(import.meta.dirname, '../..')
const temporaryDirectories: string[] = []

async function readBuildText(directory: string): Promise<string> {
  const entries = await readdir(directory, { withFileTypes: true })
  const texts = await Promise.all(
    entries.map(async entry => {
      const entryPath = path.join(directory, entry.name)

      if (entry.isDirectory()) {
        return readBuildText(entryPath)
      }

      return /\.(?:html|js)$/.test(entry.name)
        ? readFile(entryPath, 'utf8')
        : ''
    })
  )

  return texts.join('\n')
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(directory =>
      rm(directory, { recursive: true, force: true })
    )
  )
})

describe('生产路由边界', () => {
  it('生产构建不包含开发设计系统路由及页面代码', async () => {
    const outDir = await mkdtemp(
      path.join(tmpdir(), 'campus-innovation-hub-production-')
    )
    temporaryDirectories.push(outDir)
    const previousNodeEnv = process.env.NODE_ENV

    process.env.NODE_ENV = 'production'
    try {
      await build({
        root: frontendRoot,
        mode: 'production',
        build: { outDir, emptyOutDir: true }
      })
    } finally {
      process.env.NODE_ENV = previousNodeEnv
    }

    const buildText = await readBuildText(outDir)

    expect(buildText).not.toContain('/dev/design-system')
    expect(buildText).not.toContain('设计系统活体参考')
  }, 30_000)
})
