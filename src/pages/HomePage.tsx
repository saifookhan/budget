import HeaderLogo from '../components/HeaderLogo'
import { AuthThemeSwitcher } from '../components/AuthThemeSwitcher'
import { LoginForm } from '../LoginForm'
import { t } from '../i18n'
import { getState } from '../store'

export default function HomePage() {
  const lang = getState().language ?? 'en'
  const T = (key: string) => t(key, lang)

  return (
    <div className="home-page">
      <div className="home-page-theme-bar">
        <AuthThemeSwitcher id="home-theme" label={T('nav.theme')} />
      </div>
      <div className="home-page-split">
        <div className="home-hero">
          <div className="home-hero-inner">
            <div className="home-hero-mark">
              <HeaderLogo
                ariaLabel={T('app.headerBrand')}
                line1={T('app.wordmarkLine1')}
                line2={T('app.wordmarkLine2')}
                homeTo="/"
                markOnly
              />
            </div>
            <p className="home-eyebrow">Your money, your chance to change</p>
            <h1 className="home-title">The money hive</h1>
            <div className="home-title-rule" aria-hidden />
            <p className="home-tagline">
              Track income, spending, and subscriptions in one place—simple, clear, and yours.
            </p>
          </div>
          <div className="home-hero-pattern" aria-hidden />
        </div>
        <aside className="home-login-wrap">
          <div className="home-login-card auth-card card">
            <LoginForm embedded />
          </div>
        </aside>
      </div>
    </div>
  )
}
