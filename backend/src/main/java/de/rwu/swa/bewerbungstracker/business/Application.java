package de.rwu.swa.bewerbungstracker.business;

public class Application {

    private Long id;
    private String company;
    private String position;

    public Application(String company, String position) {
        this.company = company;
        this.position = position;
    }

    public Application(Long id, String company, String position) {
        this.id = id;
        this.company = company;
        this.position = position;
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
