import { useId } from 'react'
import { Link } from 'react-router-dom'

type HeaderLogoProps = {
  label: string
  homeTo?: string
}

/** Flat-top hex, circumradius 7 — three cells in a tight honeycomb triangle */
const HEX = 'M0-7L6.062-3.5L6.062 3.5L0 7L-6.062 3.5L-6.062-3.5Z'

/** Centers at mutual distance √3·R (touching); triangle pointing up */
const HIVE = [
  { tx: 0, ty: -7 },
  { tx: -6.062, ty: 3.5 },
  { tx: 6.062, ty: 3.5 },
] as const

export default function HeaderLogo({ label, homeTo = '/overview' }: HeaderLogoProps) {
  const rawId = useId()
  const gradId = `hive-grad-${rawId.replace(/:/g, '')}`

  return (
    <Link
      to={homeTo}
      className="app-header-logo-link"
      aria-label={label}
      title={label}
    >
      <svg
        className="app-header-logo"
        viewBox="0 0 288 40"
        width={288}
        height={40}
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
        <g className="app-header-logo-mark" transform="translate(15 20)">
          {HIVE.map((p, i) => (
            <path
              key={i}
              d={HEX}
              transform={`translate(${p.tx} ${p.ty})`}
              fill={`url(#${gradId})`}
              className="app-header-logo-hex"
              strokeLinejoin="round"
            />
          ))}
        </g>
        <text className="app-header-logo-wordmark" x={42} y={26} dominantBaseline="middle">
          {label}
        </text>
      </svg>
    </Link>
  )
}
