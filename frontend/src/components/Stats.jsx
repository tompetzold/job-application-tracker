function isThisWeek(dateValue) {
    if (!dateValue) {
        return false;
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return false;
    }

    const now = new Date();
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diffToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    return date >= weekStart && date < weekEnd;
}

function countStatusChanges(applications, targetStatus) {
    return applications.reduce((sum, application) => {
        const matchingEntries = (application.history ?? []).filter((entry) => {
            return entry.type === "STATUS_CHANGED" && entry.newStatus === targetStatus && !entry.undoneAt;
        });

        return sum + matchingEntries.length;
    }, 0);
}

export default function Stats({ applications }) {
    const activeApplications = applications.filter((application) =>
        ["DRAFT", "APPLIED", "INTERVIEW", "OFFER"].includes(application.status),
    );

    const interviews = applications.filter((application) => application.status === "INTERVIEW");
    const offers = applications.filter((application) => application.status === "OFFER");
    const accepted = applications.filter((application) => application.status === "ACCEPTED");

    const decided = applications.filter((application) =>
        ["ACCEPTED", "REJECTED", "CANCELLED"].includes(application.status),
    );

    const createdThisWeek = applications.filter((application) => {
        return isThisWeek(application.createdAt);
    });

    const interviewsStarted = countStatusChanges(applications, "INTERVIEW");
    const offersReceived = countStatusChanges(applications, "OFFER");

    const successRate =
        decided.length === 0 ? 0 : Math.round((accepted.length / decided.length) * 100);

    return (
        <section className="stats-grid">
            <article className="stat-card">
                <span>Aktive Bewerbungen</span>
                <strong>{activeApplications.length}</strong>
                <small>+{createdThisWeek.length} diese Woche</small>
            </article>

            <article className="stat-card">
                <span>Interviews</span>
                <strong>{interviews.length}</strong>
                <small>{interviewsStarted} historisch</small>
            </article>

            <article className="stat-card">
                <span>Angebote</span>
                <strong>{offers.length}</strong>
                <small>{offersReceived} erhalten</small>
            </article>

            <article className="stat-card">
                <span>Erfolgsquote</span>
                <strong>{successRate}%</strong>
                <small>{decided.length} entschieden</small>
            </article>
        </section>
    );
}