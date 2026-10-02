import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { peopleCatalog } from '../generated/peopleCatalog'
import { portraitIdentities } from '../generated/portraitIdentities'

const koreanNameOrder = new Intl.Collator('ko-KR', { usage: 'sort', sensitivity: 'variant' })
const peopleByName = [...peopleCatalog].sort((left, right) => koreanNameOrder.compare(left.name, right.name) || left.id.localeCompare(right.id))

const filterSessionKey = 'wiki.people.filters.v1'
const commonTiers = ['T1', 'T2', 'T3', 'T4', 'T5']
const defaultFilters = { query: '', state: 'all', commonTier: 'all', occupation: 'all', gender: 'all' }

function readSessionFilters() {
  try {
    const saved = window.sessionStorage.getItem(filterSessionKey)
    if (!saved) return defaultFilters
    const parsed: unknown = JSON.parse(saved)
    if (!parsed || typeof parsed !== 'object') throw new Error('Invalid People filter session')
    const fields = parsed as Record<string, unknown>
    if (!Object.keys(defaultFilters).every((key) => typeof fields[key] === 'string')) throw new Error('Invalid People filter fields')
    const choice = (field: 'state' | 'occupation' | 'gender', catalogField: 'stateName' | 'occupation' | 'gender') =>
      fields[field] === 'all' || peopleByName.some((person) => (person[catalogField] || '미등록') === fields[field]) ? fields[field] as string : 'all'
    return {
      query: fields.query as string,
      state: choice('state', 'stateName'),
      commonTier: fields.commonTier === 'all' || commonTiers.includes(fields.commonTier as string) ? fields.commonTier as string : 'all',
      occupation: choice('occupation', 'occupation'),
      gender: choice('gender', 'gender'),
    }
  } catch {
    console.warn('People filter session could not be restored')
    return defaultFilters
  }
}

