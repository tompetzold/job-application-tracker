import { useDroppable } from "@dnd-kit/core";
import {
    STATUS_COLORS,
    STATUS_DESCRIPTIONS,
    canMoveApplication,
} from "../constants/applicationStatus";
import ApplicationCard from "./ApplicationCard";

export default function ApplicationColumn({
                                              status,
                                              title,
                                              applications,
                                              activeApplication,
                                              loading,
                                              onOpenApplication,
                                              onQuickMove,
                                          }) {
    const { isOver, setNodeRef } = useDroppable({
        id: status,
        data: {
            status,
        },
    });

    const activeStatus = activeApplication?.status ?? null;
    const dragActive = Boolean(activeApplication);
    const isCurrentColumn = activeStatus === status;
    const isAllowedTarget = activeStatus ? canMoveApplication(activeStatus, status) : false;
    const isBlockedTarget = dragActive && !isAllowedTarget;

    const columnClassName = [
        "board-column",
        dragActive ? "drag-active" : "",
        dragActive && isCurrentColumn ? "drop-current" : "",
        dragActive && isAllowedTarget && !isCurrentColumn ? "drop-allowed" : "",
        dragActive && isBlockedTarget && !isCurrentColumn ? "drop-blocked" : "",
        isOver && isAllowedTarget ? "is-over-valid" : "",
        isOver && isBlockedTarget ? "is-over-invalid" : "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <article ref={setNodeRef} className={columnClassName}>
            <header className="column-header">
                <div className="column-title">
          <span
              className="status-dot"
              style={{ backgroundColor: STATUS_COLORS[status] }}
              aria-hidden="true"
          />
                    <h2>{title}</h2>
                    <small>{applications.length}</small>
                </div>

                <p>{STATUS_DESCRIPTIONS[status]}</p>
            </header>

            <div className="column-body">
                {loading ? <div className="empty-column">Lädt...</div> : null}

                {!loading && applications.length === 0 ? <div className="empty-column">Leer</div> : null}

                {!loading
                    ? applications.map((application) => (
                        <ApplicationCard
                            key={application.id}
                            application={application}
                            onOpen={onOpenApplication}
                            onQuickMove={onQuickMove}
                        />
                    ))
                    : null}
            </div>
        </article>
    );
}