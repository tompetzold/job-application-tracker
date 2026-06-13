package de.rwu.swa.bewerbungstracker.business;

/**
 * Wird geworfen, wenn keine Bewerbung mit der angefragten ID existiert.
 * Der Controller bildet sie auf HTTP 404 (Not Found) ab.
 */
public class ApplicationNotFoundException extends RuntimeException {

    public ApplicationNotFoundException(Long id) {
        super("Bewerbung mit ID " + id + " wurde nicht gefunden.");
    }
}
