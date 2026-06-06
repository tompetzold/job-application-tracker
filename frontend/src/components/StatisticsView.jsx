import { STATUS_LABELS } from "../constants/applicationStatus";

function countByStatus(applications, status) {
    return applications.filter((application) => application.status === status).length;
}

function getAllHistoryEntries(applications) {
    return applications.flatMap((application) =>
        (application.history ?? []).map((entry) => ({
            ...entry,
            applicationId: application.id,
            company: application.company,
            position: application.position,
        })),
    );
}

function countHistoryTarget(applications, status) {
    return getAllHistoryEntries(applications).filter((entry) => {
        return entry.type === "STATUS_CHANGED" && entry.newStatus === status && !entry.undoneAt;
    }).length;
}

function getAverageStatusChanges(applications) {
    if (applications.length === 0) {
        return 0;
    }

    const totalStatusChanges = applications.reduce((sum, application) => {
        const statusChanges = (application.history ?? []).filter((entry) => {
            return entry.type === "STATUS_CHANGED" && !entry.undoneAt;
        });

        return sum + statusChanges.length;
    }, 0);

    return Math.round((totalStatusChanges / applications.length) * 10) / 10;
}

function getLatestActivities(applications) {
    return getAllHistoryEntries(applications)
        .filter((entry) => entry.createdAt)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 8);
}

function formatDateTime(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getHistoryText(entry) {
    if (entry.type === "STATUS_CHANGED") {
        const previousStatus = STATUS_LABELS[entry.previousStatus] ?? entry.previousStatus;
        const newStatus = STATUS_LABELS[entry.newStatus] ?? entry.newStatus;

        return `Status geändert von "${previousStatus}" zu "${newStatus}"`;
    }

    if (entry.type === "STATUS_CHANGE_UNDONE") {
        const previousStatus = STATUS_LABELS[entry.previousStatus] ?? entry.previousStatus;
        const newStatus = STATUS_LABELS[entry.newStatus] ?? entry.newStatus;

        return `Statusänderung rückgängig gemacht von "${previousStatus}" zu "${newStatus}"`;
    }

    if (entry.type === "APPLICATION_CREATED") {
        const newStatus = STATUS_LABELS[entry.newStatus] ?? entry.newStatus;
        return `Bewerbung erstellt als "${newStatus}"`;
    }

    if (entry.type === "APPLICATION_UPDATED") {
        return "Bewerbungsdaten aktualisiert";
    }

    return entry.text ?? "Aktivität";
}

export default function StatisticsView({ applications }) {
    const totalApplications = applications.length;
    const draftCount = countByStatus(applications, "DRAFT");
    const appliedCount = countByStatus(applications, "APPLIED");
    const interviewCount = countByStatus(applications, "INTERVIEW");
    const offerCount = countByStatus(applications, "OFFER");
    const acceptedCount = countByStatus(applications, "ACCEPTED");
    const rejectedCount = countByStatus(applications, "REJECTED");
    const cancelledCount = countByStatus(applications, "CANCELLED");

    const decidedCount = acceptedCount + rejectedCount + cancelledCount;
    const successRate = decidedCount === 0 ? 0 : Math.round((acceptedCount / decidedCount) * 100);

    const interviewHistoryCount = countHistoryTarget(applications, "INTERVIEW");
    const offerHistoryCount = countHistoryTarget(applications, "OFFER");
    const averageStatusChanges = getAverageStatusChanges(applications);
    const latestActivities = getLatestActivities(applications);

    return (
        <section className="statistics-view">
            <div className="statistics-header">
                <h1>Statistiken</h1>
                <p>Auswertung auf Basis aller Bewerbungen und Verlaufseinträge.</p>
            </div>

            <section className="statistics-grid">
                <article className="analytics-card">
                    <span>Bewerbungen gesamt</span>
                    <strong>{totalApplications}</strong>
                    <small>{draftCount} Entwürfe</small>
                </article>

                <article className="analytics-card">
                    <span>Interviews historisch</span>
                    <strong>{interviewHistoryCount}</strong>
                    <small>{interviewCount} aktuell im Interview</small>
                </article>

                <article className="analytics-card">
                    <span>Angebote historisch</span>
                    <strong>{offerHistoryCount}</strong>
                    <small>{offerCount} aktuell offen</small>
                </article>

                <article className="analytics-card">
                    <span>Erfolgsquote</span>
                    <strong>{successRate}%</strong>
                    <small>{decidedCount} entschieden</small>
                </article>
            </section>

            <section className="statistics-layout">
                <article className="statistics-panel">
                    <div className="statistics-panel-header">
                        <h2>Statusverteilung</h2>
                        <p>Aktueller Zustand aller Bewerbungen.</p>
                    </div>

                    <div className="status-distribution">
                        <div>
                            <span>Entwurf</span>
                            <strong>{draftCount}</strong>
                        </div>
                        <div>
                            <span>Beworben</span>
                            <strong>{appliedCount}</strong>
                        </div>
                        <div>
                            <span>Interview</span>
                            <strong>{interviewCount}</strong>
                        </div>
                        <div>
                            <span>Angebot</span>
                            <strong>{offerCount}</strong>
                        </div>
                        <div>
                            <span>Angenommen</span>
                            <strong>{acceptedCount}</strong>
                        </div>
                        <div>
                            <span>Abgelehnt</span>
                            <strong>{rejectedCount}</strong>
                        </div>
                        <div>
                            <span>Abgesagt</span>
                            <strong>{cancelledCount}</strong>
                        </div>
                    </div>
                </article>

                <article className="statistics-panel">
                    <div className="statistics-panel-header">
                        <h2>Verlaufsauswertung</h2>
                        <p>Berechnet aus der Historie.</p>
                    </div>

                    <div className="metrics-list">
                        <div>
                            <span>Ø Statuswechsel pro Bewerbung</span>
                            <strong>{averageStatusChanges}</strong>
                        </div>

                        <div>
                            <span>Interview-Übergänge</span>
                            <strong>{interviewHistoryCount}</strong>
                        </div>

                        <div>
                            <span>Angebots-Übergänge</span>
                            <strong>{offerHistoryCount}</strong>
                        </div>

                        <div>
                            <span>Entscheidungen</span>
                            <strong>{decidedCount}</strong>
                        </div>
                    </div>
                </article>
            </section>

            <section className="statistics-panel latest-activity-panel">
                <div className="statistics-panel-header">
                    <h2>Letzte Aktivitäten</h2>
                    <p>Neueste Einträge aus dem Verlauf.</p>
                </div>

                {latestActivities.length === 0 ? (
                    <div className="statistics-empty-state">Noch keine Aktivitäten vorhanden.</div>
                ) : (
                    <div className="activity-list">
                        {latestActivities.map((entry) => (
                            <div key={entry.id} className="activity-item">
                                <div>
                                    <strong>{entry.company}</strong>
                                    <span>{getHistoryText(entry)}</span>
                                </div>
                                <small>{formatDateTime(entry.createdAt)}</small>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </section>
    );
}