import type { NuxtUIOptions } from '@nuxt/ui/unplugin'

export const uiColors = {
  primary: 'primary',
  success: 'success',
  info: 'primary',
  warning: 'warning',
  error: 'danger',
  neutral: 'neutral'
} as const

export const uiTheme = {
  colors: uiColors,
  button: {
    slots: {
      base: 'min-h-11 min-w-11'
    },
    compoundVariants: [
      {
        color: 'primary',
        variant: 'solid',
        class:
          'bg-primary hover:bg-primary-700 active:bg-primary-700 dark:hover:bg-primary-400 dark:active:bg-primary-400'
      }
    ]
  },
  input: {
    slots: {
      base: 'min-h-11'
    }
  },
  select: {
    slots: {
      base: 'min-h-11'
    }
  },
  checkbox: {
    slots: {
      root: 'min-h-11 items-center'
    }
  },
  radioGroup: {
    slots: {
      item: 'min-h-11 items-center'
    }
  }
} satisfies NonNullable<NuxtUIOptions['ui']>
