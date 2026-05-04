import { useState, useMemo } from 'react'
import { Package, Plus, Pencil, Trash2, Search, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Header from '../../components/layout/Header'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import ProductForm from './ProductForm'
import CategoryForm from './CategoryForm'
import { formatCurrency } from '../../utils/helpers'

export default function CatalogPage() {
  const { products, productCategories } = useApp()
  const [tab, setTab] = useState('products')
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [productForm, setProductForm] = useState({ open: false, editing: null })
  const [categoryForm, setCategoryForm] = useState({ open: false, editing: null })
  const [deleting, setDeleting] = useState(null)       // { type: 'product'|'category', item }

  // ── Filtered data ─────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() =>
    products.items
      .filter(p => {
        const q = search.toLowerCase()
        const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.barcode || '').includes(q)
        const matchCat    = !catFilter || p.categoryId === catFilter
        return matchSearch && matchCat
      })
      .sort((a, b) => a.name.localeCompare(b.name)),
    [products.items, search, catFilter]
  )

  const filteredCategories = useMemo(() =>
    productCategories.items
      .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [productCategories.items, search]
  )

  const getCategoryName = (id) => productCategories.items.find(c => c.id === id)?.name || '—'

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSaveProduct = (data) => {
    if (productForm.editing) products.update(productForm.editing.id, data)
    else products.add(data)
    setProductForm({ open: false, editing: null })
  }

  const handleSaveCategory = (data) => {
    if (categoryForm.editing) productCategories.update(categoryForm.editing.id, data)
    else productCategories.add(data)
    setCategoryForm({ open: false, editing: null })
  }

  const handleDelete = () => {
    if (!deleting) return
    if (deleting.type === 'product') products.remove(deleting.item.id)
    else productCategories.remove(deleting.item.id)
    setDeleting(null)
  }

  const inStock   = products.items.filter(p => p.inStock).length
  const noStock   = products.items.filter(p => !p.inStock).length
  const lowStock  = products.items.filter(p => p.stock != null && p.stock > 0 && p.stock <= 5).length

  return (
    <>
      <Header
        title="Catálogo"
        subtitle={`${products.items.length} productos · ${productCategories.items.length} categorías`}
      />

      <div className="page">

        {/* Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-card__icon" style={{ color: 'var(--vet-emerald)' }}>
              <CheckCircle size={32} strokeWidth={1.75} />
            </div>
            <div className="stat-card__label">En stock</div>
            <div className="stat-card__value" style={{ color: 'var(--vet-emerald)' }}>{inStock}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon" style={{ color: 'var(--vet-rose)' }}>
              <XCircle size={32} strokeWidth={1.75} />
            </div>
            <div className="stat-card__label">Sin stock</div>
            <div className="stat-card__value" style={{ color: 'var(--vet-rose)' }}>{noStock}</div>
          </div>
          {lowStock > 0 && (
            <div className="stat-card">
              <div className="stat-card__icon" style={{ color: 'var(--warn)' }}>
                <AlertTriangle size={32} strokeWidth={1.75} />
              </div>
              <div className="stat-card__label">Stock bajo (≤ 5)</div>
              <div className="stat-card__value" style={{ color: 'var(--warn)' }}>{lowStock}</div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <div className="tabs" style={{ width: 'fit-content' }}>
            <button className={`tab${tab === 'products' ? ' active' : ''}`} onClick={() => setTab('products')}>
              Productos
            </button>
            <button className={`tab${tab === 'categories' ? ' active' : ''}`} onClick={() => setTab('categories')}>
              Categorías
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
            <Search size={18} className="search-icon" />
            <input
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder={tab === 'products' ? 'Buscar por nombre o código de barras...' : 'Buscar categoría...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && search.trim() && tab === 'products') {
                  const match = products.items.find(p => p.barcode === search.trim())
                  if (match) setSearch(match.name)
                }
              }}
            />
          </div>
          {tab === 'products' && (
            <select
              className="form-input"
              style={{ width: 'auto', minWidth: 160 }}
              value={catFilter}
              onChange={e => setCatFilter(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {productCategories.items.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
          {tab === 'products'
            ? <button className="btn btn--primary" style={{ marginLeft: 'auto' }} onClick={() => setProductForm({ open: true, editing: null })}>
                <Plus size={18} /> Nuevo producto
              </button>
            : <button className="btn btn--primary" style={{ marginLeft: 'auto' }} onClick={() => setCategoryForm({ open: true, editing: null })}>
                <Plus size={18} /> Nueva categoría
              </button>
          }
        </div>

        {/* ── PRODUCTS TABLE ── */}
        {tab === 'products' && (
          <div className="card card--no-hover">
            {filteredProducts.length === 0 ? (
              <EmptyState
                icon={<Package size={40} strokeWidth={1.5} />}
                title="Sin productos"
                text={search || catFilter ? 'No hay productos que coincidan con la búsqueda' : 'Agregá el primer producto al catálogo'}
                action={!search && !catFilter
                  ? <button className="btn btn--primary" onClick={() => setProductForm({ open: true, editing: null })}>
                      <Plus size={18} /> Nuevo producto
                    </button>
                  : null
                }
              />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 56 }}></th>
                      <th>Producto</th>
                      <th>Categoría</th>
                      <th>Código</th>
                      <th style={{ textAlign: 'right' }}>Precio</th>
                      <th>Stock</th>
                      <th style={{ width: 80 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(p => (
                      <tr key={p.id}>
                        <td>
                          {p.photoUrl
                            ? <img src={p.photoUrl} alt={p.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', display: 'block' }} />
                            : <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}><Package size={18} strokeWidth={1.5} /></div>
                          }
                        </td>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td>
                          {p.categoryId
                            ? <Badge color="blue">{getCategoryName(p.categoryId)}</Badge>
                            : <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                          }
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                          {p.barcode || '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--vet-teal)' }}>
                          {formatCurrency(p.price)}
                        </td>
                        <td>
                          {p.stock != null
                            ? p.stock === 0
                              ? <Badge color="red" dot>Sin stock (0)</Badge>
                              : p.stock <= 5
                                ? <Badge color="orange" dot>{p.stock} und.</Badge>
                                : <Badge color="green" dot>{p.stock} und.</Badge>
                            : p.inStock
                              ? <Badge color="green" dot>Disponible</Badge>
                              : <Badge color="red" dot>Sin stock</Badge>
                          }
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn--subtle btn--icon"
                              onClick={() => setProductForm({ open: true, editing: p })}
                              title="Editar"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              className="btn btn--subtle btn--icon"
                              onClick={() => setDeleting({ type: 'product', item: p })}
                              title="Eliminar"
                              style={{ color: 'var(--vet-rose)' }}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── CATEGORIES TABLE ── */}
        {tab === 'categories' && (
          <div className="card card--no-hover">
            {filteredCategories.length === 0 ? (
              <EmptyState
                icon={<Tag size={40} strokeWidth={1.5} />}
                title="Sin categorías"
                text={search ? 'No hay categorías que coincidan' : 'Creá la primera categoría de productos'}
                action={!search
                  ? <button className="btn btn--primary" onClick={() => setCategoryForm({ open: true, editing: null })}>
                      <Plus size={18} /> Nueva categoría
                    </button>
                  : null
                }
              />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Categoría</th>
                      <th>Productos</th>
                      <th style={{ width: 80 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map(c => {
                      const count = products.items.filter(p => p.categoryId === c.id).length
                      return (
                        <tr
                          key={c.id}
                          style={{ cursor: count > 0 ? 'pointer' : undefined }}
                          onClick={() => {
                            if (count === 0) return
                            setSearch('')
                            setCatFilter(c.id)
                            setTab('products')
                          }}
                        >
                          <td style={{ fontWeight: 600 }}>{c.name}</td>
                          <td>
                            <Badge color={count > 0 ? 'blue' : 'gray'}>{count} producto{count !== 1 ? 's' : ''}</Badge>
                          </td>
                          <td onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                              <button
                                className="btn btn--subtle btn--icon"
                                onClick={() => setCategoryForm({ open: true, editing: c })}
                                title="Editar"
                              >
                                <Pencil size={18} />
                              </button>
                              <button
                                className="btn btn--subtle btn--icon"
                                onClick={() => setDeleting({ type: 'category', item: c })}
                                title="Eliminar"
                                style={{ color: 'var(--vet-rose)' }}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Modals */}
      <ProductForm
        isOpen={productForm.open}
        onClose={() => setProductForm({ open: false, editing: null })}
        onSave={handleSaveProduct}
        initial={productForm.editing}
      />
      <CategoryForm
        isOpen={categoryForm.open}
        onClose={() => setCategoryForm({ open: false, editing: null })}
        onSave={handleSaveCategory}
        initial={categoryForm.editing}
      />

      {/* Delete confirm */}
      {deleting && (
        <Modal
          isOpen
          onClose={() => setDeleting(null)}
          title={`Eliminar ${deleting.type === 'product' ? 'producto' : 'categoría'}`}
          size="sm"
          footer={
            <>
              <button className="btn btn--ghost" onClick={() => setDeleting(null)}>Cancelar</button>
              <button className="btn btn--danger" onClick={handleDelete}>Eliminar</button>
            </>
          }
        >
          <p style={{ fontSize: 15 }}>
            ¿Eliminar <strong>{deleting.item.name}</strong>?
            {deleting.type === 'category' && (
              <span style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
                Los productos de esta categoría quedarán sin categoría.
              </span>
            )}
          </p>
        </Modal>
      )}
    </>
  )
}
