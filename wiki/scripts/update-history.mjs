export const latestUpdates = (updates, limit = 5) => [...updates]
  .sort((left, right) => right.date.localeCompare(left.date) || right.sequence - left.sequence || left.title.localeCompare(right.title, 'ko'))
  .slice(0, limit)
