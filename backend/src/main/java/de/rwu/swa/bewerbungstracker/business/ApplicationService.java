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

    public List<Application> findAll() {
        return repository.findAll();
    }

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
        input.setStatus("DRAFT");
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

    public Application undoLastStatusChange(Long id) {
        Application application = repository.findById(id).orElseThrow(() -> new ApplicationNotFoundException(id));

        StatusHistoryEntry lastChange = null;
        for (StatusHistoryEntry entry : application.getHistory()) {
            if ("STATUS_CHANGED".equals(entry.getType()) && entry.getUndoneAt() == null) {
                lastChange = entry;
                break;
            }
        }

        if (lastChange == null) {
            return application;
        }

        if (!application.getStatus().equals(lastChange.getNewStatus())) {
           return application; 
        }
       
        Instant now = Instant.now();
        String currentStatus = application.getStatus();
        String revertedStatus = lastChange.getPreviousStatus();

        lastChange.setUndoneAt(now);

        application.getHistory().add(0, new StatusHistoryEntry(
                UUID.randomUUID().toString(),
                "STATUS_CHANGE_UNDONE",
                currentStatus,
                revertedStatus,
                "Statusänderung rückgängig gemacht von \"" + currentStatus + "\" zu \"" + revertedStatus + "\"",
                now,
                null));

        application.setStatus(revertedStatus);
        application.setUpdatedAt(now);
        repository.update(application);
        repository.saveHistory(application);
        return application;
    }

    public Application updateStatus(Long id, Application status) {
        Application application = repository.findById(id).orElseThrow(() -> new ApplicationNotFoundException(id));
        String currentStatus = application.getStatus();
        String newStatus = status.getStatus();

        if (currentStatus.equals(newStatus)) {
            return application;
            }
        if (!ApplicationStatus.validateStatusTransition(currentStatus, newStatus)) {
            throw new IllegalArgumentException("Ungültiger Status-Übergang");
        }

        Instant now = Instant.now();

        application.getHistory().add(0, new StatusHistoryEntry(
                UUID.randomUUID().toString(),
                "STATUS_CHANGED",
                currentStatus,
                newStatus,
                "Status geändert von \"" + currentStatus + "\" zu \"" + newStatus + "\"",
                now,
                null));

        application.setStatus(newStatus);
        application.setUpdatedAt(now);
        repository.update(application);
        repository.saveHistory(application);
        return application;
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

    private static String normalizeText(String value) {
        return value == null ? "" : value.trim();
    }

    private static String orDefault(String value, String fallback) {
        return value == null ? fallback : value;
    }

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