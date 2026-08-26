import { describe, expect, it } from 'vitest'

import config from '../../vite.config'

describe('development API proxy', () => {
  it('proxies API and media through the loopback SSH tunnel by default', () => {
    expect(config.server?.proxy?.['/api']).toMatchObject({
      target: 'http://127.0.0.1:18000',
      changeOrigin: false
    })
    expect(config.server?.proxy?.['/media']).toMatchObject({
      target: 'http://127.0.0.1:18000',
      changeOrigin: false
    })
  })
})
