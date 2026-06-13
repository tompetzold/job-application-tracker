package de.rwu.swa.bewerbungstracker.presentation;

/**
 * Eingehende Nutzdaten zum Erstellen oder Bearbeiten einer Bewerbung.
 * Nicht alle Felder sind für jeden Endpunkt relevant.
 */
public class ApplicationRequest {

    private String company;
    private String position;
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

    public String getCompany() {
        return company;
    }

    public String getPosition() {
        return position;
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
}
