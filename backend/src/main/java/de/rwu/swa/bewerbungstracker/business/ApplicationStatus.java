package de.rwu.swa.bewerbungstracker.business;

import java.util.Map;
import java.util.Set;

public class ApplicationStatus {

    private static final Map<String, Set<String>> ALLOWED_TRANSITIONS = Map.of(
            "DRAFT", Set.of("APPLIED", "CANCELLED"),
            "APPLIED", Set.of("INTERVIEW", "OFFER", "REJECTED", "CANCELLED"),
            "INTERVIEW", Set.of("OFFER", "REJECTED", "CANCELLED"),
            "OFFER", Set.of("ACCEPTED", "CANCELLED"),
            "ACCEPTED", Set.of(),
            "REJECTED", Set.of(),
            "CANCELLED", Set.of()
    );

    public static boolean validateStatusTransition(String currentStatus, String newStatus) {
        return ALLOWED_TRANSITIONS.getOrDefault(currentStatus, Set.of()).contains(newStatus);
    }
}
