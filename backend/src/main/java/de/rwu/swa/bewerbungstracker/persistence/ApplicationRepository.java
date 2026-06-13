package de.rwu.swa.bewerbungstracker.persistence;
import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import de.rwu.swa.bewerbungstracker.business.Application;
import de.rwu.swa.bewerbungstracker.business.StatusHistoryEntry;

@Repository
public class ApplicationRepository {

    private final JdbcTemplate jdbc;

    public ApplicationRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Application save(Application input) {
        String sql = """
                INSERT INTO applications (
                    company, position, status, phase, location,
                    salary_mode, salary_amount, salary_min, salary_max,
                    salary_currency, salary_period, salary,
                    application_deadline, next_action, notes,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING id
                """;
        Long id = jdbc.queryForObject(
                sql, 
                Long.class, 
                input.getCompany(), 
                input.getPosition(), 
                input.getStatus(), 
                input.getPhase(), 
                input.getLocation(),
                input.getSalaryMode(), 
                input.getSalaryAmount(), 
                input.getSalaryMin(), 
                input.getSalaryMax(),
                input.getSalaryCurrency(), 
                input.getSalaryPeriod(), 
                input.getSalary(),
                input.getApplicationDeadline(), 
                input.getNextAction(), 
                input.getNotes(),
                input.getCreatedAt() == null ? null : Timestamp.from(input.getCreatedAt()),
                input.getUpdatedAt() == null ? null : Timestamp.from(input.getUpdatedAt())
        );

        input.setId(id);

        saveHistory(input);
        return input;
    }

    private void saveHistory(Application input) {
        String historySql = """
                INSERT INTO application_history (
                    id, application_id, type, previous_status, new_status, text, created_at, undone_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """;
        var entry = input.getHistory().get(0);
            jdbc.update(
                    historySql,
                    entry.getId(),
                    input.getId(),
                    entry.getType(),
                    entry.getPreviousStatus(),
                    entry.getNewStatus(),
                    entry.getText(),
                    entry.getCreatedAt() == null ? null : Timestamp.from(entry.getCreatedAt()),
                    entry.getUndoneAt() == null ? null : Timestamp.from(entry.getUndoneAt())
            );
    }

    public Optional<Application> findById(Long id) {
        String sql = "SELECT * FROM applications WHERE id = ?";

        List<Application> result = jdbc.query(sql, (rs, rowNum) -> {
            Application application = new Application();
            application.setId(rs.getLong("id"));
            application.setCompany(rs.getString("company"));
            application.setPosition(rs.getString("position"));
            application.setStatus(rs.getString("status"));
            application.setPhase(rs.getString("phase"));
            application.setLocation(rs.getString("location"));
            application.setSalaryMode(rs.getString("salary_mode"));
            application.setSalaryAmount(rs.getObject("salary_amount", Double.class));
            application.setSalaryMin(rs.getObject("salary_min", Double.class));
            application.setSalaryMax(rs.getObject("salary_max", Double.class));
            application.setSalaryCurrency(rs.getString("salary_currency"));
            application.setSalaryPeriod(rs.getString("salary_period"));
            application.setSalary(rs.getString("salary"));
            application.setApplicationDeadline(rs.getString("application_deadline"));
            application.setNextAction(rs.getString("next_action"));
            application.setNotes(rs.getString("notes"));
            application.setCreatedAt(rs.getTimestamp("created_at") == null ? null : rs.getTimestamp("created_at").toInstant());
            application.setUpdatedAt(rs.getTimestamp("updated_at") == null ? null : rs.getTimestamp("updated_at").toInstant());
            return application;
        }, id);

        if (result.isEmpty()) {
            return Optional.empty();
        }

        Application application = result.get(0);

        String historySql = "SELECT * FROM application_history WHERE application_id = ? ORDER BY seq DESC";
        List<StatusHistoryEntry> history = jdbc.query(historySql, (rs, rowNum) -> new StatusHistoryEntry(
                rs.getString("id"),
                rs.getString("type"),
                rs.getString("previous_status"),
                rs.getString("new_status"),
                rs.getString("text"),
                rs.getTimestamp("created_at") == null ? null : rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("undone_at") == null ? null : rs.getTimestamp("undone_at").toInstant()
        ), id);

        application.setHistory(history);

        return Optional.of(application);
    }

    public Application update(Application application) {
        String sql = """
                UPDATE applications SET
                    company = ?, position = ?, status = ?, phase = ?, location = ?,
                    salary_mode = ?, salary_amount = ?, salary_min = ?, salary_max = ?,
                    salary_currency = ?, salary_period = ?, salary = ?,
                    application_deadline = ?, next_action = ?, notes = ?,
                    created_at = ?, updated_at = ?
                WHERE id = ?
                """;
        jdbc.update(
                sql,
                application.getCompany(),
                application.getPosition(),
                application.getStatus(),
                application.getPhase(),
                application.getLocation(),
                application.getSalaryMode(),
                application.getSalaryAmount(),
                application.getSalaryMin(),
                application.getSalaryMax(),
                application.getSalaryCurrency(),
                application.getSalaryPeriod(),
                application.getSalary(),
                application.getApplicationDeadline(),
                application.getNextAction(),
                application.getNotes(),
                application.getCreatedAt() == null ? null : Timestamp.from(application.getCreatedAt()),
                Timestamp.from(application.getUpdatedAt()),
                application.getId()
        );

        saveHistory(application);
        return application;
    }

    // public List<Application> findAll() {
    //     String sql = "SELECT id, company, position FROM applications ORDER BY id DESC";
    //     return jdbc.query(sql, (rs, rowNum) -> new Application(
    //             rs.getLong("id"),
    //             rs.getString("company"),
    //             rs.getString("position")
    //     ));
    // }

    public boolean deleteById(Long id) {
        String sql = "DELETE FROM applications WHERE id = ?";
        int affectedRows = jdbc.update(sql, id);
        return affectedRows > 0;
    }
}