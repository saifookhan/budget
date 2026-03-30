import { useId } from 'react'

/** Flat-top hex, circumradius 7 — three cells in a tight honeycomb triangle */
const HIVE_HEX = 'M0-7L6.062-3.5L6.062 3.5L0 7L-6.062 3.5L-6.062-3.5Z'

const HIVE_CELLS = [
  { tx: 0, ty: -7 },
  { tx: -6.062, ty: 3.5 },
  { tx: 6.062, ty: 3.5 },
] as const

type HiveMarkSvgProps = {
  /** Merged into the root <svg> (e.g. app-header-logo-mark-svg) */
  svgClassName?: string
  /** Default matches header logo */
  scale?: number
}

/**
 * Honeycomb hive mark (three hexes). Stroke uses `.app-header-logo-hex` + `--hive-outline`.
 */
export function HiveMarkSvg({ svgClassName, scale = 1.1 }: HiveMarkSvgProps) {
  const rawId = useId()
  const gradId = `hive-grad-${rawId.replace(/:/g, '')}`
  const cls = ['hive-mark-svg', svgClassName].filter(Boolean).join(' ')

  return (
    <svg
      className={cls}
      viewBox="-6 -2 52 44"
      preserveAspectRatio="xMidYMid meet"
      overflow="visible"
      role="img"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="22" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="52%" stopColor="var(--accent)" stopOpacity={0.88} />
          <stop offset="100%" stopColor="var(--success)" stopOpacity={0.95} />
        </linearGradient>
      </defs>
      <g transform={`translate(18 19) scale(${scale})`}>
        {HIVE_CELLS.map((p, i) => (
          <path
            key={i}
            d={HIVE_HEX}
            transform={`translate(${p.tx} ${p.ty})`}
            fill={`url(#${gradId})`}
            className="app-header-logo-hex"
          />
        ))}
      </g>
    </svg>
  )
}
