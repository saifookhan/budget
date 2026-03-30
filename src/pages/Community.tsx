import { useState, useEffect } from 'react'
import { BeeMarkSvg } from '../components/BeeMarkSvg'
import { HIVE_TIP_IDS, STORY_IDS, type HiveTipId, type StoryId } from '../data/communityContent'
import { useTranslation } from '../LanguageContext'

function HiveTipCard({ id }: { id: HiveTipId }) {
  const { t } = useTranslation()
  return (
    <article className="community-hive-tip-card card">
      <h3 className="community-hive-tip-title">{t(`community.hiveTip${id}Title`)}</h3>
      <p className="community-hive-tip-body">{t(`community.hiveTip${id}Body`)}</p>
    </article>
  )
}

function StoryCard({ id }: { id: StoryId }) {
  const { t } = useTranslation()
  return (
    <article className="community-story-card card">
      <span className="community-story-tag">{t(`community.story${id}Tag`)}</span>
      <p className="community-story-byline">{t(`community.story${id}Byline`)}</p>
      <p className="community-story-body">{t(`community.story${id}Body`)}</p>
    </article>
  )
}

export default function Community() {
  const { t } = useTranslation()
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 4500)
    return () => window.clearTimeout(id)
  }, [toast])

  const messagesNotify = () => setToast(t('community.messagesToast'))

  return (
    <div className="page-content community-page">
      <h1 className="page-title community-page-title">
        <span className="community-page-title-mark" aria-hidden>
          <BeeMarkSvg scale={1} svgClassName="community-page-title-bee-svg" />
        </span>
        {t('community.title')}
      </h1>
      <p className="muted page-lead">{t('community.subtitle')}</p>

      <p className="community-demo-banner" role="note">
        {t('community.demoBanner')}
      </p>

      <section className="community-section" aria-labelledby="community-starters-heading">
        <h2 id="community-starters-heading" className="section-title">
          {t('community.sectionStartersTitle')}
        </h2>
        <p className="muted community-section-intro">{t('community.sectionStartersIntro')}</p>
        <div className="card community-tips-card community-starters-card">
          <ul className="community-tips-list">
            <li>{t('community.tip1')}</li>
            <li>{t('community.tip2')}</li>
            <li>{t('community.tip3')}</li>
          </ul>
        </div>
      </section>

      <section className="community-section" aria-labelledby="community-ideas-heading">
        <h2 id="community-ideas-heading" className="section-title">
          {t('community.sectionIdeasTitle')}
        </h2>
        <p className="muted community-section-intro">{t('community.sectionIdeasIntro')}</p>
        <ul className="community-hive-tip-grid">
          {HIVE_TIP_IDS.map((id) => (
            <li key={id}>
              <HiveTipCard id={id} />
            </li>
          ))}
        </ul>
      </section>

      <section className="community-section" aria-labelledby="community-voices-heading">
        <h2 id="community-voices-heading" className="section-title">
          {t('community.sectionVoicesTitle')}
        </h2>
        <p className="muted community-section-intro">{t('community.sectionVoicesIntro')}</p>
        <div className="community-story-stack">
          {STORY_IDS.map((id) => (
            <StoryCard key={id} id={id} />
          ))}
        </div>
      </section>

      <section className="community-section" aria-labelledby="community-next-heading">
        <h2 id="community-next-heading" className="section-title">
          {t('community.sectionNextTitle')}
        </h2>
        <div className="card community-messages-card community-next-card">
          <p className="community-messages-intro">{t('community.sectionNextIntro')}</p>
          <button type="button" className="btn btn-primary community-messages-cta" onClick={messagesNotify}>
            {t('community.messagesCta')}
          </button>
          <p className="muted community-help-hint">{t('community.helpHint')}</p>
        </div>
      </section>

      {toast ? (
        <div className="community-toast" role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}
    </div>
  )
}
