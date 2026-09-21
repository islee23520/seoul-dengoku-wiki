export function fitDistance({ width, height, depth, verticalFovRadians, aspect, padding = 1.15 }) {
  const safeAspect = Math.max(aspect, 0.01);
  const fitHeight = Math.max(height, width / safeAspect);
  return fitHeight / (2 * Math.tan(verticalFovRadians / 2)) * padding + depth * 0.5;
}
