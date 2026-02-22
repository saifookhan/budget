import { useState, useEffect } from 'react'
import { getState, updateState, id } from '../store'
import type { Category } from '../types'

export default function Categories() {
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
    if (!confirm('Remove this category? Transactions will show as "Uncategorized".')) return
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
      <h1 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Categories</h1>
      <p className="muted" style={{ marginBottom: '1.5rem' }}>
        Create categories for your spending (groceries, rent, fun, subscriptions, etc.). You can assign each expense to a category.
      </p>

      <form onSubmit={add} className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Add category</h2>
        <div className="form-group">
          <label htmlFor="cat-name">Name</label>
          <input
            id="cat-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Groceries, Rent, Subscriptions"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Add category
        </button>
      </form>

      {categories.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Your categories</h2>
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
                    <button type="submit" className="btn btn-primary">Save</button>
                    <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
                  </form>
                ) : (
                  <>
                    <span>{c.name}</span>
                    <span>
                      <button type="button" className="btn btn-ghost" onClick={() => startEdit(c)}>Edit</button>
                      <button type="button" className="btn btn-ghost" onClick={() => remove(c.id)}>Remove</button>
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
