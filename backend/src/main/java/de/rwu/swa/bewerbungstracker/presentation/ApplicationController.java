package de.rwu.swa.bewerbungstracker.presentation;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import de.rwu.swa.bewerbungstracker.business.ApplicationNotFoundException;
import de.rwu.swa.bewerbungstracker.business.ApplicationService;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
@RestController
public class ApplicationController {

    private final ApplicationService service;

    public ApplicationController(ApplicationService service) {
        this.service = service;
    }

    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    @PostMapping("/api/applications")
    @ResponseStatus(HttpStatus.CREATED)
    public ApplicationResponse create(@RequestBody ApplicationRequest request) {
        return ApplicationResponse.from(service.create(ApplicationMapper.toApplication(request)));
    }

    @GetMapping("/api/applications")
    public List<ApplicationResponse> findAll() {
        return service.findAll().stream()
                .map(ApplicationResponse::from)
                .toList();
    }

    @PutMapping("/api/applications/{id}")
    public ApplicationResponse updateContent(@PathVariable Long id, @RequestBody ApplicationRequest request) {
        return ApplicationResponse.from(service.updateContent(id, ApplicationMapper.toApplication(request)));
    }

    @PatchMapping("/api/applications/{id}/status")
    public ApplicationResponse updateStatus(@PathVariable Long id, @RequestBody StatusChangeRequest request) {
        return ApplicationResponse.from(service.updateStatus(id, ApplicationMapper.toStatusUpdate(request)));
    }

    @PostMapping("/api/applications/{id}/undo-last-status-change")
    public ApplicationResponse undoLastStatusChange(@PathVariable Long id) {
        return ApplicationResponse.from(service.undoLastStatusChange(id));
    }

    @DeleteMapping("/api/applications/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteById(@PathVariable Long id) {
        service.deleteById(id);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleValidationError(IllegalArgumentException e) {
        return Map.of("error", e.getMessage());
    }

    @ExceptionHandler(ApplicationNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, String> handleNotFound(ApplicationNotFoundException e) {
        return Map.of("error", e.getMessage());
    }
}