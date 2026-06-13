package de.rwu.swa.bewerbungstracker.presentation;

import java.time.Instant;
import java.util.List;

import de.rwu.swa.bewerbungstracker.business.Application;

/**
 * Ausgabeformat einer Bewerbung inklusive Verlauf.
 * Die Feldnamen entsprechen exakt dem vom Frontend erwarteten JSON.
 */
public class ApplicationResponse {

    private Long id;
    private String company;
    private String position;
    private String status;
    private String phase;
    private String location;

    private String salaryMode;
    private Double salaryAmount;
    private Double salaryMin;
    private Double salaryMax;
    private String salaryCurrency;
    private String salaryPeriod;
    private String salary;

    private String applicationDeadline;
    private String nextAction;
    private String notes;

    private Instant createdAt;
    private Instant updatedAt;

    private List<HistoryEntryResponse> history;

    public static ApplicationResponse from(Application application) {
        ApplicationResponse response = new ApplicationResponse();
        response.id = application.getId();
        response.company = application.getCompany();
        response.position = application.getPosition();
        response.status = application.getStatus();
        response.phase = application.getPhase();
        response.location = application.getLocation();
        response.salaryMode = application.getSalaryMode();
        response.salaryAmount = application.getSalaryAmount();
        response.salaryMin = application.getSalaryMin();
        response.salaryMax = application.getSalaryMax();
        response.salaryCurrency = application.getSalaryCurrency();
        response.salaryPeriod = application.getSalaryPeriod();
        response.salary = application.getSalary();
        response.applicationDeadline = application.getApplicationDeadline();
        response.nextAction = application.getNextAction();
        response.notes = application.getNotes();
        response.createdAt = application.getCreatedAt();
        response.updatedAt = application.getUpdatedAt();
        response.history = application.getHistory().stream().map(HistoryEntryResponse::from).toList();
        return response;
    }

    public Long getId() {
        return id;
    }

    public String getCompany() {
        return company;
    }

    public String getPosition() {
        return position;
    }

    public String getStatus() {
        return status;
    }

    public String getPhase() {
        return phase;
    }

    public String getLocation() {
        return location;
    }

    public String getSalaryMode() {
        return salaryMode;
    }

    public Double getSalaryAmount() {
        return salaryAmount;
    }

    public Double getSalaryMin() {
        return salaryMin;
    }

    public Double getSalaryMax() {
        return salaryMax;
    }

    public String getSalaryCurrency() {
        return salaryCurrency;
    }

    public String getSalaryPeriod() {
        return salaryPeriod;
    }

    public String getSalary() {
        return salary;
    }

    public String getApplicationDeadline() {
        return applicationDeadline;
    }

    public String getNextAction() {
        return nextAction;
    }

    public String getNotes() {
        return notes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public List<HistoryEntryResponse> getHistory() {
        return history;
    }
}