export default function PeoplePage() {
  const [filters, setFilters] = useState(readSessionFilters)
  const { query, state, commonTier, occupation, gender } = filters
  const setFilter = (field: keyof typeof defaultFilters, value: string) => setFilters((current) => ({ ...current, [field]: value }))
  useEffect(() => {
    try {
      if (Object.keys(defaultFilters).every((key) => filters[key as keyof typeof defaultFilters] === defaultFilters[key as keyof typeof defaultFilters])) {
        window.sessionStorage.removeItem(filterSessionKey)
      } else {
        window.sessionStorage.setItem(filterSessionKey, JSON.stringify(filters))
      }
    } catch {
      console.warn('People filter session could not be saved')
    }
  }, [filters])
  const options = useMemo(() => {
    const values = (key: 'stateName' | 'occupation' | 'gender') => [...new Set(peopleByName.map((person) => person[key] || '미등록'))].sort(koreanNameOrder.compare)
    return { states: values('stateName'), tiers: commonTiers, occupations: values('occupation'), genders: values('gender') }
  }, [])
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('ko')
    return peopleByName.filter((person) => {
      if (needle && !`${person.name} ${person.position} ${person.rank} ${person.occupation} ${person.gender} ${person.stateName} ${person.stage}`.toLocaleLowerCase('ko').includes(needle)) return false
      return (state === 'all' || person.stateName === state)
        && (commonTier === 'all' || person.commonTier === commonTier)
        && (occupation === 'all' || person.occupation === occupation)
        && (gender === 'all' || person.gender === gender)
    })
  }, [query, state, commonTier, occupation, gender])

  const resetFilters = () => setFilters(defaultFilters)

  return (
    <article className="wiki-article" data-wiki-shell="react-official">
      <header className="wiki-article-header">
        <div><p className="wiki-domain-label">서울:전국 공식 위키 · 인물</p><h1>등장인물 전체</h1></div>
        <span className="wiki-canon-badge">{peopleCatalog.length}명</span>
      </header>
      <p>이 원장의 1,019명은 모두 영웅 인물이다. 각 인물은 생업과 경력에 따라 전투·지원·치유·정보 활동에서 서로 다른 클래스와 특성을 갖는다. 다만 전투 클래스 이름과 개인별 배정은 아직 확정되지 않았으며, 제안 단계 분류를 인물 카드에 자동으로 붙이지 않는다.</p>
      <p><Link to="/people/draft">인물 시트 초안 만들기</Link> · 정본에 바로 반영되지 않는 검토용 편집기</p>
      <p><Link to="/tools/character-art">인물 아트 작업 도구 열기</Link></p>
      <label className="people-search">
        <span>이름·직위·국가 검색</span>
        <input type="search" value={query} onChange={(event) => setFilter('query', event.target.value)} placeholder="예: 윤서린, 급수, S4" />
      </label>
      <div className="people-filters" aria-label="등장인물 필터">
        <label>국가<select value={state} onChange={(event) => setFilter('state', event.target.value)}><option value="all">전체</option>{options.states.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>직급(공통 티어)<select value={commonTier} onChange={(event) => setFilter('commonTier', event.target.value)}><option value="all">전체</option>{options.tiers.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>직업<select value={occupation} onChange={(event) => setFilter('occupation', event.target.value)}><option value="all">전체</option>{options.occupations.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>성별<select value={gender} onChange={(event) => setFilter('gender', event.target.value)}><option value="all">전체</option>{options.genders.map((value) => <option key={value}>{value}</option>)}</select></label>
        <button type="button" onClick={resetFilters}>필터 초기화</button>
      </div>
      <p className="wiki-domain-label" aria-live="polite">검색 결과 {filtered.length}명</p>
      <div className="wiki-table-wrap">
        <table className="people-table">
          <colgroup>
            <col className="people-col-name" />
            <col className="people-col-state" />
            <col className="people-col-position" />
            <col className="people-col-tier" />
            <col className="people-col-rank" />
            <col className="people-col-occupation" />
            <col className="people-col-gender" />
          </colgroup>
          <thead><tr><th scope="col">이름</th><th scope="col">국가</th><th scope="col">직위</th><th scope="col">공통 티어</th><th scope="col">국가별 직급</th><th scope="col">직업</th><th scope="col">성별</th></tr></thead>
          <tbody>{filtered.map((person) => (
            <tr key={person.id} data-person-id={person.id}>
              <td data-label="이름"><Link to={person.detailRoute}>{person.name}</Link>{portraitIdentities.filter((portrait) => portrait.personId === person.id).map((portrait) => <figure key={portrait.personId} className="people-row-portrait">
                <Link to={person.detailRoute}><img src={`${import.meta.env.BASE_URL}portraits/${person.id}.png?v=${portrait.imageSha256}`} alt={`${person.name} 초상 아트 제안`} loading="lazy" /></Link>
                <figcaption className="people-portrait-identity">
                  {portrait.stateFlag && <img data-identity-field="stateFlag" src={`${import.meta.env.BASE_URL}${portrait.stateFlag}`} alt="" />}
                  <span data-identity-field="stateName">{portrait.stateName}</span>
                  {portrait.clanCrest && <Link data-identity-field="clanCrest" to={`/families/${portrait.clanId}`}><img src={`${import.meta.env.BASE_URL}${portrait.clanCrest}`} alt="가문 문장" /></Link>}
                  {portrait.bongwan && <span data-identity-field="bongwan">{portrait.bongwan}</span>}
                  {portrait.nobleTitle && <span data-identity-field="nobleTitle">{portrait.nobleTitle}</span>}
                </figcaption>
              </figure>)}</td><td data-label="국가">{person.stateName || '무소속'}</td><td data-label="직위">{person.position}</td><td data-label="공통 티어">{person.commonTier}</td><td data-label="국가별 직급">{person.rank === '미등록' ? '—' : person.rank}</td><td data-label="직업">{person.occupation}</td><td data-label="성별">{person.gender}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </article>
  )
}
