import { useId } from 'react'

type BeeMarkSvgProps = {
  svgClassName?: string
  /** Default tuned for bottom nav / tiles */
  scale?: number
}

/**
 * Friendly bee mark for the Meet / Community section (nav, home tiles, page title).
 * Silhouette kept simple so it reads at ~1.3rem (fewer stripes, larger wings, minimal eyes).
 * Header keeps HiveMarkSvg (honeycomb) as the app wordmark.
 */
export function BeeMarkSvg({ svgClassName, scale = 1 }: BeeMarkSvgProps) {
  const rawId = useId()
  const safe = rawId.replace(/:/g, '')
  const gradId = `bee-grad-${safe}`
  const clipId = `bee-body-${safe}`

  const cls = ['bee-mark-svg', svgClassName].filter(Boolean).join(' ')

  return (
    <svg
      className={cls}
      viewBox="-22 -22 44 44"
      preserveAspectRatio="xMidYMid meet"
      overflow="visible"
      role="img"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="-16" x2="0" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="48%" stopColor="var(--accent)" stopOpacity={0.92} />
          <stop offset="100%" stopColor="var(--success)" stopOpacity={0.96} />
        </linearGradient>
        <clipPath id={clipId}>
          <ellipse cx="0" cy="5" rx="10" ry="12" />
        </clipPath>
      </defs>
      <g transform={`scale(${scale})`}>
        {/* Wings — slightly larger so they read at small sizes */}
        <g className="bee-mark-wing">
          <ellipse cx="-13.5" cy="1" rx="12.5" ry="7.2" transform="rotate(-38 -13.5 1)" />
        </g>
        <g className="bee-mark-wing">
          <ellipse cx="13.5" cy="1" rx="12.5" ry="7.2" transform="rotate(38 13.5 1)" />
        </g>
        <ellipse cx="0" cy="5" rx="10" ry="12" fill={`url(#${gradId})`} className="bee-mark-body" />
        {/* Two stripes only — less visual noise than three */}
        <g clipPath={`url(#${clipId})`}>
          <rect x="-10" y="1" width="20" height="3.2" fill="#1f1520" opacity={0.8} />
          <rect x="-10" y="9" width="20" height="3.2" fill="#1f1520" opacity={0.8} />
        </g>
        <circle cx="0" cy="-11" r="7" fill={`url(#${gradId})`} className="bee-mark-body" />
        {/* Simple eyes — no white rings (cleaner when scaled down) */}
        <circle cx="-2.6" cy="-11" r="1.15" fill="#1a1018" />
        <circle cx="2.6" cy="-11" r="1.15" fill="#1a1018" />
        <path
          d="M -3.5 -16.5 L -5.2 -21.5"
          fill="none"
          className="bee-mark-antenna"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
        <path
          d="M 3.5 -16.5 L 5.2 -21.5"
          fill="none"
          className="bee-mark-antenna"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}
