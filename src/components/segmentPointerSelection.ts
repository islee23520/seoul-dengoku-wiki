type Point = { readonly x: number; readonly y: number }
type HitSegment = { readonly id: string; readonly a: Point; readonly b: Point; readonly strokeWidth: number }

export const segmentPointerChoices = (point: Point, segments: readonly HitSegment[]) => segments.filter(({ a, b, strokeWidth }) => {
  const dx = b.x - a.x, dy = b.y - a.y
  const lengthSquared = dx * dx + dy * dy
  const fraction = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared))
  return Math.hypot(point.x - a.x - fraction * dx, point.y - a.y - fraction * dy) <= strokeWidth / 2
}).map(({ id }) => id)
