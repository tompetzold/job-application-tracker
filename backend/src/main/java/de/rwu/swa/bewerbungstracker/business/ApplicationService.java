package de.rwu.swa.bewerbungstracker.business;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import de.rwu.swa.bewerbungstracker.persistence.ApplicationRepository;


@Service
public class ApplicationService {

    private static final String DEFAULT_SALARY_MODE = "NONE";
    private static final String DEFAULT_SALARY_CURRENCY = "EUR";
    private static final String DEFAULT_SALARY_PERIOD = "YEAR";

    private final ApplicationRepository repository;

    public ApplicationService(ApplicationRepository repository) {
        this.repository = repository;
    }

    // public List<Application> findAll() {
    //     return repository.findAll();
    // }

    public Application create(Application input) {
        String company = normalizeText(input.getCompany());
        String position = normalizeText(input.getPosition());

        if (company.isBlank() || position.isBlank()) {
            throw new IllegalArgumentException("Firma und Position sind Pflichtfelder.");
        }

        if ((input.getSalaryAmount() != null && input.getSalaryAmount() < 0)
                || (input.getSalaryMin() != null && input.getSalaryMin() < 0)
                || (input.getSalaryMax() != null && input.getSalaryMax() < 0)) {
            throw new IllegalArgumentException("Gehalt darf nicht negativ sein.");
        }

        if (input.getSalaryMin() != null && input.getSalaryMax() != null && input.getSalaryMin().compareTo(input.getSalaryMax()) > 0) {
            throw new IllegalArgumentException("Ungültige Gehaltsangaben.");
        }

        Instant now = Instant.now();
        String salaryMode = orDefault(input.getSalaryMode(), DEFAULT_SALARY_MODE);

        input.setId(null);
        input.setCompany(company);
        input.setPosition(position);
        input.setStatus("DRAFT"); // Status muss noch implementiert werden, hier vorerst statisch
        input.setPhase("");
        input.setLocation(normalizeText(input.getLocation()));
        input.setSalaryMode(salaryMode);
        input.setSalaryCurrency(orDefault(input.getSalaryCurrency(), DEFAULT_SALARY_CURRENCY));
        input.setSalaryPeriod(orDefault(input.getSalaryPeriod(), DEFAULT_SALARY_PERIOD));
        input.setSalary(formatSalary(salaryMode, input.getSalaryAmount(), input.getSalaryMin(), input.getSalaryMax()));
        input.setApplicationDeadline(orDefault(input.getApplicationDeadline(), ""));
        input.setNextAction("");
        input.setNotes(normalizeText(input.getNotes()));
        input.setCreatedAt(now);
        input.setUpdatedAt(now);

        List<StatusHistoryEntry> history = new ArrayList<>();
        history.add(new StatusHistoryEntry(
                UUID.randomUUID().toString(),
                "APPLICATION_CREATED",
                null,
                "DRAFT",
                "Bewerbung erstellt als Entwurf",
                now,
                null
        ));
        input.setHistory(history);

        return repository.save(input);
    }

    public Application updateContent(Long id, Application changes) {
        Application application = repository.findById(id).orElseThrow(() -> new ApplicationNotFoundException(id));

        application.setCompany(normalizeText(changes.getCompany()));
        application.setPosition(normalizeText(changes.getPosition()));
        application.setLocation(normalizeText(changes.getLocation()));
        application.setSalary(normalizeText(changes.getSalary()));
        application.setNotes(normalizeText(changes.getNotes()));
        application.setApplicationDeadline(orDefault(changes.getApplicationDeadline(), ""));
        application.setNextAction(orDefault(changes.getNextAction(), ""));
        application.setUpdatedAt(Instant.now());

        return repository.update(application);
    }

    public void deleteById(Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("Ungültige Bewerbungs-ID");
        }

        boolean deleted = repository.deleteById(id);

        if (!deleted) {
            throw new ApplicationNotFoundException(id);
        }
    }

    private static String normalizeText(String value) { // Entfernt führende und folgende Leerzeichen, ersetzt null durch leeren String
        return value == null ? "" : value.trim();
    }

    private static String orDefault(String value, String fallback) { // Gibt den Wert zurück, oder den Fallback, wenn der Wert null ist
        return value == null ? fallback : value;
    }

    /**
     * Bildet die formatierte Gehaltsanzeige analog zum Frontend
     * (z. B. "55k €", "70k–90k €", "ab 70k €").
     */
    private static String formatSalary(String salaryMode, Double amount, Double min, Double max) {
        if ("EXACT".equals(salaryMode)) {
            String formatted = formatSalaryAmount(amount);
            return formatted.isEmpty() ? "" : formatted + " €";
        }

        if ("RANGE".equals(salaryMode)) {
            String formattedMin = formatSalaryAmount(min);
            String formattedMax = formatSalaryAmount(max);

            if (!formattedMin.isEmpty() && !formattedMax.isEmpty()) {
                return formattedMin + "–" + formattedMax + " €";
            }
            if (!formattedMin.isEmpty()) {
                return "ab " + formattedMin + " €";
            }
            if (!formattedMax.isEmpty()) {
                return "bis " + formattedMax + " €";
            }
        }

        return "";
    }

    private static String formatSalaryAmount(Double value) {
        if (value == null || !Double.isFinite(value)) {
            return "";
        }
        return BigDecimal.valueOf(value).stripTrailingZeros().toPlainString() + "k";
    }
}