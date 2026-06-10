const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

async function request(path, options = {}) {
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

export async function pingBackend() {
  const data = await request("/api/health");

  return {
    data,
    source: "mock-backend",
  };
}

export async function fetchApplications() {
  const data = await request("/api/applications");

  if (!Array.isArray(data)) {
    throw new Error("Backend hat kein gültiges Listenformat geliefert.");
  }

  return {
    data,
    source: "mock-backend",
  };
}

export async function createApplication(payload) {
  const data = await request("/api/applications", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      status: "DRAFT",
      phase: "",
      nextAction: "",
    }),
  });

  return {
    data,
    source: "mock-backend",
  };
}

export async function updateApplicationStatus(id, status) {
  const data = await request(`/api/applications/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

  return {
    data,
    source: "mock-backend",
  };
}

export async function undoLastStatusChange(id) {
  const data = await request(`/api/applications/${id}/undo-last-status-change`, {
    method: "POST",
  });

  return {
    data,
    source: "mock-backend",
  };
}

export async function updateApplication(id, payload) {
  const data = await request(`/api/applications/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return {
    data,
    source: "mock-backend",
  };
}

export async function deleteApplication(id) {
  await request(`/api/applications/${id}`, {
    method: "DELETE",
  });

  return {
    source: "mock-backend",
  };
}