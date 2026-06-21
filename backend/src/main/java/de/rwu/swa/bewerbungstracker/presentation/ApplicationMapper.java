package de.rwu.swa.bewerbungstracker.presentation;

import de.rwu.swa.bewerbungstracker.business.Application;

public class ApplicationMapper {

    public static Application toApplication(ApplicationRequest request) {
        Application application = new Application();
        application.setCompany(request.getCompany());
        application.setPosition(request.getPosition());
        application.setLocation(request.getLocation());
        application.setSalaryMode(request.getSalaryMode());
        application.setSalaryAmount(request.getSalaryAmount());
        application.setSalaryMin(request.getSalaryMin());
        application.setSalaryMax(request.getSalaryMax());
        application.setSalaryCurrency(request.getSalaryCurrency());
        application.setSalaryPeriod(request.getSalaryPeriod());
        application.setSalary(request.getSalary());
        application.setApplicationDeadline(request.getApplicationDeadline());
        application.setNextAction(request.getNextAction());
        application.setNotes(request.getNotes());
        return application;
    }

    public static Application toStatusUpdate(StatusChangeRequest request) {
        Application application = new Application();
        application.setStatus(request.getStatus());
        return application;
    }
}
