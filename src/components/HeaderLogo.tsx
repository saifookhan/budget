import { Link } from 'react-router-dom'

type HeaderLogoProps = {
  label: string
  homeTo?: string
}

/** Flat-top hex centered at origin, circumradius ~9 */
const HEX = 'M0-9L7.794-4.5L7.794 4.5L0 9L-7.794 4.5L-7.794-4.5Z'

export default function HeaderLogo({ label, homeTo = '/overview' }: HeaderLogoProps) {
  return (
    <Link
      to={homeTo}
      className="app-header-logo-link"
      aria-label={label}
      title={label}
    >
      <svg
        className="app-header-logo"
        viewBox="0 0 272 36"
        width={272}
        height={36}
        role="img"
        aria-hidden
      >
        <g className="app-header-logo-mark" transform="translate(16 18)">
          <path d={HEX} transform="translate(-7.794 0)" />
          <path d={HEX} transform="translate(7.794 0)" />
        </g>
        <text className="app-header-logo-wordmark" x={40} y={25} dominantBaseline="middle">
          {label}
        </text>
      </svg>
    </Link>
  )
}
