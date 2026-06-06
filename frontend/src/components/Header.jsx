export default function Header({
                                   activeView,
                                   onChangeView,
                                   dataSource,
                                   searchTerm,
                                   onSearchChange,
                                   onCreateApplication,
                               }) {
    function handleOverviewClick() {
        if (typeof onChangeView === "function") {
            onChangeView("overview");
        }
    }

    function handleStatisticsClick() {
        if (typeof onChangeView === "function") {
            onChangeView("statistics");
        }
    }

    function handleSearchChange(event) {
        if (typeof onSearchChange === "function") {
            onSearchChange(event.target.value);
        }
    }

    function handleCreateApplicationClick() {
        if (typeof onCreateApplication === "function") {
            onCreateApplication();
        }
    }

    return (
        <header className="app-header">
            <div className="brand">
                <span className="brand-icon" aria-hidden="true"></span>
                <span>Bewerbungstracker</span>
            </div>

            <nav className="navigation" aria-label="Hauptnavigation">
                <button
                    type="button"
                    className={activeView === "overview" ? "navigation-link active" : "navigation-link"}
                    onClick={handleOverviewClick}
                >
                    Übersicht
                </button>

                <button
                    type="button"
                    className={activeView === "statistics" ? "navigation-link active" : "navigation-link"}
                    onClick={handleStatisticsClick}
                >
                    Statistiken
                </button>
            </nav>

            <div className="header-actions">
        <span className="backend-pill" data-source={dataSource}>
          {dataSource === "backend" ? "Backend" : "Mock"}
        </span>

                <label className="search-box">
                    <span aria-hidden="true">⌕</span>
                    <input
                        value={searchTerm}
                        onChange={handleSearchChange}
                        type="search"
                        placeholder="Schnellsuche..."
                    />
                </label>

                <button type="button" className="primary-button" onClick={handleCreateApplicationClick}>
                    + Neue Bewerbung
                </button>
            </div>
        </header>
    );
}