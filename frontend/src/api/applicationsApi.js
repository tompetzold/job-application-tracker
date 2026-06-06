import emptyApplications from "../data/emptyApplications.json";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const USE_MOCK_API = true;

let mockApplications = Array.isArray(emptyApplications) ? [...emptyApplications] : [];

function createHistoryEntry(type, previousStatus, newStatus, text) {
  return {
    id: crypto.randomUUID(),
    type,
    previousStatus,
    newStatus,
    text,
    createdAt: new Date().toISOString(),
    undoneAt: null,
  };
}

function normalizeSalaryPayload(payload) {
  const salaryMode = payload.salaryMode ?? payload.salaryType ?? "NONE";
  const salaryCurrency = payload.salaryCurrency ?? "EUR";
  const salaryPeriod = payload.salaryPeriod ?? "YEAR";
  const salaryAmount = payload.salaryAmount ?? payload.salaryExact ?? null;
  const salaryMin = payload.salaryMin ?? null;
  const salaryMax = payload.salaryMax ?? null;

  return {
    salaryMode,
    salaryAmount,
    salaryMin,
    salaryMax,
    salaryCurrency,
    salaryPeriod,
    salary: payload.salary ?? formatSalary({
      salaryMode,
      salaryAmount,
      salaryMin,
      salaryMax,
    }),
  };
}

function formatSalaryAmount(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "";
  }

  return `${numericValue}k`;
}

function formatSalary({ salaryMode, salaryAmount, salaryMin, salaryMax }) {
  if (salaryMode === "EXACT") {
    const amount = formatSalaryAmount(salaryAmount);

    if (!amount) {
      return "";
    }

    return `${amount} €`;
  }

  if (salaryMode === "RANGE") {
    const min = formatSalaryAmount(salaryMin);
    const max = formatSalaryAmount(salaryMax);

    if (min && max) {
      return `${min}–${max} €`;
    }

    if (min) {
      return `ab ${min} €`;
    }

    if (max) {
      return `bis ${max} €`;
    }
  }

  return "";
}

function createMockApplication(payload) {
  const now = new Date().toISOString();
  const salaryPayload = normalizeSalaryPayload(payload);

  return {
    id: crypto.randomUUID(),
    company: payload.company,
    position: payload.position,
    status: "DRAFT",
    phase: "",
    location: payload.location ?? "",
    salaryMode: salaryPayload.salaryMode,
    salaryAmount: salaryPayload.salaryAmount,
    salaryMin: salaryPayload.salaryMin,
    salaryMax: salaryPayload.salaryMax,
    salaryCurrency: salaryPayload.salaryCurrency,
    salaryPeriod: salaryPayload.salaryPeriod,
    salary: salaryPayload.salary,
    applicationDeadline: payload.applicationDeadline ?? "",
    nextAction: "",
    notes: payload.notes ?? "",
    createdAt: now,
    updatedAt: now,
    history: [
      {
        id: crypto.randomUUID(),
        type: "APPLICATION_CREATED",
        previousStatus: null,
        newStatus: "DRAFT",
        text: "Bewerbung erstellt als Entwurf",
        createdAt: now,
        undoneAt: null,
      },
    ],
  };
}

