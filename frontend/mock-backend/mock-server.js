import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.MOCK_API_PORT ?? 3001);
const DB_PATH = resolve(__dirname, "db.json");

const ALLOWED_TRANSITIONS = {
    DRAFT: ["APPLIED", "CANCELLED"],
    APPLIED: ["INTERVIEW", "OFFER", "REJECTED", "CANCELLED"],
    INTERVIEW: ["OFFER", "REJECTED", "CANCELLED"],
    OFFER: ["ACCEPTED", "CANCELLED"],
    ACCEPTED: [],
    REJECTED: [],
    CANCELLED: [],
};

function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) {
        return "0 B";
    }

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function createRequestContext(request) {
    const startedAt = performance.now();
    const timestamp = new Date().toISOString();
    const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

    return {
        timestamp,
        startedAt,
        method: request.method ?? "UNKNOWN",
        pathname: url.pathname,
        requestBytes: 0,
        responseBytes: 0,
        statusCode: 0,
        body: null,
        bodyLoaded: false,
    };
}

function logRequest(context) {
    if (context.method === "OPTIONS") {
        return;
    }

    const durationMs = Math.round((performance.now() - context.startedAt) * 10) / 10;
    const statusCode = context.statusCode || 0;

    console.log(
        `[${context.timestamp}] ${context.method} ${context.pathname} → ${statusCode} | in ${formatBytes(
            context.requestBytes,
        )} | out ${formatBytes(context.responseBytes)} | ${durationMs} ms`,
    );
}

function sendResponse(context, response, statusCode, body, headers = {}) {
    const responseBody = body ?? "";
    const responseBytes = Buffer.byteLength(responseBody, "utf-8");

    context.statusCode = statusCode;
    context.responseBytes = responseBytes;

    response.writeHead(statusCode, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Length": responseBytes,
        ...headers,
    });

    response.end(responseBody);
}

function createJsonResponse(context, response, statusCode, data) {
    const body = JSON.stringify(data, null, 2);

    sendResponse(context, response, statusCode, body, {
        "Content-Type": "application/json; charset=utf-8",
    });
}

function createEmptyResponse(context, response, statusCode = 204) {
    sendResponse(context, response, statusCode, "");
}

function createErrorResponse(context, response, statusCode, message) {
    createJsonResponse(context, response, statusCode, {
        error: message,
    });
}

async function readRequestBody(request, context) {
    if (context.bodyLoaded) {
        return context.body ?? {};
    }

    const chunks = [];

    for await (const chunk of request) {
        chunks.push(chunk);
    }

    const bodyBuffer = Buffer.concat(chunks);
    const rawBody = bodyBuffer.toString("utf-8").trim();

    context.requestBytes = bodyBuffer.byteLength;
    context.bodyLoaded = true;

    if (!rawBody) {
        context.body = {};
        return {};
    }

    try {
        context.body = JSON.parse(rawBody);
        return context.body;
    } catch {
        throw new Error("Request Body ist kein gültiges JSON.");
    }
}

async function ensureDatabaseFile() {
    await mkdir(dirname(DB_PATH), {
        recursive: true,
    });

    try {
        await readFile(DB_PATH, "utf-8");
    } catch {
        await writeFile(
            DB_PATH,
            JSON.stringify(
                {
                    applications: [],
                },
                null,
                2,
            ),
            "utf-8",
        );
    }
}

async function readDatabase() {
    await ensureDatabaseFile();

    const rawDatabase = await readFile(DB_PATH, "utf-8");

    try {
        const database = JSON.parse(rawDatabase);

        if (!Array.isArray(database.applications)) {
            return {
                applications: [],
            };
        }

        return database;
    } catch {
        return {
            applications: [],
        };
    }
}

async function writeDatabase(database) {
    await writeFile(DB_PATH, `${JSON.stringify(database, null, 2)}\n`, "utf-8");
}

function normalizeText(value) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim();
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
        salary:
            payload.salary ??
            formatSalary({
                salaryMode,
                salaryAmount,
                salaryMin,
                salaryMax,
            }),
    };
}

function canMoveApplication(fromStatus, toStatus) {
    if (fromStatus === toStatus) {
        return true;
    }

    return ALLOWED_TRANSITIONS[fromStatus]?.includes(toStatus) ?? false;
}

function createHistoryEntry({ type, previousStatus, newStatus, text }) {
    return {
        id: randomUUID(),
        type,
        previousStatus,
        newStatus,
        text,
        createdAt: new Date().toISOString(),
        undoneAt: null,
    };
}

