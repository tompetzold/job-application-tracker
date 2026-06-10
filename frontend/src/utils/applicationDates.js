export function parseDateValue(value) {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}

export function formatDate(value) {
    const date = parseDateValue(value);

    if (!date) {
        return "";
    }

    return date.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

export function formatDateTime(value) {
    const date = parseDateValue(value);

    if (!date) {
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

export function getRelevantDateValue(application) {
    if (!application) {
        return "";
    }

    if (application.status === "DRAFT") {
        return application.applicationDeadline ?? "";
    }

    if (application.status === "APPLIED") {
        return application.nextAction || application.applicationDeadline || "";
    }

    if (application.status === "INTERVIEW" || application.status === "OFFER") {
        return application.nextAction ?? "";
    }

    return "";
}

export function getRelevantDateLabel(application) {
    if (!application) {
        return "";
    }

    if (application.status === "DRAFT") {
        return "Deadline";
    }

    if (application.status === "APPLIED") {
        return application.nextAction ? "Follow-up" : "Deadline";
    }

    if (application.status === "INTERVIEW") {
        return "Interview";
    }

    if (application.status === "OFFER") {
        return "Entscheidung";
    }

    return "Termin";
}

export function getDaysUntil(value) {
    const date = parseDateValue(value);

    if (!date) {
        return null;
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffMs = startOfTarget.getTime() - startOfToday.getTime();

    return Math.round(diffMs / 86_400_000);
}

export function formatRelativeDate(value, label) {
    const days = getDaysUntil(value);

    if (days === null) {
        return "";
    }

    if (days < 0) {
        return `${label} überfällig seit ${Math.abs(days)} ${Math.abs(days) === 1 ? "Tag" : "Tagen"}`;
    }

    if (days === 0) {
        return `${label} heute`;
    }

    if (days === 1) {
        return `${label} morgen`;
    }

    return `${label} in ${days} Tagen`;
}

export function getRelevantDateMeta(application) {
    const value = getRelevantDateValue(application);

    if (!value) {
        return "";
    }

    return formatRelativeDate(value, getRelevantDateLabel(application));
}

export function getRelevantSortDate(application) {
    const value = getRelevantDateValue(application);
    const date = parseDateValue(value);

    if (!date) {
        return Number.POSITIVE_INFINITY;
    }

    return date.getTime();
}