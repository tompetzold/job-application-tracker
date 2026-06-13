package de.rwu.swa.bewerbungstracker.business;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Domänenobjekt einer Bewerbung mit allen fachlichen Feldern und ihrem Verlauf.
 */
public class Application {

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

    private List<StatusHistoryEntry> history = new ArrayList<>();

    public Application(String company, String position, String status,
                       String phase, String location, String salaryMode, Double salaryAmount,
                       Double salaryMin, Double salaryMax, String salaryCurrency, String salaryPeriod, String salary,
                       String applicationDeadline, String nextAction, String notes, Instant createdAt, Instant updatedAt) {
        this.company = company;
        this.position = position;
        this.status = status;
        this.phase = phase;
        this.location = location;
        this.salaryMode = salaryMode;
        this.salaryAmount = salaryAmount;
        this.salaryMin = salaryMin;
        this.salaryMax = salaryMax;
        this.salaryCurrency = salaryCurrency;
        this.salaryPeriod = salaryPeriod;
        this.salary = salary;
        this.applicationDeadline = applicationDeadline;
        this.nextAction = nextAction;
        this.notes = notes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.history = new ArrayList<>();
    }

    public Application() {
        }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = company;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPhase() {
        return phase;
    }

    public void setPhase(String phase) {
        this.phase = phase;
    }
    
    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getSalaryMode() {
        return salaryMode;
    }

    public void setSalaryMode(String salaryMode) {
        this.salaryMode = salaryMode;
    }

    public Double getSalaryAmount() {
        return salaryAmount;
    }

    public void setSalaryAmount(Double salaryAmount) {
        this.salaryAmount = salaryAmount;
    }

    public Double getSalaryMin() {
        return salaryMin;
    }

    public void setSalaryMin(Double salaryMin) {
        this.salaryMin = salaryMin;
    }

    public Double getSalaryMax() {
        return salaryMax;
    }

    public void setSalaryMax(Double salaryMax) {
        this.salaryMax = salaryMax;
    }

    public String getSalaryCurrency() {
        return salaryCurrency;
    }

    public void setSalaryCurrency(String salaryCurrency) {
        this.salaryCurrency = salaryCurrency;
    }

    public String getSalaryPeriod() {
        return salaryPeriod;
    }

    public void setSalaryPeriod(String salaryPeriod) {
        this.salaryPeriod = salaryPeriod;
    }

    public String getSalary() {
        return salary;
    }

    public void setSalary(String salary) {
        this.salary = salary;
    }

    public String getApplicationDeadline() {
        return applicationDeadline;
    }

    public void setApplicationDeadline(String applicationDeadline) {
        this.applicationDeadline = applicationDeadline;
    }

    public String getNextAction() {
        return nextAction;
    }

    public void setNextAction(String nextAction) {
        this.nextAction = nextAction;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<StatusHistoryEntry> getHistory() {
        return history;
    }

    public void setHistory(List<StatusHistoryEntry> history) {
        this.history = history != null ? history : new ArrayList<>();
    }
}
