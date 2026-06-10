import { useEffect, useMemo, useState } from "react";
import "./App.css";
import Board from "./components/Board";
import Header from "./components/Header";
import NewApplicationModal from "./components/NewApplicationModal";
import ApplicationDrawer from "./components/ApplicationDrawer";
import QuickMoveMenu from "./components/QuickMoveMenu";
import Stats from "./components/Stats";
import StatisticsView from "./components/StatisticsView";
import FinalApplications from "./components/FinalApplications";
import {
  pingBackend,
  fetchApplications,
  createApplication,
  updateApplication,
  updateApplicationStatus,
  undoLastStatusChange,
  deleteApplication,
} from "./api/applicationsApi";
import {
  BOARD_STATUSES,
  FINAL_STATUSES,
  canMoveApplication,
  getAllowedTargetStatuses,
} from "./constants/applicationStatus";

function normalizeSearchValue(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
}

function filterApplications(applications, searchTerm) {
  const normalizedSearchTerm = normalizeSearchValue(searchTerm);

  if (!normalizedSearchTerm) {
    return applications;
  }

  return applications.filter((application) => {
    const company = normalizeSearchValue(application.company);
    const position = normalizeSearchValue(application.position);
    const location = normalizeSearchValue(application.location);
    const salary = normalizeSearchValue(application.salary);
    const notes = normalizeSearchValue(application.notes);

    return (
        company.includes(normalizedSearchTerm) ||
        position.includes(normalizedSearchTerm) ||
        location.includes(normalizedSearchTerm) ||
        salary.includes(normalizedSearchTerm) ||
        notes.includes(normalizedSearchTerm)
    );
  });
}

function replaceApplication(applications, updatedApplication) {
  if (!updatedApplication) {
    return applications;
  }

  return applications.map((application) => {
    if (String(application.id) !== String(updatedApplication.id)) {
      return application;
    }

    return updatedApplication;
  });
}

function getApiErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Mocked Backend ist nicht erreichbar.";
}

