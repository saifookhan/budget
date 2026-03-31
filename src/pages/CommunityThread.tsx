import { Link, Navigate, useParams } from 'react-router-dom'
import { forumCategoryIdForThread, parseForumThreadId } from '../data/communityContent'
import { useTranslation } from '../LanguageContext'

const LIVE_REPLY_IDS = [1, 2, 3] as const

export default function CommunityThread() {
  const { threadId: raw } = useParams<{ threadId: string }>()
  const { t } = useTranslation()
  const threadId = parseForumThreadId(raw)

  if (threadId === null) {
    return <Navigate to="/community" replace />
  }

  const catId = forumCategoryIdForThread(threadId)

  return (
    <div className="page-content community-thread-page">
      <Link to="/community" className="community-forum-back">
        {t('community.forumBackToForum')}
      </Link>
      <p className="muted community-thread-category">{t(`community.forumCat${catId}Title`)}</p>
      <h1 className="page-title community-thread-title">{t(`community.forumThread${threadId}Title`)}</h1>
      <p className="muted community-thread-meta">{t(`community.forumThread${threadId}Meta`)}</p>

      <article className="card community-thread-opener">
        <p className="community-thread-opener-label">{t('community.forumOpenerLabel')}</p>
        <p className="community-thread-opener-body">{t(`community.forumThread${threadId}Opener`)}</p>
      </article>

      <h2 className="section-title community-thread-replies-heading">{t('community.forumRepliesHeading')}</h2>
      <ul className="community-thread-reply-list">
        {LIVE_REPLY_IDS.map((id) => (
          <li key={id}>
            <article className="card community-thread-reply">
              <p className="community-thread-reply-body">{t(`community.forumLiveReply${id}`)}</p>
            </article>
          </li>
        ))}
      </ul>

      <p className="muted community-thread-footnote">{t('community.forumLiveFootnote')}</p>
    </div>
  )
}
