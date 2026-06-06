export const APPLICATION_STATUSES = ["DRAFT", "APPLIED", "INTERVIEW", "OFFER", "ACCEPTED", "REJECTED", "CANCELLED"];

export const BOARD_STATUSES = ["DRAFT", "APPLIED", "INTERVIEW", "OFFER", "ACCEPTED"];

export const FINAL_STATUSES = ["REJECTED", "CANCELLED"];

export const STATUS_LABELS = {
  DRAFT: "Entwurf",
  APPLIED: "Beworben",
  INTERVIEW: "Interview",
  OFFER: "Angebot",
  ACCEPTED: "Angenommen",
  REJECTED: "Abgelehnt",
  CANCELLED: "Abgesagt",
};

export const STATUS_DESCRIPTIONS = {
  DRAFT: "Bewerbung ist vorbereitet, aber noch nicht abgeschickt.",
  APPLIED: "Bewerbung wurde abgeschickt.",
  INTERVIEW: "Mindestens ein Interview ist geplant oder wurde geführt.",
  OFFER: "Firma hat ein konkretes Angebot gemacht.",
  ACCEPTED: "Du hast das Angebot angenommen.",
  REJECTED: "Die Firma hat abgesagt.",
  CANCELLED: "Du hast den Prozess beendet.",
};

export const STATUS_COLORS = {
  DRAFT: "#a1a1aa",
  APPLIED: "#0ea5e9",
  INTERVIEW: "#2563eb",
  OFFER: "#f97316",
  ACCEPTED: "#059669",
  REJECTED: "#dc2626",
  CANCELLED: "#7c3aed",
};

export const ALLOWED_TRANSITIONS = {
  DRAFT: ["APPLIED", "CANCELLED"],
  APPLIED: ["INTERVIEW", "OFFER", "REJECTED", "CANCELLED"],
  INTERVIEW: ["OFFER", "REJECTED", "CANCELLED"],
  OFFER: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: [],
  REJECTED: [],
  CANCELLED: [],
};

export function canMoveApplication(fromStatus, toStatus) {
  if (fromStatus === toStatus) return true;
  return ALLOWED_TRANSITIONS[fromStatus]?.includes(toStatus) ?? false;
}

export function getAllowedTargetStatuses(currentStatus) {
  return ALLOWED_TRANSITIONS[currentStatus] ?? [];
}