async function request(path, options = {}) {
  if (USE_MOCK_API) {
    throw new Error("Mock API active");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Backend antwortet mit HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function fetchApplications() {
  try {
    const data = await request("/api/applications");

    if (!Array.isArray(data)) {
      throw new Error("Backend hat kein gültiges Listenformat geliefert.");
    }

    return {
      data,
      source: "backend",
    };
  } catch {
    return {
      data: [...mockApplications],
      source: "mock",
    };
  }
}

export async function createApplication(payload) {
  try {
    const backendPayload = {
      ...payload,
      status: "DRAFT",
      phase: "",
      nextAction: "",
    };

    const data = await request("/api/applications", {
      method: "POST",
      body: JSON.stringify(backendPayload),
    });

    return {
      data,
      source: "backend",
    };
  } catch {
    const createdApplication = createMockApplication(payload);
    mockApplications = [createdApplication, ...mockApplications];

    return {
      data: createdApplication,
      source: "mock",
    };
  }
}

export async function updateApplicationStatus(id, status) {
  try {
    const data = await request(`/api/applications/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });

    return {
      data,
      source: "backend",
    };
  } catch {
    const now = new Date().toISOString();
    let updatedApplication = null;

    mockApplications = mockApplications.map((application) => {
      if (String(application.id) !== String(id)) {
        return application;
      }

      if (application.status === status) {
        updatedApplication = application;
        return application;
      }

      updatedApplication = {
        ...application,
        status,
        updatedAt: now,
        history: [
          {
            id: crypto.randomUUID(),
            type: "STATUS_CHANGED",
            previousStatus: application.status,
            newStatus: status,
            text: `Status geändert von "${application.status}" zu "${status}"`,
            createdAt: now,
            undoneAt: null,
          },
          ...(application.history ?? []),
        ],
      };

      return updatedApplication;
    });

    return {
      data: updatedApplication,
      source: "mock",
    };
  }
}

export async function undoLastStatusChange(id) {
  try {
    const data = await request(`/api/applications/${id}/undo-last-status-change`, {
      method: "POST",
    });

    return {
      data,
      source: "backend",
    };
  } catch {
    const now = new Date().toISOString();
    let updatedApplication = null;

    mockApplications = mockApplications.map((application) => {
      if (String(application.id) !== String(id)) {
        return application;
      }

      const history = Array.isArray(application.history) ? application.history : [];

      const lastStatusChange = history.find((entry) => {
        return entry.type === "STATUS_CHANGED" && !entry.undoneAt && entry.previousStatus && entry.newStatus;
      });

      if (!lastStatusChange) {
        updatedApplication = application;
        return application;
      }

      if (application.status !== lastStatusChange.newStatus) {
        updatedApplication = application;
        return application;
      }

      const revertedStatus = lastStatusChange.previousStatus;

      const historyWithUndoneEntry = history.map((entry) => {
        if (entry.id !== lastStatusChange.id) {
          return entry;
        }

        return {
          ...entry,
          undoneAt: now,
        };
      });

      updatedApplication = {
        ...application,
        status: revertedStatus,
        updatedAt: now,
        history: [
          {
            id: crypto.randomUUID(),
            type: "STATUS_CHANGE_UNDONE",
            previousStatus: application.status,
            newStatus: revertedStatus,
            text: `Statusänderung rückgängig gemacht von "${application.status}" zu "${revertedStatus}"`,
            createdAt: now,
            undoneAt: null,
          },
          ...historyWithUndoneEntry,
        ],
      };

      return updatedApplication;
    });

    return {
      data: updatedApplication,
      source: "mock",
    };
  }
}

export async function updateApplication(id, payload) {
  try {
    const data = await request(`/api/applications/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    return {
      data,
      source: "backend",
    };
  } catch {
    const now = new Date().toISOString();
    let updatedApplication = null;

    mockApplications = mockApplications.map((application) => {
      if (String(application.id) !== String(id)) {
        return application;
      }

      const salaryPayload = normalizeSalaryPayload({
        ...application,
        ...payload,
      });

      const statusChanged = payload.status && payload.status !== application.status;

      updatedApplication = {
        ...application,
        ...payload,
        salaryMode: salaryPayload.salaryMode,
        salaryAmount: salaryPayload.salaryAmount,
        salaryMin: salaryPayload.salaryMin,
        salaryMax: salaryPayload.salaryMax,
        salaryCurrency: salaryPayload.salaryCurrency,
        salaryPeriod: salaryPayload.salaryPeriod,
        salary: salaryPayload.salary,
        updatedAt: now,
        history: statusChanged
            ? [
              {
                id: crypto.randomUUID(),
                type: "STATUS_CHANGED",
                previousStatus: application.status,
                newStatus: payload.status,
                text: `Status geändert von "${application.status}" zu "${payload.status}"`,
                createdAt: now,
                undoneAt: null,
              },
              ...(application.history ?? []),
            ]
            : application.history ?? [],
      };

      return updatedApplication;
    });

    return {
      data: updatedApplication,
      source: "mock",
    };
  }
}

export async function deleteApplication(id) {
  try {
    await request(`/api/applications/${id}`, {
      method: "DELETE",
    });

    return {
      source: "backend",
    };
  } catch {
    mockApplications = mockApplications.filter((application) => {
      return String(application.id) !== String(id);
    });

    return {
      source: "mock",
    };
  }
}