package de.rwu.swa.bewerbungstracker.business;

import de.rwu.swa.bewerbungstracker.persistence.ApplicationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ApplicationService {

    private final ApplicationRepository repository;

    public ApplicationService(ApplicationRepository repository) {
        this.repository = repository;
    }

    public Application create(String company, String position) {
        if (company == null || company.isBlank()) {
            throw new IllegalArgumentException("Company darf nicht leer sein");
        }
        if (position == null || position.isBlank()) {
            throw new IllegalArgumentException("Position darf nicht leer sein");
        }
        return repository.save(new Application(company, position));
    }

    public List<Application> findAll() {
        return repository.findAll();
    }

    public void deleteById(Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("Ungültige Bewerbungs-ID");
        }

        boolean deleted = repository.deleteById(id);

        if (!deleted) {
            throw new IllegalArgumentException("Bewerbung mit ID " + id + " wurde nicht gefunden");
        }
    }
}