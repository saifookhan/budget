import { Link } from 'react-router-dom'
import { useTranslation } from '../LanguageContext'

type Tile = {
  to: string
  icon: string
  titleKey: string
  descKey: string
}

const TILES: Tile[] = [
  { to: '/overview', icon: '📊', titleKey: 'nav.overview', descKey: 'appHome.tileOverview' },
  { to: '/expenses', icon: '📝', titleKey: 'expenses.title', descKey: 'appHome.tileExpenses' },
  { to: '/accounts', icon: '💰', titleKey: 'accounts.title', descKey: 'appHome.tileWallet' },
  { to: '/plan', icon: '📅', titleKey: 'plan.navTitle', descKey: 'appHome.tilePlan' },
  { to: '/community', icon: '🐝', titleKey: 'community.title', descKey: 'appHome.tileCommunity' },
]

export default function AppHome() {
  const { t } = useTranslation()
  const linksId = 'app-home-quick-links'

  return (
    <div className="page-content app-home">
      <header className="app-home-header">
        <p className="app-home-header-eyebrow">{t('appHome.heroEyebrow')}</p>
        <h1 className="app-home-header-title">{t('appHome.heroTitle')}</h1>
        <div className="app-home-header-rule" aria-hidden />
        <p className="app-home-header-tagline">{t('appHome.heroTagline')}</p>
      </header>

      <section className="app-home-section" aria-labelledby={linksId}>
        <h2 id={linksId} className="section-title app-home-section-title">
          {t('appHome.quickLinks')}
        </h2>
        <ul className="app-home-grid">
          {TILES.map((tile) => (
            <li key={tile.to}>
              <Link to={tile.to} className="app-home-tile card">
                <span className="app-home-tile-icon" aria-hidden>
                  {tile.icon}
                </span>
                <span className="app-home-tile-text">
                  <span className="app-home-tile-title">{t(tile.titleKey)}</span>
                  <span className="app-home-tile-desc">{t(tile.descKey)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
