import ApplicationCard from "./ApplicationCard";

export default function FinalApplications({ applications, onOpenApplication, onQuickMove }) {
    if (!Array.isArray(applications) || applications.length === 0) {
        return null;
    }

    return (
        <section className="final-section">
            <h2>Abgeschlossene Bewerbungen</h2>

            <div className="final-list">
                {applications.map((application) => (
                    <ApplicationCard
                        key={application.id}
                        application={application}
                        onOpen={onOpenApplication}
                        onQuickMove={onQuickMove}
                    />
                ))}
            </div>
        </section>
    );
}