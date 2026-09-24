export function StateFlag({ stateId, title }: { stateId: string; title?: string }) {
  const normalizedId = /^S(?:0[1-9]|1[0-6])$/u.test(stateId) ? stateId : 'S01'
  return <img className="state-flag" src={`${import.meta.env.BASE_URL}state-flags/${normalizedId}.webp?v=20260920-1`} alt={title ?? ''} loading="lazy" decoding="async" onError={(event) => { event.currentTarget.style.display = 'none' }} />
}
