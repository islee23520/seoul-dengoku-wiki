export function viewDirection(view) {
  return {
    front: 'Exact frontal view. Both shoulders symmetric, face and chest toward the camera.',
    profile: 'Exact 90-degree side profile. One eye and one ear visible, nose in silhouette. Shoulders and hips overlap in projection. No three-quarter view or visible full chest.',
    side: 'Single three-quarter oblique view. Preserve anatomical placement of front and back costume details.',
    back: 'Exact rear view. Face and chest invisible. Front-mounted radio, chest buckles, pockets and front collar opening must not be copied onto the back. Draw only the rear surfaces of the same outfit; no invented rear equipment.',
  }[view] ?? '';
}
