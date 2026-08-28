/** Persistiert erledigte Abgaben – bevorzugt über die bereitgestellte Storage-API. */
export async function loadDoneItems(storageKey) {
  try {
    if (window.storage && typeof window.storage.get === "function") {
      const result = await window.storage.get(storageKey, false);
      return result ? JSON.parse(result.value) : [];
    }

    const savedItems = localStorage.getItem(storageKey);
    return savedItems ? JSON.parse(savedItems) : [];
  } catch {
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
