export function StateFlag({ stateId, title }: { stateId: string; title?: string }) {
  const normalizedId = /^S(?:0[1-9]|1[0-6])$/u.test(stateId) ? stateId : 'S01'
  return <img className="state-flag" src={`${import.meta.env.BASE_URL}state-flags/${normalizedId}.webp`} alt={title ?? ''} loading="lazy" decoding="async" />
}
