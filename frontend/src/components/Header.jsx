function getDataSourceLabel(dataSource) {
    if (dataSource === "mock-backend") {
        return "MOCK";
    }

    if (dataSource === "mock-backend-offline") {
        return "Mocked Backend Offline";
    }

    if (dataSource === "backend") {
        return "BACKEND";
    }

    if (dataSource === "loading") {
        return "Lädt...";
    }

    return "MOCK";
}

function getDataSourceClassName(dataSource) {
    if (dataSource === "mock-backend-offline") {
        return "source-badge offline";
    }

    if (dataSource === "backend") {
        return "source-badge backend";
    }

    if (dataSource === "loading") {
        return "source-badge loading";
    }

    return "source-badge";
}

export default function Header({
                                   activeView,
                                   onChangeView,
                                   dataSource,
                                   apiError,
                                   searchTerm,
                                   onSearchChange,
                                   onCreateApplication,
                               }) {
    return (
        <header className="app-header">
            <div className="brand">
                <div className="brand-mark">●</div>
                <strong>Bewerbungstracker</strong>
            </div>

            <nav className="main-nav">
                <button
                    type="button"
                    className={activeView === "overview" ? "active" : ""}
                    onClick={() => onChangeView("overview")}
                >
                    Übersicht
                </button>

                <button
                    type="button"
                    className={activeView === "statistics" ? "active" : ""}
                    onClick={() => onChangeView("statistics")}
                >
                    Statistiken
                </button>
            </nav>

            <div className="header-actions">
        <span className={getDataSourceClassName(dataSource)} title={apiError || undefined}>
          {getDataSourceLabel(dataSource)}
        </span>

                <label className="search-field">
                    <span>⌕</span>
                    <input
                        value={searchTerm}
                        onChange={(event) => onSearchChange(event.target.value)}
                        type="search"
                        placeholder="Schnellsuche..."
                    />
                </label>

                <button type="button" className="primary-button compact" onClick={onCreateApplication}>
                    + Neue Bewerbung
                </button>
            </div>
        </header>
    );
}