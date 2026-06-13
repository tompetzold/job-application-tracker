package de.rwu.swa.bewerbungstracker.presentation;

import de.rwu.swa.bewerbungstracker.business.Application;
import de.rwu.swa.bewerbungstracker.business.ApplicationService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService service;

    public ApplicationController(ApplicationService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApplicationResponse create(@RequestBody ApplicationRequest request) {
        Application input = new Application();
        input.setCompany(request.getCompany());
        input.setPosition(request.getPosition());
        input.setLocation(request.getLocation());
        input.setSalaryMode(request.getSalaryMode());
        input.setSalaryAmount(request.getSalaryAmount());
        input.setSalaryMin(request.getSalaryMin());
        input.setSalaryMax(request.getSalaryMax());
        input.setSalaryCurrency(request.getSalaryCurrency());
        input.setSalaryPeriod(request.getSalaryPeriod());
        input.setApplicationDeadline(request.getApplicationDeadline());
        input.setNotes(request.getNotes());

        return ApplicationResponse.from(service.create(input));
    }

    // @GetMapping
    // public List<ApplicationResponse> findAll() {
    //     return service.findAll().stream()
    //             .map(ApplicationResponse::from)
    //             .toList();
    // }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteById(@PathVariable Long id) {
        service.deleteById(id);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleValidationError(IllegalArgumentException e) {
        return Map.of("error", e.getMessage());
    }
}