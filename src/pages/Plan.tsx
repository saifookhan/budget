import { useSearchParams } from 'react-router-dom'
import { useTranslation } from '../LanguageContext'
import SubscriptionsPanel from '../components/SubscriptionsPanel'
import SavingsPanel from '../components/SavingsPanel'

type PlanTab = 'recurring' | 'savings'

export default function Plan() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: PlanTab = searchParams.get('tab') === 'savings' ? 'savings' : 'recurring'

  const setTab = (next: PlanTab) => {
    if (next === 'savings') setSearchParams({ tab: 'savings' }, { replace: true })
    else setSearchParams({}, { replace: true })
  }

  return (
    <div className="page-content plan-page">
      <h1 className="page-title">{t('plan.title')}</h1>
      <p className="muted page-lead">{t('plan.subtitle')}</p>

      <div className="plan-tabs" role="tablist" aria-label={t('plan.tabsAria')}>
        <button
          type="button"
          role="tab"
          id="plan-tab-recurring"
          aria-selected={tab === 'recurring'}
          aria-controls="plan-panel-recurring"
          tabIndex={tab === 'recurring' ? 0 : -1}
          className={`plan-tab${tab === 'recurring' ? ' plan-tab--active' : ''}`}
          onClick={() => setTab('recurring')}
        >
          {t('plan.tabRecurring')}
        </button>
        <button
          type="button"
          role="tab"
          id="plan-tab-savings"
          aria-selected={tab === 'savings'}
          aria-controls="plan-panel-savings"
          tabIndex={tab === 'savings' ? 0 : -1}
          className={`plan-tab${tab === 'savings' ? ' plan-tab--active' : ''}`}
          onClick={() => setTab('savings')}
        >
          {t('plan.tabSavings')}
        </button>
      </div>

      <div
        id="plan-panel-recurring"
        role="tabpanel"
        aria-labelledby="plan-tab-recurring"
        hidden={tab !== 'recurring'}
        className="plan-tab-panel"
      >
        <SubscriptionsPanel />
      </div>

      <div
        id="plan-panel-savings"
        role="tabpanel"
        aria-labelledby="plan-tab-savings"
        hidden={tab !== 'savings'}
        className="plan-tab-panel"
      >
        <SavingsPanel />
      </div>
    </div>
  )
}
