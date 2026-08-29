<template>
  <RouterLink
    to="/"
    class="group inline-flex min-h-11 shrink-0 items-center gap-3 rounded-control focus-visible:outline-offset-4"
    aria-label="返回首页"
  >
    <span
      class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary-200 bg-white shadow-sm transition-colors group-hover:border-primary-300 dark:border-primary-800"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 100"
        class="size-10"
        role="img"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="white"
          stroke="#0F6FE8"
          stroke-width="3"
        />
        <circle
          cx="50"
          cy="50"
          r="39"
          fill="none"
          stroke="#0F6FE8"
          stroke-width="1.4"
        />
        <defs>
          <path
            id="sit-logo-top-arc"
            d="M 18 55 A 32 32 0 0 1 82 55"
          />
          <path
            id="sit-logo-bottom-arc"
            d="M 14 58 A 36 36 0 0 0 86 58"
          />
        </defs>
        <text
          font-family="'PingFang SC','Microsoft YaHei',sans-serif"
          font-size="6.4"
          fill="#0B3EA8"
          font-weight="700"
          letter-spacing="0.7"
        >
          <textPath
            href="#sit-logo-top-arc"
            startOffset="50%"
            text-anchor="middle"
            dominant-baseline="middle"
          >
            绍兴理工学院
          </textPath>
        </text>
        <text
          font-family="Georgia,serif"
          font-size="4.2"
          fill="#0B3EA8"
          font-weight="600"
          letter-spacing="0.5"
        >
          <textPath
            href="#sit-logo-bottom-arc"
            startOffset="50%"
            text-anchor="middle"
          >
            SHAOXING INSTITUTE OF TECHNOLOGY
          </textPath>
        </text>
        <text
          x="50"
          y="79.5"
          font-family="'PingFang SC','Microsoft YaHei',sans-serif"
          font-size="6"
          fill="#0B3EA8"
          font-weight="700"
          text-anchor="middle"
        >
          人工智能学院
        </text>
        <g transform="translate(50 50)">
          <path
            d="M -18 14 L -2 -20 L 20 10 L 4 13 Z"
            fill="#0B3EA8"
          />
          <path
            d="M 1 -14 L 17 5"
            stroke="white"
            stroke-width="1.1"
            stroke-linecap="round"
          />
          <path
            d="M 4 -11 L 19 7.5"
            stroke="white"
            stroke-width="1.1"
            stroke-linecap="round"
          />
          <path
            d="M -21 14 Q 0 7 26 11 L 20 18 Q 0 20 -16 16 Z"
            fill="#0B3EA8"
          />
          <path
            d="M -30 20 Q -12 12 10 20 Q 26 24 36 20 Q 22 26 0 24 Q -15 23 -30 20 Z"
            fill="#0B3EA8"
          />
          <path
            d="M -22 25.5 Q -10 22 2 25.5 Q 10 27.5 17 25.5 Q 10 28.5 -4 28 Q -14 27.5 -22 25.5 Z"
            fill="#0B3EA8"
          />
        </g>
      </svg>
    </span>
    <span class="min-w-0 sm:block">
      <span class="block truncate text-base font-bold leading-5 text-highlighted">
        科创与就业服务平台
      </span>
      <span class="mt-0.5 block text-xs leading-4 text-muted">
        SIT 人工智能学院
      </span>
    </span>
  </RouterLink>
</template>
