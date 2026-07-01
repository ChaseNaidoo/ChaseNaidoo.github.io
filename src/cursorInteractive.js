let heroPlusHoverCount = 0;
let heroPlusDragCount = 0;

export function enterHeroPlusCursor() {
  heroPlusHoverCount += 1;
}

export function leaveHeroPlusCursor() {
  heroPlusHoverCount = Math.max(0, heroPlusHoverCount - 1);
}

export function startHeroPlusDrag() {
  heroPlusDragCount += 1;
}

export function endHeroPlusDrag() {
  heroPlusDragCount = Math.max(0, heroPlusDragCount - 1);
}

export function resetHeroPlusCursor() {
  heroPlusHoverCount = 0;
  heroPlusDragCount = 0;
}

export function isHeroPlusCursorActive() {
  return heroPlusHoverCount > 0 || heroPlusDragCount > 0;
}
