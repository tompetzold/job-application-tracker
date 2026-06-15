package de.rwu.swa.bewerbungstracker.business;

public class ApplicationNotFoundException extends RuntimeException {

    public ApplicationNotFoundException(Long id) {
        super("Bewerbung mit ID " + id + " wurde nicht gefunden.");
    }
}
