import { Link } from 'react-router-dom'
import { HiveMarkSvg } from './HiveMarkSvg'

type HeaderLogoProps = {
  /** Full name for accessibility (e.g. "The money hive") */
  ariaLabel: string
  line1: string
  line2: string
  homeTo?: string
  /** When true, only the hive mark is shown (wordmark hidden). */
  markOnly?: boolean
}

export default function HeaderLogo({
  ariaLabel,
  line1,
  line2,
  homeTo = '/',
  markOnly = false,
}: HeaderLogoProps) {
  return (
    <Link
      to={homeTo}
      className="app-header-logo-link"
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <HiveMarkSvg svgClassName="app-header-logo-mark-svg" />
      {!markOnly && (
        <span className="app-header-wordmark">
          <span className="app-header-wordmark-line1">{line1}</span>
          <span className="app-header-wordmark-line2">{line2}</span>
        </span>
      )}
    </Link>
  )
}
