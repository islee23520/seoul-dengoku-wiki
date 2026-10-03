import { Link } from 'react-router-dom'
import { StateFlag } from './StateFlag'
import { ClanCrest } from './ClanCrest'
import { useHeraldryAssets } from '../hooks/useHeraldryAssets'

export type PortraitHeraldryData = {
  readonly id: string
  readonly state: string
  readonly stateName: string
  readonly clan: { readonly id: string; readonly name: string } | null
}

export function PortraitHeraldry({ person }: { readonly person: PortraitHeraldryData }): JSX.Element {
  const { assets } = useHeraldryAssets()
  const identity = assets?.people[person.id] ?? person
  const affiliated = /^S(?:0[1-9]|1[0-6])$/.test(identity.state)
  return <div className="people-portrait-identity" aria-label="현재 소속국가와 가문" data-portrait-heraldry>
    {affiliated && <span data-identity-field="stateFlag"><StateFlag stateId={identity.state} title={`${identity.stateName} 국기`} /></span>}
    {identity.clan ? <Link data-identity-field="clanCrest" to={`/families/${identity.clan.id}`}>
      <ClanCrest clanId={identity.clan.id} title={`${identity.clan.name} 문장`} />
    </Link> : <span data-identity-field="clanUnset">가문 문장 미설정</span>}
  </div>
}
