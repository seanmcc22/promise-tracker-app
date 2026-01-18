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
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
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
        <p className="subtitle">Start tracking your promises today</p>

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
  const [promises, setPromises] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPromise, setEditingPromise] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    promised_to: '',
    status: 'Pending',
    reminder_date: '',
  })

  // Fetch promises
  const fetchPromises = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('feature_promises')
      .select('*')
      .eq('user_id', session.user.id)
      .order('date_created', { ascending: false })

    if (error) {
      console.error('Error fetching promises:', error)
    } else {
      setPromises(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPromises()
  }, [session])

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  // Open modal for adding/editing
  const openModal = (promise = null) => {
    if (promise) {
      setEditingPromise(promise)
      setFormData({
        title: promise.title,
        description: promise.description || '',
        promised_to: promise.promised_to,
        status: promise.status,
        reminder_date: promise.reminder_date || '',
      })
    } else {
      setEditingPromise(null)
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

  // Close modal
  const closeModal = () => {
    setShowModal(false)
    setEditingPromise(null)
    setFormData({
      title: '',
      description: '',
      promised_to: '',
      status: 'Pending',
      reminder_date: '',
    })
  }

  // Save promise (create or update)
  const savePromise = async (e) => {
    e.preventDefault()

    const promiseData = {
      ...formData,
      user_id: session.user.id,
      reminder_date: formData.reminder_date || null,
    }

    if (editingPromise) {
      // Update existing
      const { error } = await supabase
        .from('feature_promises')
        .update(promiseData)
        .eq('id', editingPromise.id)

      if (error) {
        console.error('Error updating promise:', error)
        alert('Error updating promise')
      } else {
        fetchPromises()
        closeModal()
      }
    } else {
      // Create new
      const { error } = await supabase
        .from('feature_promises')
        .insert([promiseData])

      if (error) {
        console.error('Error creating promise:', error)
        alert('Error creating promise')
      } else {
        fetchPromises()
        closeModal()
      }
    }
  }

  // Delete promise
  const deletePromise = async (id) => {
    if (!confirm('Are you sure you want to delete this promise?')) return

    const { error } = await supabase
      .from('feature_promises')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting promise:', error)
      alert('Error deleting promise')
    } else {
      fetchPromises()
    }
  }

  // Filter promises
  const filteredPromises = promises.filter((promise) => {
    const matchesSearch =
      promise.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      promise.promised_to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (promise.description && promise.description.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesFilter = filterStatus === 'All' || promise.status === filterStatus

    return matchesSearch && matchesFilter
  })

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>SanityDashboard</h2>
        </div>
        <nav className="sidebar-nav">
          <button className="nav-item active">
            📋 Promises
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
        <div className="content-header">
          <h1>Your Promises</h1>
          <button onClick={() => openModal()} className="primary-button">
            + Add Promise
          </button>
        </div>

        {/* Filters */}
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

        {/* Promises Table */}
        {loading ? (
          <div className="loading">Loading promises...</div>
        ) : filteredPromises.length === 0 ? (
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
                {filteredPromises.map((promise) => (
                  <tr key={promise.id}>
                    <td>
                      <strong>{promise.title}</strong>
                      {promise.description && (
                        <div className="description">{promise.description}</div>
                      )}
                    </td>
                    <td>{promise.promised_to}</td>
                    <td>
                      <span className={`status-badge ${promise.status.toLowerCase()}`}>
                        {promise.status}
                      </span>
                    </td>
                    <td>{new Date(promise.date_created).toLocaleDateString()}</td>
                    <td>
                      {promise.reminder_date
                        ? new Date(promise.reminder_date).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="actions">
                      <button
                        onClick={() => openModal(promise)}
                        className="action-button edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deletePromise(promise.id)}
                        className="action-button delete"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingPromise ? 'Edit Promise' : 'Add New Promise'}</h2>
              <button onClick={closeModal} className="close-button">
                ×
              </button>
            </div>
            <form onSubmit={savePromise} className="modal-form">
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
                  placeholder="e.g., Acme Corp, John Smith, Self"
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
                  {editingPromise ? 'Update Promise' : 'Create Promise'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App


