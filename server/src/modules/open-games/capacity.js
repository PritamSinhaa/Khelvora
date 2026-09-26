export function remainingPlaces(capacity, confirmedPlayers, reservations = 0) {
  return Math.max(0, capacity - confirmedPlayers - reservations);
}

export const hasPlace = (capacity, confirmedPlayers, reservations = 0) =>
  remainingPlaces(capacity, confirmedPlayers, reservations) > 0;
