/** Persistiert erledigte Abgaben – bevorzugt über die bereitgestellte Storage-API. */
export async function loadDoneItems(storageKey) {
  let savedItems;

  try {
    if (window.storage && typeof window.storage.get === "function") {
      const result = await window.storage.get(storageKey, false);
      savedItems = result?.value;
    } else {
      savedItems = localStorage.getItem(storageKey);
    }
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
    if (window.storage && typeof window.storage.set === "function") {
      await window.storage.set(storageKey, JSON.stringify(doneItems), false);
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify(doneItems));
  } catch {
    // Das Dashboard bleibt nutzbar, falls der Browser nicht speichern kann.
  }
}
