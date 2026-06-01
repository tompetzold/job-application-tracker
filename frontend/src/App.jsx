import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

function App() {
  const [applications, setApplications] = useState([])
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [backendAvailable, setBackendAvailable] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const applicationCountLabel = useMemo(() => {
    if (applications.length === 1) {
      return '1 Bewerbung'
    }

    return `${applications.length} Bewerbungen`
  }, [applications.length])

  async function loadApplications() {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/applications`)

      if (!response.ok) {
        throw new Error(`Backend antwortet mit HTTP ${response.status}`)
      }

      const data = await response.json()

      if (!Array.isArray(data)) {
        throw new Error('Backend hat kein gültiges Listenformat geliefert.')
      }

      setApplications(data)
      setBackendAvailable(true)
      setLastUpdated(new Date())
    } catch (error) {
      setBackendAvailable(false)
      setApplications([])
      setError(
          error instanceof TypeError
              ? 'Backend nicht erreichbar oder CORS blockiert den Request.'
              : error.message
      )
    } finally {
      setLoading(false)
    }
  }

  async function createApplication(event) {
    event.preventDefault()

    const normalizedCompany = company.trim()
    const normalizedPosition = position.trim()

    if (!normalizedCompany || !normalizedPosition) {
      setError('Firma und Position müssen ausgefüllt sein.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company: normalizedCompany,
          position: normalizedPosition,
        }),
      })

      const responseBody = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(responseBody?.error ?? `Backend antwortet mit HTTP ${response.status}`)
      }

      setCompany('')
      setPosition('')
      setBackendAvailable(true)
      await loadApplications()
    } catch (error) {
      setBackendAvailable(false)
      setError(error.message || 'Bewerbung konnte nicht gespeichert werden.')
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteApplication(id) {
    if (!id) {
      setError('Bewerbungs-ID fehlt.')
      return
    }

    const confirmed = window.confirm(`Bewerbung mit ID ${id} wirklich löschen?`)

    if (!confirmed) {
      return
    }

    setDeletingId(id)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/applications/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const responseBody = await response.json().catch(() => null)
        throw new Error(responseBody?.error ?? `Backend antwortet mit HTTP ${response.status}`)
      }

      setApplications((currentApplications) =>
          currentApplications.filter((application) => application.id !== id)
      )
      setBackendAvailable(true)
      setLastUpdated(new Date())
    } catch (error) {
      setBackendAvailable(false)
      setError(
          error instanceof TypeError
              ? 'Löschen fehlgeschlagen. Backend nicht erreichbar oder CORS blockiert den Request.'
              : error.message
      )
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    loadApplications()
  }, [])

  return (
      <main className="app-shell">
        <section className="hero-card">
          <div className="hero-content">
            <div className="badge">Schichtenarchitektur Demo</div>
            <h1>Bewerbungstracker</h1>
            <p>
              Separates React-Frontend gegen ein Spring-Boot-Backend mit PostgreSQL.
              Die UI kommuniziert ausschließlich über REST.
            </p>
          </div>

          <div className="system-panel">
            <div className={backendAvailable ? 'connection online' : 'connection offline'}>
              <span></span>
              {backendAvailable ? 'Backend verbunden' : 'Backend nicht verbunden'}
            </div>

            <div className="system-row">
              <span>Frontend</span>
              <strong>localhost:5173</strong>
            </div>

            <div className="system-row">
              <span>Backend</span>
              <strong>{API_BASE_URL.replace('http://', '')}</strong>
            </div>

            <button type="button" onClick={loadApplications} disabled={loading || submitting}>
              {loading ? 'Aktualisiere...' : 'Verbindung prüfen'}
            </button>
          </div>
        </section>

        <section className="layout">
          <article className="card form-card">
            <div className="card-title">
              <div>
                <h2>Neue Bewerbung</h2>
                <p>Lege einen neuen Bewerbungseintrag an.</p>
              </div>
            </div>

            {error && (
                <div className="message error">
                  <strong>Fehler</strong>
                  <span>{error}</span>
                </div>
            )}

            {!backendAvailable && !loading && (
                <div className="message warning">
                  <strong>Backend prüfen</strong>
                  <span>Erwartete API: {API_BASE_URL}/api/applications</span>
                </div>
            )}

            <form onSubmit={createApplication} className="application-form">
              <label>
                <span>Firma</span>
                <input
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    type="text"
                    placeholder="z. B. RWU"
                    disabled={submitting}
                />
              </label>

              <label>
                <span>Position</span>
                <input
                    value={position}
                    onChange={(event) => setPosition(event.target.value)}
                    type="text"
                    placeholder="z. B. Tutor"
                    disabled={submitting}
                />
              </label>

              <button type="submit" disabled={submitting}>
                {submitting ? 'Speichere...' : 'Bewerbung anlegen'}
              </button>
            </form>
          </article>

          <article className="card list-card">
            <div className="card-title list-title">
              <div>
                <h2>Bewerbungen</h2>
                <p>
                  {applicationCountLabel}
                  {lastUpdated ? ` · aktualisiert um ${lastUpdated.toLocaleTimeString('de-DE')}` : ''}
                </p>
              </div>

              <button
                  type="button"
                  className="button-secondary"
                  onClick={loadApplications}
                  disabled={loading || submitting}
              >
                {loading ? 'Lädt...' : 'Neu laden'}
              </button>
            </div>

            {loading && <div className="empty-state">Daten werden geladen...</div>}

            {!loading && backendAvailable && applications.length === 0 && (
                <div className="empty-state">
                  <strong>Keine Bewerbungen vorhanden</strong>
                  <span>Lege links den ersten Eintrag an.</span>
                </div>
            )}

            {!loading && !backendAvailable && (
                <div className="empty-state">
                  <strong>Keine Daten geladen</strong>
                  <span>Das Backend ist aktuell nicht erreichbar.</span>
                </div>
            )}

            {!loading && applications.length > 0 && (
                <div className="table-container">
                  <table>
                    <thead>
                    <tr>
                      <th>ID</th>
                      <th>Firma</th>
                      <th>Position</th>
                      <th>Aktion</th>
                    </tr>
                    </thead>
                    <tbody>
                    {applications.map((application) => (
                        <tr key={application.id}>
                          <td>
                            <span className="id-pill">#{application.id}</span>
                          </td>
                          <td>{application.company}</td>
                          <td>{application.position}</td>
                          <td>
                            <button
                                type="button"
                                className="delete-button"
                                onClick={() => deleteApplication(application.id)}
                                disabled={deletingId === application.id || submitting}
                            >
                              {deletingId === application.id ? 'Löscht...' : `ID ${application.id} löschen`}
                            </button>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
            )}
          </article>
        </section>
      </main>
  )
}

export default App