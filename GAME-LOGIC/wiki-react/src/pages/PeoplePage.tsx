import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { peopleCatalog } from '../generated/peopleCatalog'

const koreanNameOrder = new Intl.Collator('ko-KR', { usage: 'sort', sensitivity: 'variant' })
const peopleByName = [...peopleCatalog].sort((left, right) => koreanNameOrder.compare(left.name, right.name) || left.id.localeCompare(right.id))

export default function PeoplePage() {
  const [query, setQuery] = useState('')
  const [state, setState] = useState('all')
  const [commonTier, setCommonTier] = useState('all')
  const [occupation, setOccupation] = useState('all')
  const [gender, setGender] = useState('all')
  const options = useMemo(() => {
    const values = (key: 'stateName' | 'occupation' | 'gender') => [...new Set(peopleByName.map((person) => person[key] || '미등록'))].sort(koreanNameOrder.compare)
    return { states: values('stateName'), tiers: ['T1', 'T2', 'T3', 'T4', 'T5'], occupations: values('occupation'), genders: values('gender') }
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

  const resetFilters = () => { setQuery(''); setState('all'); setCommonTier('all'); setOccupation('all'); setGender('all') }

  return (
    <article className="wiki-article" data-wiki-shell="react-official">
      <header className="wiki-article-header">
        <div><p className="wiki-domain-label">서울:전국 공식 위키 · 인물</p><h1>등장인물 전체</h1></div>
        <span className="wiki-canon-badge">{peopleCatalog.length}명</span>
      </header>
      <label className="people-search">
        <span>이름·직위·국가 검색</span>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="예: 윤서린, 급수, S4" />
      </label>
      <div className="people-filters" aria-label="등장인물 필터">
        <label>국가<select value={state} onChange={(event) => setState(event.target.value)}><option value="all">전체</option>{options.states.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>직급(공통 티어)<select value={commonTier} onChange={(event) => setCommonTier(event.target.value)}><option value="all">전체</option>{options.tiers.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>직업<select value={occupation} onChange={(event) => setOccupation(event.target.value)}><option value="all">전체</option>{options.occupations.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>성별<select value={gender} onChange={(event) => setGender(event.target.value)}><option value="all">전체</option>{options.genders.map((value) => <option key={value}>{value}</option>)}</select></label>
        <button type="button" onClick={resetFilters}>필터 초기화</button>
      </div>
      <p className="wiki-domain-label" aria-live="polite">검색 결과 {filtered.length}명</p>
      <div className="wiki-table-wrap">
        <table className="people-table">
          <thead><tr><th>이름</th><th>국가</th><th>직위</th><th>직급</th><th>직업</th><th>성별</th></tr></thead>
          <tbody>{filtered.map((person) => (
            <tr key={person.id}>
              <td><Link to={person.detailRoute}>{person.name}</Link></td><td>{person.stateName || '무소속'}</td><td>{person.position}</td><td>{person.commonTier}</td><td>{person.occupation}</td><td>{person.gender}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </article>
  )
}
