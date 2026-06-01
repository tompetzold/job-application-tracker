package de.rwu.swa.bewerbungstracker.persistence;

import de.rwu.swa.bewerbungstracker.business.Application;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class ApplicationRepository {

    private final JdbcTemplate jdbc;

    public ApplicationRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Application save(Application application) {
        String sql = "INSERT INTO applications (company, position) VALUES (?, ?) RETURNING id";
        Long id = jdbc.queryForObject(sql, Long.class, application.getCompany(), application.getPosition());
        return new Application(id, application.getCompany(), application.getPosition());
    }

    public List<Application> findAll() {
        String sql = "SELECT id, company, position FROM applications ORDER BY id DESC";
        return jdbc.query(sql, (rs, rowNum) -> new Application(
                rs.getLong("id"),
                rs.getString("company"),
                rs.getString("position")
        ));
    }

    public boolean deleteById(Long id) {
        String sql = "DELETE FROM applications WHERE id = ?";
        int affectedRows = jdbc.update(sql, id);
        return affectedRows > 0;
    }
}