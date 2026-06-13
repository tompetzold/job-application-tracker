package de.rwu.swa.bewerbungstracker.presentation;

import de.rwu.swa.bewerbungstracker.business.StatusHistoryEntry;

import java.time.Instant;

/**
 * Ausgabeformat eines einzelnen Verlaufseintrags.
 */
public class HistoryEntryResponse {

    private String id;
    private String type;
    private String previousStatus;
    private String newStatus;
    private String text;
    private Instant createdAt;
    private Instant undoneAt;

    public static HistoryEntryResponse from(StatusHistoryEntry entry) {
        HistoryEntryResponse response = new HistoryEntryResponse();
        response.id = entry.getId();
        response.type = entry.getType();
        response.previousStatus = entry.getPreviousStatus();
        response.newStatus = entry.getNewStatus();
        response.text = entry.getText();
        response.createdAt = entry.getCreatedAt();
        response.undoneAt = entry.getUndoneAt();
        return response;
    }

    public String getId() {
        return id;
    }

    public String getType() {
        return type;
    }

    public String getPreviousStatus() {
        return previousStatus;
    }

    public String getNewStatus() {
        return newStatus;
    }

    public String getText() {
        return text;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUndoneAt() {
        return undoneAt;
    }
}
