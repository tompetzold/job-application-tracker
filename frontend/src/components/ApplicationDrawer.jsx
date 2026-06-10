import { useMemo, useState } from "react";
import AutocompleteInput from "./AutocompleteInput";
import { getTimeConstraintConfig } from "../constants/applicationStatus";
import { formatDateTime } from "../utils/applicationDates";

function normalizeText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getLatestUndoableStatusChange(application) {
  const history = Array.isArray(application?.history) ? application.history : [];

  return history.find((entry) => {
    return entry.type === "STATUS_CHANGED" && !entry.undoneAt && entry.previousStatus && entry.newStatus;
  });
}

function toDateTimeLocalInputValue(value, defaultTime = "23:59") {
  if (!value || typeof value !== "string") {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 16);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T${defaultTime}`;
  }

  return value;
}

function getInitialTimeConstraintValue(application, timeConstraint) {
  if (!timeConstraint) {
    return "";
  }

  if (timeConstraint.field === "applicationDeadline") {
    return toDateTimeLocalInputValue(application.applicationDeadline, timeConstraint.defaultTime ?? "23:59");
  }

  return toDateTimeLocalInputValue(application.nextAction, timeConstraint.defaultTime ?? "23:59");
}

function normalizeTimeConstraintValue(value, timeConstraint) {
  if (!timeConstraint || !value) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T${timeConstraint.defaultTime ?? "23:59"}`;
  }

  return value;
}

export default function ApplicationDrawer({
                                            application,
                                            onClose,
                                            onUpdateApplication,
                                            onDeleteApplication,
                                            onUndoLastStatusChange,
                                          }) {
  const timeConstraint = getTimeConstraintConfig(application.status);

  const [company, setCompany] = useState(application.company ?? "");
  const [position, setPosition] = useState(application.position ?? "");
  const [location, setLocation] = useState(application.location ?? "");
  const [salary, setSalary] = useState(application.salary ?? "");
  const [timeConstraintValue, setTimeConstraintValue] = useState(
      getInitialTimeConstraintValue(application, timeConstraint),
  );
  const [notes, setNotes] = useState(application.notes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const [error, setError] = useState("");

  const latestUndoableStatusChange = useMemo(() => {
    return getLatestUndoableStatusChange(application);
  }, [application]);

  const canUndoLastStatusChange = Boolean(latestUndoableStatusChange);
  const shouldHighlightTimeConstraint = Boolean(timeConstraint && !timeConstraintValue);

  function buildTimeConstraintPayload() {
    const normalizedValue = normalizeTimeConstraintValue(timeConstraintValue, timeConstraint);

    if (!timeConstraint) {
      return {
        applicationDeadline: "",
        nextAction: "",
      };
    }

    if (timeConstraint.field === "applicationDeadline") {
      return {
        applicationDeadline: normalizedValue,
        nextAction: "",
      };
    }

    return {
      applicationDeadline: "",
      nextAction: normalizedValue,
    };
  }

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
      location: normalizeText(location),
      salary: normalizeText(salary),
      notes: normalizeText(notes),
      ...buildTimeConstraintPayload(),
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

            {timeConstraint ? (
                <div className="status-recommendation">
                  <strong>{timeConstraint.label}</strong>
                  <span>{timeConstraint.recommendation}</span>
                </div>
            ) : null}

            <div className="form-grid">
              <AutocompleteInput
                  label="Firma"
                  value={company}
                  onChange={setCompany}
                  source="companies"
                  placeholder="z. B. SAP"
                  required
              />

              <AutocompleteInput
                  label="Position"
                  value={position}
                  onChange={setPosition}
                  source="positions"
                  placeholder="z. B. Softwareentwickler"
                  required
              />
            </div>

            <div className="form-grid">
              <AutocompleteInput
                  label="Standort"
                  value={location}
                  onChange={setLocation}
                  source="locations"
                  placeholder="z. B. München"
              />

              <label>
                <span>Gehalt</span>
                <input value={salary} onChange={(event) => setSalary(event.target.value)} type="text" />
              </label>
            </div>

            {timeConstraint ? (
                <label className={shouldHighlightTimeConstraint ? "form-field is-recommended" : "form-field"}>
                  <span>{timeConstraint.label}</span>
                  <input
                      value={timeConstraintValue}
                      onChange={(event) => setTimeConstraintValue(event.target.value)}
                      type={timeConstraint.inputType}
                  />
                  {shouldHighlightTimeConstraint ? (
                      <small className="field-hint">{timeConstraint.recommendation}</small>
                  ) : null}
                </label>
            ) : null}

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