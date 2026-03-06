import { useState, useEffect } from 'react'
import { getState, updateState, id } from '../store'
import { useTranslation } from '../LanguageContext'
import type { Category } from '../types'

export default function Categories() {
  const { t } = useTranslation()
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    setCategories(getState().categories)
  }, [])

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const next = updateState((s) => ({
      ...s,
      categories: [...s.categories, { id: id(), name: name.trim() }],
    }))
    setCategories(next.categories)
    setName('')
  }

  const remove = (categoryId: string) => {
    if (!confirm(t('categories.removeConfirm'))) return
    const next = updateState((s) => ({
      ...s,
      categories: s.categories.filter((c) => c.id !== categoryId),
    }))
    setCategories(next.categories)
    setEditing(null)
  }

  const startEdit = (c: Category) => {
    setEditing(c.id)
    setEditName(c.name)
  }

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing || !editName.trim()) return
    const next = updateState((s) => ({
      ...s,
      categories: s.categories.map((c) =>
        c.id === editing ? { ...c, name: editName.trim() } : c
      ),
    }))
    setCategories(next.categories)
    setEditing(null)
  }

  return (
    <>
      <h1 style={{ marginTop: 0, marginBottom: '0.5rem' }}>{t('categories.title')}</h1>
      <p className="muted" style={{ marginBottom: '1.5rem' }}>
        {t('categories.subtitle')}
      </p>

      <form onSubmit={add} className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>{t('categories.addCategory')}</h2>
        <div className="form-group">
          <label htmlFor="cat-name">{t('categories.name')}</label>
          <input
            id="cat-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('categories.namePlaceholder')}
          />
        </div>
        <button type="submit" className="btn btn-primary">
          {t('categories.addButton')}
        </button>
      </form>

      {categories.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>{t('categories.yourCategories')}</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {categories.map((c) => (
              <li
                key={c.id}
                style={{
                  padding: '0.75rem 0',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                {editing === c.id ? (
                  <form onSubmit={saveEdit} style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Category name"
                      style={{ flex: 1, padding: '0.4rem' }}
                    />
                    <button type="submit" className="btn btn-primary">{t('common.save')}</button>
                    <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>{t('common.cancel')}</button>
                  </form>
                ) : (
                  <>
                    <span>{c.name}</span>
                    <span style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="button" className="btn btn-ghost" onClick={() => startEdit(c)}>{t('common.edit')}</button>
                      <button type="button" className="btn btn-ghost" onClick={() => remove(c.id)}>{t('common.remove')}</button>
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
