import { useMemo, useState } from "react";
import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
} from "../constants/applicationStatus";

function normalizeText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function formatDateTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getLatestUndoableStatusChange(application) {
  const history = Array.isArray(application?.history) ? application.history : [];

  return history.find((entry) => {
    return entry.type === "STATUS_CHANGED" && !entry.undoneAt && entry.previousStatus && entry.newStatus;
  });
}

export default function ApplicationDrawer({
                                            application,
                                            onClose,
                                            onUpdateApplication,
                                            onDeleteApplication,
                                            onUndoLastStatusChange,
                                          }) {
  const [company, setCompany] = useState(application.company ?? "");
  const [position, setPosition] = useState(application.position ?? "");
  const [status, setStatus] = useState(application.status ?? "DRAFT");
  const [phase, setPhase] = useState(application.phase ?? "");
  const [location, setLocation] = useState(application.location ?? "");
  const [salary, setSalary] = useState(application.salary ?? "");
  const [nextAction, setNextAction] = useState(application.nextAction ?? "");
  const [notes, setNotes] = useState(application.notes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const [error, setError] = useState("");

  const latestUndoableStatusChange = useMemo(() => {
    return getLatestUndoableStatusChange(application);
  }, [application]);

  const canUndoLastStatusChange = Boolean(latestUndoableStatusChange);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const normalizedCompany = normalizeText(company);
    const normalizedPosition = normalizeText(position);

    if (!normalizedCompany || !normalizedPosition) {
      setError("Firma und Position sind Pflichtfelder.");
      return;
    }

    const payload = {
      company: normalizedCompany,
      position: normalizedPosition,
      status,
      phase: normalizeText(phase),
      location: normalizeText(location),
      salary: normalizeText(salary),
      nextAction,
      notes: normalizeText(notes),
    };

    try {
      setIsSaving(true);

      if (typeof onUpdateApplication === "function") {
        await onUpdateApplication(application.id, payload);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Bewerbung konnte nicht gespeichert werden.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUndoLastStatusChange() {
    setError("");

    if (!canUndoLastStatusChange) {
      setError("Es gibt keine Statusänderung, die rückgängig gemacht werden kann.");
      return;
    }

    try {
      setIsUndoing(true);

      if (typeof onUndoLastStatusChange !== "function") {
        throw new Error("Undo-Handler fehlt.");
      }

      await onUndoLastStatusChange(application);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Letzte Statusänderung konnte nicht rückgängig gemacht werden.");
    } finally {
      setIsUndoing(false);
    }
  }

  async function handleDeleteApplication() {
    setError("");

    const confirmed = window.confirm("Bewerbung wirklich löschen?");

    if (!confirmed) {
      return;
    }

    try {
      if (typeof onDeleteApplication === "function") {
        await onDeleteApplication(application);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Bewerbung konnte nicht gelöscht werden.");
    }
  }

  return (
      <div className="drawer-backdrop" role="presentation" onMouseDown={onClose}>
        <aside className="drawer" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
          <div className="drawer-header">
            <div>
              <h2>{application.company}</h2>
              <p>{application.position}</p>
            </div>

            <button type="button" className="icon-button" aria-label="Drawer schließen" onClick={onClose}>
              ×
            </button>
          </div>

          <form className="drawer-form" onSubmit={handleSubmit}>
            {error ? (
                <div className="message error">
                  <strong>Fehler</strong>
                  <span>{error}</span>
                </div>
            ) : null}

            <div className="form-grid">
              <label>
                <span>Firma</span>
                <input value={company} onChange={(event) => setCompany(event.target.value)} type="text" />
              </label>

              <label>
                <span>Position</span>
                <input value={position} onChange={(event) => setPosition(event.target.value)} type="text" />
              </label>
            </div>

            <div className="form-grid">
              <label>
                <span>Status</span>
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                  {APPLICATION_STATUSES.map((applicationStatus) => (
                      <option key={applicationStatus} value={applicationStatus}>
                        {STATUS_LABELS[applicationStatus] ?? applicationStatus}
                      </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Phase</span>
                <input value={phase} onChange={(event) => setPhase(event.target.value)} type="text" />
              </label>
            </div>

            <div className="form-grid">
              <label>
                <span>Standort</span>
                <input value={location} onChange={(event) => setLocation(event.target.value)} type="text" />
              </label>

              <label>
                <span>Gehalt</span>
                <input value={salary} onChange={(event) => setSalary(event.target.value)} type="text" />
              </label>
            </div>

            <label>
              <span>Nächste Aktion</span>
              <input value={nextAction} onChange={(event) => setNextAction(event.target.value)} type="datetime-local" />
            </label>

            <label>
              <span>Notizen</span>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
            </label>

            <button type="submit" className="primary-button" disabled={isSaving || isUndoing}>
              {isSaving ? "Speichern..." : "Speichern"}
            </button>
          </form>

          <section className="history-section">
            <div className="history-header">
              <div>
                <h3>Verlauf</h3>
                <span>{Array.isArray(application.history) ? application.history.length : 0} Einträge</span>
              </div>

              <button
                  type="button"
                  className="history-undo-button"
                  onClick={handleUndoLastStatusChange}
                  disabled={!canUndoLastStatusChange || isUndoing || isSaving}
              >
                {isUndoing ? "Wird rückgängig gemacht..." : "Letzte Aktion rückgängig machen"}
              </button>
            </div>

            {Array.isArray(application.history) && application.history.length > 0 ? (
                <div className="history-list">
                  {application.history.map((entry) => (
                      <div key={entry.id} className={entry.undoneAt ? "history-entry is-undone" : "history-entry"}>
                        <span></span>
                        <div>
                          <strong>{entry.text}</strong>
                          <small>{formatDateTime(entry.createdAt)}</small>
                          {entry.undoneAt ? <small>Rückgängig gemacht: {formatDateTime(entry.undoneAt)}</small> : null}
                        </div>
                      </div>
                  ))}
                </div>
            ) : (
                <p className="empty-history">Noch keine Verlaufseinträge.</p>
            )}
          </section>

          <footer className="drawer-footer">
            <span>Erstellt {formatDateTime(application.createdAt)}</span>

            <button type="button" className="danger-button" onClick={handleDeleteApplication}>
              Löschen
            </button>
          </footer>
        </aside>
      </div>
  );
}