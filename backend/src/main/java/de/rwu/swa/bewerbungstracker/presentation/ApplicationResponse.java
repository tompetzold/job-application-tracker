package de.rwu.swa.bewerbungstracker.presentation;

import de.rwu.swa.bewerbungstracker.business.Application;

public class ApplicationResponse {

    private Long id;
    private String company;
    private String position;

    public static ApplicationResponse from(Application application) {
        ApplicationResponse response = new ApplicationResponse();
        response.id = application.getId();
        response.company = application.getCompany();
        response.position = application.getPosition();
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
}