export default function App() {
  const [applications, setApplications] = useState([]);
  const [dataSource, setDataSource] = useState("loading");
  const [apiError, setApiError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState("overview");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [quickMoveApplication, setQuickMoveApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  const filteredApplications = useMemo(() => {
    return filterApplications(applications, searchTerm);
  }, [applications, searchTerm]);

  const boardApplications = useMemo(() => {
    return filteredApplications.filter((application) => {
      return BOARD_STATUSES.includes(application.status);
    });
  }, [filteredApplications]);

  const finalApplications = useMemo(() => {
    return filteredApplications.filter((application) => {
      return FINAL_STATUSES.includes(application.status);
    });
  }, [filteredApplications]);

  async function loadApplications() {
    try {
      setLoading(true);
      setApiError("");
      setDataSource("loading");

      await pingBackend();

      const result = await fetchApplications();

      setApplications(result.data);
      setDataSource(result.source);
    } catch (error) {
      setApplications([]);
      setDataSource("mock-backend-offline");
      setApiError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateApplication(payload) {
    const result = await createApplication(payload);

    setApplications((currentApplications) => {
      return [result.data, ...currentApplications];
    });

    setDataSource(result.source);
    setApiError("");
  }

  async function handleUpdateApplication(id, payload) {
    const result = await updateApplication(id, payload);

    setApplications((currentApplications) => {
      return replaceApplication(currentApplications, result.data);
    });

    setSelectedApplication(result.data);
    setDataSource(result.source);
    setApiError("");
  }

  async function handleMoveApplication(application, targetStatus) {
    if (!application || !targetStatus) {
      return;
    }

    if (!canMoveApplication(application.status, targetStatus)) {
      return;
    }

    const result = await updateApplicationStatus(application.id, targetStatus);

    setApplications((currentApplications) => {
      return replaceApplication(currentApplications, result.data);
    });

    setSelectedApplication((currentSelectedApplication) => {
      if (!currentSelectedApplication) {
        return currentSelectedApplication;
      }

      if (String(currentSelectedApplication.id) !== String(application.id)) {
        return currentSelectedApplication;
      }

      return result.data;
    });

    setDataSource(result.source);
    setApiError("");
  }

  async function handleUndoLastStatusChange(application) {
    if (!application) {
      return;
    }

    const result = await undoLastStatusChange(application.id);

    setApplications((currentApplications) => {
      return replaceApplication(currentApplications, result.data);
    });

    setSelectedApplication(result.data);
    setDataSource(result.source);
    setApiError("");
  }

  async function handleDeleteApplication(application) {
    if (!application) {
      return;
    }

    const result = await deleteApplication(application.id);

    setApplications((currentApplications) => {
      return currentApplications.filter((currentApplication) => {
        return String(currentApplication.id) !== String(application.id);
      });
    });

    setSelectedApplication(null);
    setQuickMoveApplication(null);
    setDataSource(result.source);
    setApiError("");
  }

  function handleOpenApplication(application) {
    setSelectedApplication(application);
  }

  function handleCloseDrawer() {
    setSelectedApplication(null);
  }

  function handleOpenQuickMove(application) {
    setQuickMoveApplication(application);
  }

  function handleCloseQuickMove() {
    setQuickMoveApplication(null);
  }

  async function handleQuickMove(targetStatus) {
    if (!quickMoveApplication) {
      return;
    }

    await handleMoveApplication(quickMoveApplication, targetStatus);
    setQuickMoveApplication(null);
  }

  function handleOpenCreateModal() {
    setCreateModalOpen(true);
  }

  function handleCloseCreateModal() {
    setCreateModalOpen(false);
  }

  useEffect(() => {
    loadApplications();
  }, []);

  const allowedQuickMoveStatuses = quickMoveApplication
      ? getAllowedTargetStatuses(quickMoveApplication.status)
      : [];

  return (
      <main className="app-shell">
        <Header
            activeView={activeView}
            onChangeView={setActiveView}
            dataSource={dataSource}
            apiError={apiError}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onCreateApplication={handleOpenCreateModal}
        />

        {activeView === "overview" ? (
            <>
              <section className="hero">
                <h1>Pipeline</h1>
                <p>
                  {filteredApplications.length === 1
                      ? "1 Bewerbung erfasst"
                      : `${filteredApplications.length} Bewerbungen erfasst`}
                </p>
              </section>

              <Stats applications={applications} />

              <Board
                  applications={boardApplications}
                  onOpenApplication={handleOpenApplication}
                  onQuickMove={handleOpenQuickMove}
                  onMoveApplication={handleMoveApplication}
                  loading={loading}
              />

              <FinalApplications
                  applications={finalApplications}
                  onOpenApplication={handleOpenApplication}
                  onQuickMove={handleOpenQuickMove}
              />
            </>
        ) : null}

        {activeView === "statistics" ? <StatisticsView applications={applications} /> : null}

        {createModalOpen ? (
            <NewApplicationModal
                onClose={handleCloseCreateModal}
                onCreateApplication={handleCreateApplication}
            />
        ) : null}

        {selectedApplication ? (
            <ApplicationDrawer
                application={selectedApplication}
                onClose={handleCloseDrawer}
                onUpdateApplication={handleUpdateApplication}
                onDeleteApplication={handleDeleteApplication}
                onUndoLastStatusChange={handleUndoLastStatusChange}
            />
        ) : null}

        {quickMoveApplication ? (
            <QuickMoveMenu
                application={quickMoveApplication}
                allowedStatuses={allowedQuickMoveStatuses}
                onMove={handleQuickMove}
                onClose={handleCloseQuickMove}
                onDelete={() => handleDeleteApplication(quickMoveApplication)}
            />
        ) : null}
      </main>
  );
}