import { useState, useRef, useEffect } from 'react'
import { useTranslation } from './LanguageContext'
import { t } from './i18n'
import type { LanguageCode } from './types'

type Message = { role: 'user' | 'bot'; text: string }

function formatBotText(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}

function getBotReply(userText: string, lang: LanguageCode): string {
  const q = userText.toLowerCase().trim()
  const T = (key: string) => t(key, lang)
  if (q.length === 0) return T('contact.botEmpty')
  if (/\b(hi|hello|hey)\b/.test(q)) return T('contact.botGreeting')
  if (/\b(income|entrate|einnahmen|revenus|ingresos)\b/.test(q) || /\bhow.*set.*income\b/.test(q))
    return T('contact.botIncome')
  if (/\b(expense|spese|ausgabe|dépense|gasto)\b/.test(q) || /\badd.*spend\b/.test(q))
    return T('contact.botExpenses')
  if (/\b(subscription|abbonamento|abo|abonnement|suscripción)\b/.test(q))
    return T('contact.botSubscriptions')
  if (/\b(overview|panoramica|übersicht|aperçu|resumen)\b/.test(q) || /\bgraph|chart\b/.test(q))
    return T('contact.botOverview')
  if (/\b(delete|remove|elimina|entfernen|supprimir|borrar)\b/.test(q) || /\bnot.*show\b/.test(q))
    return T('contact.botDelete')
  if (/\b(language|lingua|sprache|langue|idioma)\b/.test(q) || /\btranslate\b/.test(q))
    return T('contact.botLanguage')
  if (/\b(theme|tema|design|thème)\b/.test(q) || /\bblack.*version\b/.test(q))
    return T('contact.botTheme')
  if (/\b(wallet|portafoglio|geldbörse|portefeuille|monedero)\b/.test(q) || /\baccount\b/.test(q))
    return T('contact.botWallet')
  if (/\b(saving|risparmi|sparen|épargne|ahorro)\b/.test(q))
    return T('contact.botSavings')
  if (/\b(reset|password|password dimenticata|passwort)\b/.test(q))
    return T('contact.botPassword')
  if (/\b(supabase|login|sign in)\b/.test(q))
    return T('contact.botLogin')
  return T('contact.botFallback')
}

type ContactChatProps = {
  /** When provided, open state is controlled by parent (no FAB rendered). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function ContactChat({ open: controlledOpen, onOpenChange }: ContactChatProps = {}) {
  const { t: T, language } = useTranslation()
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = onOpenChange != null
  const open = isControlled ? (controlledOpen ?? false) : internalOpen
  const setOpen = isControlled ? onOpenChange! : setInternalOpen
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'bot', text: T('contact.botWelcome') }])
    }
  }, [open, messages.length, T])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text }])
    const reply = getBotReply(text, language)
    setTimeout(() => {
      setMessages((m) => [...m, { role: 'bot', text: reply }])
    }, 400)
  }

  return (
    <>
      {!isControlled && (
        <button
          type="button"
          className="contact-fab"
          onClick={() => setOpen(!open)}
          aria-label={T('contact.open')}
          aria-expanded={open}
          title={T('contact.open')}
        >
          <span aria-hidden>{open ? '✕' : '💬'}</span>
        </button>
      )}

      {open && (
        <div className={`contact-panel ${isControlled ? 'contact-panel-from-header' : ''}`} role="dialog" aria-label={T('contact.title')}>
          <div className="contact-panel-header">
            <h2 className="section-title section-title--flush">{T('contact.title')}</h2>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setOpen(false)}
              aria-label={T('contact.close')}
            >
              ✕
            </button>
          </div>
          <div className="contact-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`contact-msg contact-msg-${msg.role}`}>
                {msg.role === 'user' ? msg.text : <span dangerouslySetInnerHTML={{ __html: formatBotText(msg.text) }} />}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={send} className="contact-form">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={T('contact.placeholder')}
              className="contact-input"
              aria-label={T('contact.placeholder')}
            />
            <button type="submit" className="btn btn-primary contact-send">
              {T('contact.send')}
            </button>
          </form>
        </div>
      )}
    </>
  )
}
