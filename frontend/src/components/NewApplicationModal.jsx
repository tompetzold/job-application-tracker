import { useState } from "react";
import AutocompleteInput from "./AutocompleteInput";

const SALARY_MODES = {
  NONE: "NONE",
  EXACT: "EXACT",
  RANGE: "RANGE",
};

const SALARY_CURRENCY = "EUR";
const SALARY_PERIOD = "YEAR";
const DEFAULT_DEADLINE_TIME = "23:59";

function normalizeText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function normalizeNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return number;
}

function formatSalaryNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "";
  }

  return `${number}k`;
}

function formatSalaryPreview({ salaryMode, salaryAmount, salaryMin, salaryMax }) {
  if (salaryMode === SALARY_MODES.EXACT && salaryAmount !== null) {
    return `${formatSalaryNumber(salaryAmount)} €`;
  }

  if (salaryMode === SALARY_MODES.RANGE) {
    if (salaryMin !== null && salaryMax !== null) {
      return `${formatSalaryNumber(salaryMin)}–${formatSalaryNumber(salaryMax)} €`;
    }

    if (salaryMin !== null) {
      return `ab ${formatSalaryNumber(salaryMin)} €`;
    }

    if (salaryMax !== null) {
      return `bis ${formatSalaryNumber(salaryMax)} €`;
    }
  }

  return "";
}

