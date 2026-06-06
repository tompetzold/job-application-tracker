import { STATUS_LABELS } from "../constants/applicationStatus";

export default function QuickMoveMenu({
                                          application,
                                          allowedStatuses,
                                          onMove,
                                          onClose,
                                          onDelete,
                                      }) {
    if (!application) {
        return null;
    }

    const safeAllowedStatuses = Array.isArray(allowedStatuses) ? allowedStatuses : [];

    function handleBackdropMouseDown(event) {
        if (event.target === event.currentTarget) {
            onClose();
        }
    }

    function handleMove(status) {
        if (typeof onMove === "function") {
            onMove(status);
        }
    }

    function handleDelete() {
        if (typeof onDelete === "function") {
            onDelete(application);
        }
    }

    return (
        <div className="quick-move-backdrop" role="presentation" onMouseDown={handleBackdropMouseDown}>
            <section className="quick-move-menu" role="dialog" aria-modal="true">
                <h3>Verschieben nach</h3>

                {safeAllowedStatuses.length === 0 ? (
                    <button type="button" disabled>
                        Keine zulässige Verschiebung
                    </button>
                ) : (
                    safeAllowedStatuses.map((status) => (
                        <button type="button" key={status} onClick={() => handleMove(status)}>
                            {STATUS_LABELS[status] ?? status}
                        </button>
                    ))
                )}

                <button type="button" className="danger-menu-button" onClick={handleDelete}>
                    Löschen
                </button>

                <button type="button" onClick={onClose}>
                    Abbrechen
                </button>
            </section>
        </div>
    );
}