import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { STATUS_COLORS } from "../constants/applicationStatus";
import { getRelevantDateMeta } from "../utils/applicationDates";

function normalizeText(value) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim();
}

function getCardMeta(application) {
    const salary = normalizeText(application.salary);
    const location = normalizeText(application.location);

    if (salary && location) {
        return `${salary} · ${location}`;
    }

    if (salary) {
        return salary;
    }

    if (location) {
        return location;
    }

    return "";
}

export default function ApplicationCard({ application, onOpen, onQuickMove, isOverlay = false }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: String(application.id),
        data: {
            application,
        },
        disabled: isOverlay,
    });

    const cardMeta = getCardMeta(application);
    const dateMeta = getRelevantDateMeta(application);
    const statusColor = STATUS_COLORS[application.status] ?? "#e5e5e5";

    const cardStyle = {
        transform: CSS.Translate.toString(transform),
        borderColor: statusColor,
    };

    function handleOpen(event) {
        event.stopPropagation();

        if (typeof onOpen === "function") {
            onOpen(application);
        }
    }

    function handleQuickMove(event) {
        event.preventDefault();
        event.stopPropagation();

        if (typeof onQuickMove === "function") {
            onQuickMove(application);
        }
    }

    return (
        <article
            ref={setNodeRef}
            className={[
                "application-card",
                isDragging ? "is-dragging" : "",
                isOverlay ? "drag-overlay-card" : "",
            ]
                .filter(Boolean)
                .join(" ")}
            style={cardStyle}
            {...attributes}
            {...listeners}
        >
            <button type="button" className="application-card-content" onClick={handleOpen}>
                <div className="application-card-main">
                    <h3>{application.company}</h3>
                    <p>{application.position}</p>
                </div>

                {cardMeta ? <div className="card-meta-line">{cardMeta}</div> : null}
                {dateMeta ? <div className="card-date-line">{dateMeta}</div> : null}
            </button>

            <button
                type="button"
                className="card-menu-button"
                aria-label="Bewerbung verschieben"
                onPointerDown={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                onClick={handleQuickMove}
            >
                ...
            </button>
        </article>
    );
}