function getTodayWithDefaultDeadlineTime() {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}T${DEFAULT_DEADLINE_TIME}`;
}

function normalizeDeadlineValue(value) {
  if (!value) {
    return "";
  }

  if (!value.includes("T")) {
    return `${value}T${DEFAULT_DEADLINE_TIME}`;
  }

  const [date, time] = value.split("T");

  if (!date) {
    return "";
  }

  if (!time) {
    return `${date}T${DEFAULT_DEADLINE_TIME}`;
  }

  return `${date}T${time.slice(0, 5)}`;
}

function deadlineHasExplicitUserTime(value) {
  if (!value || !value.includes("T")) {
    return false;
  }

  const time = value.split("T")[1]?.slice(0, 5);

  return Boolean(time && time !== DEFAULT_DEADLINE_TIME);
}

export default function NewApplicationModal({ onClose, onCreateApplication, onCreate }) {
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [location, setLocation] = useState("");
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [salaryMode, setSalaryMode] = useState(SALARY_MODES.NONE);
  const [salaryAmount, setSalaryAmount] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedCompany = normalizeText(company);
  const normalizedPosition = normalizeText(position);

  const companyError = submitted && normalizedCompany.length === 0 ? "Firma ist ein Pflichtfeld." : "";
  const positionError = submitted && normalizedPosition.length === 0 ? "Position ist ein Pflichtfeld." : "";

  const salaryPreview = formatSalaryPreview({
    salaryMode,
    salaryAmount: normalizeNumber(salaryAmount),
    salaryMin: normalizeNumber(salaryMin),
    salaryMax: normalizeNumber(salaryMax),
  });

  function resetSalaryFields(nextSalaryMode) {
    setSalaryMode(nextSalaryMode);
    setSalaryAmount("");
    setSalaryMin("");
    setSalaryMax("");
    setSubmitError("");
  }

  function handleDeadlineFocus() {
    if (!applicationDeadline) {
      setApplicationDeadline(getTodayWithDefaultDeadlineTime());
    }
  }

  function handleDeadlineChange(event) {
    setApplicationDeadline(normalizeDeadlineValue(event.target.value));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    setSubmitError("");

    if (!normalizedCompany || !normalizedPosition) {
      return;
    }

    const createHandler = onCreateApplication ?? onCreate;

    if (typeof createHandler !== "function") {
      setSubmitError("Create-Handler fehlt. Übergib im Parent onCreateApplication oder onCreate.");
      return;
    }

    const normalizedDeadline = normalizeDeadlineValue(applicationDeadline);

    const payload = {
      company: normalizedCompany,
      position: normalizedPosition,
      status: "DRAFT",
      phase: "",
      location: normalizeText(location),
      salaryMode,
      salaryAmount: salaryMode === SALARY_MODES.EXACT ? normalizeNumber(salaryAmount) : null,
      salaryMin: salaryMode === SALARY_MODES.RANGE ? normalizeNumber(salaryMin) : null,
      salaryMax: salaryMode === SALARY_MODES.RANGE ? normalizeNumber(salaryMax) : null,
      salaryCurrency: SALARY_CURRENCY,
      salaryPeriod: SALARY_PERIOD,
      salary: salaryPreview,
      applicationDeadline: normalizedDeadline,
      applicationDeadlineHasExplicitTime: deadlineHasExplicitUserTime(normalizedDeadline),
      nextAction: "",
      notes: normalizeText(notes),
    };

    try {
      setIsSubmitting(true);
      await createHandler(payload);
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Bewerbung konnte nicht angelegt werden.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
      <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
        <section
            className="modal-card"
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="modal-header">
            <div>
              <h2>Neue Bewerbung</h2>
              <p>Neue Bewerbungen werden immer als Entwurf angelegt.</p>
            </div>

            <button type="button" className="icon-button" aria-label="Dialog schließen" onClick={onClose}>
              ×
            </button>
          </div>

          <form className="application-form" onSubmit={handleSubmit} noValidate>
            {submitError ? (
                <div className="message error">
                  <strong>Fehler</strong>
                  <span>{submitError}</span>
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
                  error={companyError}
              />

              <AutocompleteInput
                  label="Position"
                  value={position}
                  onChange={setPosition}
                  source="positions"
                  placeholder="z. B. Softwareentwickler"
                  required
                  error={positionError}
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
                <span>Bewerbungsdeadline</span>
                <input
                    value={applicationDeadline}
                    onFocus={handleDeadlineFocus}
                    onChange={handleDeadlineChange}
                    type="datetime-local"
                />
              </label>
            </div>

            {salaryMode === SALARY_MODES.NONE ? (
                <div className="form-grid">
                  <label>
                    <span>Gehaltsangabe</span>
                    <select value={salaryMode} onChange={(event) => resetSalaryFields(event.target.value)}>
                      <option value={SALARY_MODES.NONE}>Keine Angabe</option>
                      <option value={SALARY_MODES.EXACT}>Festbetrag</option>
                      <option value={SALARY_MODES.RANGE}>Spanne</option>
                    </select>
                  </label>
                </div>
            ) : null}

            {salaryMode === SALARY_MODES.EXACT ? (
                <div className="form-grid">
                  <label>
                    <span>Gehaltsangabe</span>
                    <select value={salaryMode} onChange={(event) => resetSalaryFields(event.target.value)}>
                      <option value={SALARY_MODES.NONE}>Keine Angabe</option>
                      <option value={SALARY_MODES.EXACT}>Festbetrag</option>
                      <option value={SALARY_MODES.RANGE}>Spanne</option>
                    </select>
                  </label>

                  <label>
                    <span>Betrag</span>
                    <input
                        value={salaryAmount}
                        onChange={(event) => setSalaryAmount(event.target.value)}
                        type="number"
                        min="0"
                        step="0.1"
                        inputMode="decimal"
                        placeholder="z. B. 85"
                    />
                  </label>
                </div>
            ) : null}

            {salaryMode === SALARY_MODES.RANGE ? (
                <>
                  <div className="form-grid">
                    <label>
                      <span>Gehaltsangabe</span>
                      <select value={salaryMode} onChange={(event) => resetSalaryFields(event.target.value)}>
                        <option value={SALARY_MODES.NONE}>Keine Angabe</option>
                        <option value={SALARY_MODES.EXACT}>Festbetrag</option>
                        <option value={SALARY_MODES.RANGE}>Spanne</option>
                      </select>
                    </label>
                  </div>

                  <div className="form-grid">
                    <label>
                      <span>Minimum</span>
                      <input
                          value={salaryMin}
                          onChange={(event) => setSalaryMin(event.target.value)}
                          type="number"
                          min="0"
                          step="0.1"
                          inputMode="decimal"
                          placeholder="z. B. 70"
                      />
                    </label>

                    <label>
                      <span>Maximum</span>
                      <input
                          value={salaryMax}
                          onChange={(event) => setSalaryMax(event.target.value)}
                          type="number"
                          min="0"
                          step="0.1"
                          inputMode="decimal"
                          placeholder="z. B. 90"
                      />
                    </label>
                  </div>
                </>
            ) : null}

            <label>
              <span>Notizen</span>
              <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="z. B. Empfehlung von Sam, Rückmeldung erwartet..."
              />
            </label>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={onClose} disabled={isSubmitting}>
                Abbrechen
              </button>

              <button type="submit" className="primary-button" disabled={isSubmitting}>
                {isSubmitting ? "Speichern..." : "Hinzufügen"}
              </button>
            </div>
          </form>
        </section>
      </div>
  );
}