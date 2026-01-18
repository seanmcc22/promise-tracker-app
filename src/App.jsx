import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import './App.css'

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('login') // 'login' or 'signup'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!session) {
    return view === 'login' ? (
      <Login setView={setView} />
    ) : (
      <Signup setView={setView} />
    )
  }

  return <Dashboard session={session} />
}

// Login Component
function Login({ setView }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Welcome Back</h1>
        <p className="subtitle">Sign in to your SanityDashboard account</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="switch-view">
          Don't have an account?{' '}
          <button onClick={() => setView('signup')} className="link-button">
            Sign up
          </button>
        </p>
      </div>
    </div>
  )
}

// Signup Component
function Signup({ setView }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h1>Check Your Email</h1>
          <p>We've sent you a confirmation link. Click it to activate your account.</p>
          <button onClick={() => setView('login')} className="secondary-button">
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Create Account</h1>
        <p className="subtitle">Start tracking the quiet parts of your business</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSignup}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="switch-view">
          Already have an account?{' '}
          <button onClick={() => setView('login')} className="link-button">
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}

// Dashboard Component
function Dashboard({ session }) {
  const [activeTab, setActiveTab] = useState('home')

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>SanityDashboard</h2>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            🏠 Home
          </button>
          <button
            className={`nav-item ${activeTab === 'promises' ? 'active' : ''}`}
            onClick={() => setActiveTab('promises')}
          >
            📋 Promises
          </button>
          <button
            className={`nav-item ${activeTab === 'decisions' ? 'active' : ''}`}
            onClick={() => setActiveTab('decisions')}
          >
            🎯 Decisions
          </button>
          <button
            className={`nav-item ${activeTab === 'exceptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('exceptions')}
          >
            ⚡ Exceptions
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <p>{session.user.email}</p>
          </div>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'home' && <HomeTab setActiveTab={setActiveTab} />}
        {activeTab === 'promises' && <PromisesTab session={session} />}
        {activeTab === 'decisions' && <DecisionsTab session={session} />}
        {activeTab === 'exceptions' && <ExceptionsTab session={session} />}
      </main>
    </div>
  )
}

// Home Tab Component
function HomeTab({ setActiveTab }) {
  return (
    <div className="home-tab">
      <div className="home-header">
        <h1>Welcome to SanityDashboard</h1>
        <p className="home-subtitle">Track the quiet parts of your business — all in one place</p>
      </div>

      <div className="dashboard-grid">
        <button className="dashboard-card" onClick={() => setActiveTab('promises')}>
          <div className="card-icon">📋</div>
          <h2>Promises</h2>
          <p>Track commitments to customers, investors, and yourself. Never ghost a promise again.</p>
          <span className="card-action">Open Promises →</span>
        </button>

        <button className="dashboard-card" onClick={() => setActiveTab('decisions')}>
          <div className="card-icon">🎯</div>
          <h2>Decisions</h2>
          <p>Document key decisions and reasoning so you can reference them later. Build your decision log.</p>
          <span className="card-action">Open Decisions →</span>
        </button>

        <button className="dashboard-card" onClick={() => setActiveTab('exceptions')}>
          <div className="card-icon">⚡</div>
          <h2>Exceptions</h2>
          <p>Track special cases like custom pricing, SLA overrides, or one-off agreements.</p>
          <span className="card-action">Open Exceptions →</span>
        </button>
      </div>
    </div>
  )
}

// Promises Tab Component
function PromisesTab({ session }) {
  const [promises, setPromises] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    promised_to: '',
    status: 'Pending',
    reminder_date: '',
  })

  const fetchData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('feature_promises')
      .select('*')
      .eq('user_id', session.user.id)
      .order('date_created', { ascending: false })

    if (!error) setPromises(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [session])

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        title: item.title,
        description: item.description || '',
        promised_to: item.promised_to,
        status: item.status,
        reminder_date: item.reminder_date || '',
      })
    } else {
      setEditingItem(null)
      setFormData({
        title: '',
        description: '',
        promised_to: '',
        status: 'Pending',
        reminder_date: '',
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingItem(null)
  }

  const saveItem = async (e) => {
    e.preventDefault()
    const itemData = {
      ...formData,
      user_id: session.user.id,
      reminder_date: formData.reminder_date || null,
    }

    if (editingItem) {
      await supabase.from('feature_promises').update(itemData).eq('id', editingItem.id)
    } else {
      await supabase.from('feature_promises').insert([itemData])
    }
    fetchData()
    closeModal()
  }

  const deleteItem = async (id) => {
    if (!confirm('Are you sure?')) return
    await supabase.from('feature_promises').delete().eq('id', id)
    fetchData()
  }

  const filteredData = promises.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.promised_to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesFilter = filterStatus === 'All' || item.status === filterStatus
    return matchesSearch && matchesFilter
  })

  return (
    <>
      <div className="content-header">
        <h1>Your Promises</h1>
        <button onClick={() => openModal()} className="primary-button">
          + Add Promise
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search promises..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <div className="status-filters">
          {['All', 'Pending', 'Shipped', 'Canceled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`filter-button ${filterStatus === status ? 'active' : ''}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : filteredData.length === 0 ? (
        <div className="empty-state">
          <p>No promises yet. Click "Add Promise" to get started!</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="promises-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Promised To</th>
                <th>Status</th>
                <th>Date Created</th>
                <th>Reminder</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.title}</strong>
                    {item.description && <div className="description">{item.description}</div>}
                  </td>
                  <td>{item.promised_to}</td>
                  <td>
                    <span className={`status-badge ${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>{new Date(item.date_created).toLocaleDateString()}</td>
                  <td>
                    {item.reminder_date ? new Date(item.reminder_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="actions">
                    <button onClick={() => openModal(item)} className="action-button edit">
                      Edit
                    </button>
                    <button onClick={() => deleteItem(item.id)} className="action-button delete">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Promise' : 'Add New Promise'}</h2>
              <button onClick={closeModal} className="close-button">×</button>
            </div>
            <form onSubmit={saveItem} className="modal-form">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g., Dark mode support"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional details..."
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Promised To *</label>
                <input
                  type="text"
                  value={formData.promised_to}
                  onChange={(e) => setFormData({ ...formData, promised_to: e.target.value })}
                  required
                  placeholder="e.g., Acme Corp, John Smith"
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Pending">Pending</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Canceled">Canceled</option>
                </select>
              </div>
              <div className="form-group">
                <label>Reminder Date (optional)</label>
                <input
                  type="date"
                  value={formData.reminder_date}
                  onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="secondary-button">
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

// Decisions Tab Component
function DecisionsTab({ session }) {
  const [decisions, setDecisions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    choice: '',
    reasoning: '',
    tags: '',
  })

  const fetchData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('decisions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('date_created', { ascending: false })

    if (!error) setDecisions(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [session])

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        title: item.title,
        choice: item.choice,
        reasoning: item.reasoning || '',
        tags: item.tags || '',
      })
    } else {
      setEditingItem(null)
      setFormData({ title: '', choice: '', reasoning: '', tags: '' })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingItem(null)
  }

  const saveItem = async (e) => {
    e.preventDefault()
    const itemData = { ...formData, user_id: session.user.id }

    if (editingItem) {
      await supabase.from('decisions').update(itemData).eq('id', editingItem.id)
    } else {
      await supabase.from('decisions').insert([itemData])
    }
    fetchData()
    closeModal()
  }

  const deleteItem = async (id) => {
    if (!confirm('Are you sure?')) return
    await supabase.from('decisions').delete().eq('id', id)
    fetchData()
  }

  const filteredData = decisions.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.choice.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.tags && item.tags.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <>
      <div className="content-header">
        <h1>Your Decisions</h1>
        <button onClick={() => openModal()} className="primary-button">
          + Add Decision
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search decisions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : filteredData.length === 0 ? (
        <div className="empty-state">
          <p>No decisions yet. Click "Add Decision" to get started!</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="promises-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Choice Made</th>
                <th>Reasoning</th>
                <th>Tags</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.title}</strong></td>
                  <td>{item.choice}</td>
                  <td>{item.reasoning || '—'}</td>
                  <td>{item.tags || '—'}</td>
                  <td>{new Date(item.date_created).toLocaleDateString()}</td>
                  <td className="actions">
                    <button onClick={() => openModal(item)} className="action-button edit">
                      Edit
                    </button>
                    <button onClick={() => deleteItem(item.id)} className="action-button delete">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Decision' : 'Add New Decision'}</h2>
              <button onClick={closeModal} className="close-button">×</button>
            </div>
            <form onSubmit={saveItem} className="modal-form">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g., Which framework to use"
                />
              </div>
              <div className="form-group">
                <label>Choice Made *</label>
                <input
                  type="text"
                  value={formData.choice}
                  onChange={(e) => setFormData({ ...formData, choice: e.target.value })}
                  required
                  placeholder="e.g., React"
                />
              </div>
              <div className="form-group">
                <label>Reasoning</label>
                <textarea
                  value={formData.reasoning}
                  onChange={(e) => setFormData({ ...formData, reasoning: e.target.value })}
                  placeholder="Why did you make this choice?"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g., tech, product"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="secondary-button">
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

// Exceptions Tab Component
function ExceptionsTab({ session }) {
  const [exceptions, setExceptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [formData, setFormData] = useState({
    type: '',
    who: '',
    details: '',
  })

  const fetchData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('exceptions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('date_created', { ascending: false })

    if (!error) setExceptions(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [session])

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        type: item.type,
        who: item.who,
        details: item.details || '',
      })
    } else {
      setEditingItem(null)
      setFormData({ type: '', who: '', details: '' })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingItem(null)
  }

  const saveItem = async (e) => {
    e.preventDefault()
    const itemData = { ...formData, user_id: session.user.id }

    if (editingItem) {
      await supabase.from('exceptions').update(itemData).eq('id', editingItem.id)
    } else {
      await supabase.from('exceptions').insert([itemData])
    }
    fetchData()
    closeModal()
  }

  const deleteItem = async (id) => {
    if (!confirm('Are you sure?')) return
    await supabase.from('exceptions').delete().eq('id', id)
    fetchData()
  }

  const filteredData = exceptions.filter((item) =>
    item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.who.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.details && item.details.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <>
      <div className="content-header">
        <h1>Your Exceptions</h1>
        <button onClick={() => openModal()} className="primary-button">
          + Add Exception
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search exceptions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : filteredData.length === 0 ? (
        <div className="empty-state">
          <p>No exceptions yet. Click "Add Exception" to get started!</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="promises-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Who</th>
                <th>Details</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.type}</strong></td>
                  <td>{item.who}</td>
                  <td>{item.details || '—'}</td>
                  <td>{new Date(item.date_created).toLocaleDateString()}</td>
                  <td className="actions">
                    <button onClick={() => openModal(item)} className="action-button edit">
                      Edit
                    </button>
                    <button onClick={() => deleteItem(item.id)} className="action-button delete">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Exception' : 'Add New Exception'}</h2>
              <button onClick={closeModal} className="close-button">×</button>
            </div>
            <form onSubmit={saveItem} className="modal-form">
              <div className="form-group">
                <label>Type *</label>
                <input
                  type="text"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                  placeholder="e.g., Special pricing, Custom feature, SLA override"
                />
              </div>
              <div className="form-group">
                <label>Who *</label>
                <input
                  type="text"
                  value={formData.who}
                  onChange={(e) => setFormData({ ...formData, who: e.target.value })}
                  required
                  placeholder="e.g., Acme Corp, John Smith"
                />
              </div>
              <div className="form-group">
                <label>Details</label>
                <textarea
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  placeholder="Additional context..."
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="secondary-button">
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default App