import {
    DndContext,
    DragOverlay,
    PointerSensor,
    pointerWithin,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { useMemo, useState } from "react";
import {
    BOARD_STATUSES,
    STATUS_LABELS,
    canMoveApplication,
} from "../constants/applicationStatus";
import { getRelevantSortDate } from "../utils/applicationDates";
import ApplicationCard from "./ApplicationCard";
import ApplicationColumn from "./ApplicationColumn";

function compareApplicationsForBoard(firstApplication, secondApplication) {
    const firstDate = getRelevantSortDate(firstApplication);
    const secondDate = getRelevantSortDate(secondApplication);

    if (firstDate !== secondDate) {
        return firstDate - secondDate;
    }

    const firstUpdatedAt = new Date(firstApplication.updatedAt ?? firstApplication.createdAt ?? 0).getTime();
    const secondUpdatedAt = new Date(secondApplication.updatedAt ?? secondApplication.createdAt ?? 0).getTime();

    return secondUpdatedAt - firstUpdatedAt;
}

function groupApplicationsByStatus(applications) {
    return BOARD_STATUSES.reduce((groups, status) => {
        groups[status] = applications
            .filter((application) => application.status === status)
            .sort(compareApplicationsForBoard);

        return groups;
    }, {});
}

export default function Board({
                                  applications,
                                  onOpenApplication,
                                  onQuickMove,
                                  onMoveApplication,
                                  loading,
                              }) {
    const [activeApplication, setActiveApplication] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 6,
            },
        }),
    );

    const groupedApplications = useMemo(() => {
        return groupApplicationsByStatus(Array.isArray(applications) ? applications : []);
    }, [applications]);

    function handleDragStart(event) {
        const application = event.active.data.current?.application ?? null;
        setActiveApplication(application);
    }

    function handleDragCancel() {
        setActiveApplication(null);
    }

    async function handleDragEnd(event) {
        const application = event.active.data.current?.application ?? activeApplication;
        const targetStatus = event.over?.data.current?.status ?? event.over?.id ?? null;

        setActiveApplication(null);

        if (!application || !targetStatus) {
            return;
        }

        if (application.status === targetStatus) {
            return;
        }

        if (!canMoveApplication(application.status, targetStatus)) {
            return;
        }

        if (typeof onMoveApplication === "function") {
            await onMoveApplication(application, targetStatus);
        }
    }

    return (
        <section className="board-section">
            <div className="board-title">
                <div>
                    <h2>Board</h2>
                    <p>Karten per Drag & Drop zwischen zulässigen Spalten verschieben.</p>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={pointerWithin}
                onDragStart={handleDragStart}
                onDragCancel={handleDragCancel}
                onDragEnd={handleDragEnd}
            >
                <div className="board-scroll">
                    <div className="board-grid">
                        {BOARD_STATUSES.map((status) => (
                            <ApplicationColumn
                                key={status}
                                status={status}
                                title={STATUS_LABELS[status]}
                                applications={groupedApplications[status] ?? []}
                                activeApplication={activeApplication}
                                loading={loading}
                                onOpenApplication={onOpenApplication}
                                onQuickMove={onQuickMove}
                            />
                        ))}
                    </div>
                </div>

                <DragOverlay dropAnimation={null}>
                    {activeApplication ? (
                        <ApplicationCard
                            application={activeApplication}
                            onOpen={onOpenApplication}
                            onQuickMove={onQuickMove}
                            isOverlay
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>
        </section>
    );
}