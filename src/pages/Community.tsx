import { useState, useEffect } from 'react'
import { useTranslation } from '../LanguageContext'

const PROFILE_IDS = [1, 2, 3, 4] as const

const AVATAR_GRADIENTS = [
  'linear-gradient(145deg, #c9a96e 0%, #8c1c5b 88%)',
  'linear-gradient(145deg, #e8c4c8 0%, #5a0f2e 88%)',
  'linear-gradient(145deg, #c4b896 0%, #50182f 85%)',
  'linear-gradient(145deg, #dcc598 0%, #751a48 82%)',
]

type ProfileId = (typeof PROFILE_IDS)[number]

function ProfileCard({
  pid,
  variant,
}: {
  pid: ProfileId
  variant: 'front' | 'back'
}) {
  const { t } = useTranslation()
  const g = AVATAR_GRADIENTS[pid - 1] ?? AVATAR_GRADIENTS[0]
  const name = t(`community.p${pid}.name`)
  const initial = name.trim().charAt(0).toUpperCase() || '?'

  return (
    <article
      className={`community-profile-card${variant === 'back' ? ' community-profile-card--back' : ''}`}
      aria-hidden={variant === 'back'}
    >
      <div className="community-profile-avatar" style={{ background: g }}>
        <span>{initial}</span>
      </div>
      <h3 className="community-profile-name">{name}</h3>
      <p className="community-profile-meta">{t(`community.p${pid}.meta`)}</p>
      <p className="community-profile-bio">{t(`community.p${pid}.bio`)}</p>
      <blockquote className="community-profile-ice">
        <span className="community-profile-ice-label">{t('community.iceLabel')}</span>
        {t(`community.p${pid}.ice`)}
      </blockquote>
    </article>
  )
}

export default function Community() {
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 4500)
    return () => window.clearTimeout(id)
  }, [toast])

  const atEnd = index >= PROFILE_IDS.length
  const currentId = !atEnd ? PROFILE_IDS[index] : null
  const nextId = !atEnd && index + 1 < PROFILE_IDS.length ? PROFILE_IDS[index + 1] : null

  const pass = () => setIndex((i) => i + 1)
  const connect = () => {
    setToast(t('community.connectToast'))
    setIndex((i) => i + 1)
  }
  const reset = () => setIndex(0)

  return (
    <div className="page-content community-page">
      <h1 className="page-title">{t('community.title')}</h1>
      <p className="muted page-lead">{t('community.subtitle')}</p>

      <p className="community-demo-banner" role="note">
        {t('community.demoBanner')}
      </p>

      <h2 className="section-title community-discover-heading">{t('community.discoverTitle')}</h2>

      <div className="community-deck-wrap">
        {!atEnd && currentId != null ? (
          <div className="community-deck">
            {nextId != null ? <ProfileCard pid={nextId} variant="back" /> : null}
            <ProfileCard pid={currentId} variant="front" />
          </div>
        ) : (
          <div className="community-deck-empty card">
            <p className="community-deck-empty-text">{t('community.emptyDeck')}</p>
            <button type="button" className="btn btn-primary" onClick={reset}>
              {t('community.again')}
            </button>
          </div>
        )}

        {!atEnd && currentId != null ? (
          <div className="community-deck-actions">
            <button type="button" className="btn btn-ghost community-action-pass" onClick={pass}>
              {t('community.pass')}
            </button>
            <button type="button" className="btn btn-primary community-action-connect" onClick={connect}>
              {t('community.connect')}
            </button>
          </div>
        ) : null}
      </div>

      <div className="card community-tips-card">
        <h2 className="section-title">{t('community.tipsTitle')}</h2>
        <ul className="community-tips-list">
          <li>{t('community.tip1')}</li>
          <li>{t('community.tip2')}</li>
          <li>{t('community.tip3')}</li>
        </ul>
      </div>

      {toast ? (
        <div className="community-toast" role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}
    </div>
  )
}
