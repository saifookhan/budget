import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BeeMarkSvg } from '../components/BeeMarkSvg'
import { COMMUNITY_TIP_IDS, FORUM_CATEGORIES, type CommunityTipId, type ForumThreadId } from '../data/communityContent'
import { useTranslation } from '../LanguageContext'

function SharedTipCard({ id }: { id: CommunityTipId }) {
  const { t } = useTranslation()
  return (
    <article className="community-tip-card card">
      <h3 className="community-tip-title">{t(`community.sharedTip${id}Title`)}</h3>
      <p className="community-tip-body">{t(`community.sharedTip${id}Body`)}</p>
    </article>
  )
}

function ForumThreadRow({ id }: { id: ForumThreadId }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <li>
      <button
        type="button"
        className="community-forum-thread"
        onClick={() => navigate(`/community/thread/${id}`)}
      >
        <span className="community-forum-thread-title">{t(`community.forumThread${id}Title`)}</span>
        <span className="community-forum-thread-meta">{t(`community.forumThread${id}Meta`)}</span>
      </button>
    </li>
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

      <p className="community-daily-rhyme">{t('community.dailyRhyme')}</p>

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
        <ul className="community-tip-grid">
          {COMMUNITY_TIP_IDS.map((id) => (
            <li key={id}>
              <SharedTipCard id={id} />
            </li>
          ))}
        </ul>
      </section>

      <section className="community-section" aria-labelledby="community-forum-heading">
        <h2 id="community-forum-heading" className="section-title">
          {t('community.sectionForumTitle')}
        </h2>
        <p className="muted community-section-intro">{t('community.sectionForumIntro')}</p>
        <div className="community-forum-board">
          {FORUM_CATEGORIES.map((cat) => (
            <div key={cat.id} className="community-forum-category card">
              <h3 className="community-forum-category-title">{t(`community.forumCat${cat.id}Title`)}</h3>
              <ul className="community-forum-thread-list">
                {cat.threadIds.map((threadId) => (
                  <ForumThreadRow key={threadId} id={threadId} />
                ))}
              </ul>
            </div>
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
