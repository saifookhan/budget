import { LoginForm } from '../LoginForm'

export default function HomePage() {
  return (
    <div className="home-page">
      <div className="home-hero">
        <div className="home-hero-inner">
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
  )
}
