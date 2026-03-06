import { LoginForm } from '../LoginForm'

export default function HomePage() {
  return (
    <div className="home-page">
      <div className="home-hero">
        <h1 className="home-title">My Budget</h1>
        <p className="home-tagline">
          Track income, expenses, and subscriptions in one place. Stay on top of your money.
        </p>
        <ul className="home-features">
          <li>Overview and charts</li>
          <li>Income & spending by category</li>
          <li>Subscriptions & recurring items</li>
          <li>Accounts and savings</li>
        </ul>
      </div>
      <aside className="home-login-wrap">
        <div className="auth-card card home-login-card">
          <LoginForm embedded />
        </div>
      </aside>
    </div>
  )
}
