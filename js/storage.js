/** Persistiert erledigte Abgaben und bestandene Prüfungen im lokalen Browser-Speicher. */
export async function loadDoneItems(storageKey) {
  let savedItems;

  try {
    savedItems = localStorage.getItem(storageKey);
  } catch {
    // Bei einem Lesefehler vorhandene Daten nicht durch Anfangswerte überschreiben.
    return undefined;
  }

  if (savedItems == null) return null;

  try {
    const parsed = JSON.parse(savedItems);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Ein beschädigter Eintrag darf die Initialisierung nicht unterbrechen.
    return [];
  }
}

export async function saveDoneItems(storageKey, doneItems) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(doneItems));
  } catch {
    // Das Dashboard bleibt nutzbar, falls der Browser nicht speichern kann.
  }
}