function createApplication(payload) {
    const now = new Date().toISOString();
    const salaryPayload = normalizeSalaryPayload(payload);

    return {
        id: randomUUID(),
        company: normalizeText(payload.company),
        position: normalizeText(payload.position),
        status: "DRAFT",
        phase: "",
        location: normalizeText(payload.location),
        salaryMode: salaryPayload.salaryMode,
        salaryAmount: salaryPayload.salaryAmount,
        salaryMin: salaryPayload.salaryMin,
        salaryMax: salaryPayload.salaryMax,
        salaryCurrency: salaryPayload.salaryCurrency,
        salaryPeriod: salaryPayload.salaryPeriod,
        salary: salaryPayload.salary,
        applicationDeadline: payload.applicationDeadline ?? "",
        nextAction: "",
        notes: normalizeText(payload.notes),
        createdAt: now,
        updatedAt: now,
        history: [
            {
                id: randomUUID(),
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

function updateApplicationContent(application, payload) {
    const now = new Date().toISOString();
    const salaryPayload = normalizeSalaryPayload({
        ...application,
        ...payload,
    });

    return {
        ...application,
        company: payload.company !== undefined ? normalizeText(payload.company) : application.company,
        position: payload.position !== undefined ? normalizeText(payload.position) : application.position,
        location: payload.location !== undefined ? normalizeText(payload.location) : application.location,
        salaryMode: salaryPayload.salaryMode,
        salaryAmount: salaryPayload.salaryAmount,
        salaryMin: salaryPayload.salaryMin,
        salaryMax: salaryPayload.salaryMax,
        salaryCurrency: salaryPayload.salaryCurrency,
        salaryPeriod: salaryPayload.salaryPeriod,
        salary: salaryPayload.salary,
        applicationDeadline:
            payload.applicationDeadline !== undefined ? payload.applicationDeadline : application.applicationDeadline,
        nextAction: payload.nextAction !== undefined ? payload.nextAction : application.nextAction,
        notes: payload.notes !== undefined ? normalizeText(payload.notes) : application.notes,
        updatedAt: now,
    };
}

function updateApplicationStatus(application, nextStatus) {
    const now = new Date().toISOString();

    if (application.status === nextStatus) {
        return application;
    }

    if (!canMoveApplication(application.status, nextStatus)) {
        throw new Error(`Statuswechsel von "${application.status}" zu "${nextStatus}" ist nicht erlaubt.`);
    }

    return {
        ...application,
        status: nextStatus,
        updatedAt: now,
        history: [
            createHistoryEntry({
                type: "STATUS_CHANGED",
                previousStatus: application.status,
                newStatus: nextStatus,
                text: `Status geändert von "${application.status}" zu "${nextStatus}"`,
            }),
            ...(application.history ?? []),
        ],
    };
}

function undoLastStatusChange(application) {
    const now = new Date().toISOString();
    const history = Array.isArray(application.history) ? application.history : [];

    const lastStatusChange = history.find((entry) => {
        return entry.type === "STATUS_CHANGED" && !entry.undoneAt && entry.previousStatus && entry.newStatus;
    });

    if (!lastStatusChange) {
        return application;
    }

    if (application.status !== lastStatusChange.newStatus) {
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

    return {
        ...application,
        status: revertedStatus,
        updatedAt: now,
        history: [
            createHistoryEntry({
                type: "STATUS_CHANGE_UNDONE",
                previousStatus: application.status,
                newStatus: revertedStatus,
                text: `Statusänderung rückgängig gemacht von "${application.status}" zu "${revertedStatus}"`,
            }),
            ...historyWithUndoneEntry,
        ],
    };
}

function findApplicationIndex(applications, id) {
    return applications.findIndex((application) => String(application.id) === String(id));
}

async function handleHealthCheck(context, response) {
    createJsonResponse(context, response, 200, {
        status: "ok",
        service: "mock-backend",
        timestamp: new Date().toISOString(),
        databasePath: DB_PATH,
    });
}

async function handleGetApplications(context, response) {
    const database = await readDatabase();

    createJsonResponse(context, response, 200, database.applications);
}

async function handleCreateApplication(request, context, response) {
    const payload = await readRequestBody(request, context);

    if (!normalizeText(payload.company) || !normalizeText(payload.position)) {
        createErrorResponse(context, response, 400, "Firma und Position sind Pflichtfelder.");
        return;
    }

    const database = await readDatabase();
    const application = createApplication(payload);

    database.applications = [application, ...database.applications];

    await writeDatabase(database);

    createJsonResponse(context, response, 201, application);
}

async function handleUpdateApplication(request, context, response, id) {
    const payload = await readRequestBody(request, context);
    const database = await readDatabase();
    const applicationIndex = findApplicationIndex(database.applications, id);

    if (applicationIndex < 0) {
        createErrorResponse(context, response, 404, "Bewerbung wurde nicht gefunden.");
        return;
    }

    const currentApplication = database.applications[applicationIndex];

    if (payload.status && payload.status !== currentApplication.status) {
        createErrorResponse(context, response, 400, "Status darf über diesen Endpunkt nicht geändert werden.");
        return;
    }

    const updatedApplication = updateApplicationContent(currentApplication, payload);

    database.applications[applicationIndex] = updatedApplication;

    await writeDatabase(database);

    createJsonResponse(context, response, 200, updatedApplication);
}

async function handleUpdateApplicationStatus(request, context, response, id) {
    const payload = await readRequestBody(request, context);
    const nextStatus = payload.status;

    if (!nextStatus) {
        createErrorResponse(context, response, 400, "Status fehlt.");
        return;
    }

    const database = await readDatabase();
    const applicationIndex = findApplicationIndex(database.applications, id);

    if (applicationIndex < 0) {
        createErrorResponse(context, response, 404, "Bewerbung wurde nicht gefunden.");
        return;
    }

    try {
        const updatedApplication = updateApplicationStatus(database.applications[applicationIndex], nextStatus);

        database.applications[applicationIndex] = updatedApplication;

        await writeDatabase(database);

        createJsonResponse(context, response, 200, updatedApplication);
    } catch (error) {
        createErrorResponse(
            context,
            response,
            400,
            error instanceof Error ? error.message : "Status konnte nicht geändert werden.",
        );
    }
}

async function handleUndoLastStatusChange(context, response, id) {
    const database = await readDatabase();
    const applicationIndex = findApplicationIndex(database.applications, id);

    if (applicationIndex < 0) {
        createErrorResponse(context, response, 404, "Bewerbung wurde nicht gefunden.");
        return;
    }

    const updatedApplication = undoLastStatusChange(database.applications[applicationIndex]);

    database.applications[applicationIndex] = updatedApplication;

    await writeDatabase(database);

    createJsonResponse(context, response, 200, updatedApplication);
}

async function handleDeleteApplication(context, response, id) {
    const database = await readDatabase();
    const applicationIndex = findApplicationIndex(database.applications, id);

    if (applicationIndex < 0) {
        createErrorResponse(context, response, 404, "Bewerbung wurde nicht gefunden.");
        return;
    }

    database.applications = database.applications.filter((application) => String(application.id) !== String(id));

    await writeDatabase(database);

    createEmptyResponse(context, response, 204);
}

async function handleRequest(request, response) {
    const context = createRequestContext(request);

    try {
        if (request.method === "OPTIONS") {
            createEmptyResponse(context, response, 204);
            return;
        }

        if (request.method === "GET" && context.pathname === "/api/health") {
            await handleHealthCheck(context, response);
            return;
        }

        if (request.method === "GET" && context.pathname === "/api/applications") {
            await handleGetApplications(context, response);
            return;
        }

        if (request.method === "POST" && context.pathname === "/api/applications") {
            await handleCreateApplication(request, context, response);
            return;
        }

        const statusMatch = context.pathname.match(/^\/api\/applications\/([^/]+)\/status$/);

        if (request.method === "PATCH" && statusMatch) {
            await handleUpdateApplicationStatus(request, context, response, statusMatch[1]);
            return;
        }

        const undoMatch = context.pathname.match(/^\/api\/applications\/([^/]+)\/undo-last-status-change$/);

        if (request.method === "POST" && undoMatch) {
            await handleUndoLastStatusChange(context, response, undoMatch[1]);
            return;
        }

        const applicationMatch = context.pathname.match(/^\/api\/applications\/([^/]+)$/);

        if (request.method === "PUT" && applicationMatch) {
            await handleUpdateApplication(request, context, response, applicationMatch[1]);
            return;
        }

        if (request.method === "DELETE" && applicationMatch) {
            await handleDeleteApplication(context, response, applicationMatch[1]);
            return;
        }

        createErrorResponse(context, response, 404, "Route nicht gefunden.");
    } catch (error) {
        createErrorResponse(context, response, 500, error instanceof Error ? error.message : "Mock-Backend Fehler.");
    } finally {
        logRequest(context);
    }
}

await ensureDatabaseFile();

createServer(handleRequest).listen(PORT, () => {
    console.log(`Mock-Backend läuft auf http://localhost:${PORT}`);
    console.log(`JSON-Datenbank: ${DB_PATH}`);
});