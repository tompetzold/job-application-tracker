package de.rwu.swa.bewerbungstracker.business;

import java.time.Instant;

/**
 * Einzelner Eintrag im Verlauf einer Bewerbung (Statuswechsel, Erstellung, Undo).
 */
public class StatusHistoryEntry {

    private String id;
    private String type;
    private String previousStatus;
    private String newStatus;
    private String text;
    private Instant createdAt;
    private Instant undoneAt;

    public StatusHistoryEntry() {
    }

    public StatusHistoryEntry(String id, String type, String previousStatus, String newStatus, String text, Instant createdAt, Instant undoneAt) {
        this.id = id;
        this.type = type;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.text = text;
        this.createdAt = createdAt;
        this.undoneAt = undoneAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getPreviousStatus() {
        return previousStatus;
    }

    public void setPreviousStatus(String previousStatus) {
        this.previousStatus = previousStatus;
    }

    public String getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(String newStatus) {
        this.newStatus = newStatus;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUndoneAt() {
        return undoneAt;
    }

    public void setUndoneAt(Instant undoneAt) {
        this.undoneAt = undoneAt;
    }
}
