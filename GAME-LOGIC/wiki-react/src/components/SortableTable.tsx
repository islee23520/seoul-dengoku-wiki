import { useState } from 'react'
import { Link } from 'react-router-dom'

interface SortableTableProps {
  headers: string[]
  rows: (string | { text: string; link?: string; badge?: 'power' | 'weak' })[][]
}

type TableCell = SortableTableProps['rows'][number][number]

const cellText = (cell: TableCell | undefined): string =>
  typeof cell === 'string' ? cell : cell?.text ?? ''

export default function SortableTable({ headers, rows }: SortableTableProps) {
  const [sortCol, setSortCol] = useState(-1)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (col: number) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  const sorted = sortCol < 0 ? rows : [...rows].sort((a, b) => {
    const av = cellText(a[sortCol])
    const bv = cellText(b[sortCol])
    return sortDir === 'asc' ? av.localeCompare(bv, 'ko') : bv.localeCompare(av, 'ko')
  })

  const cellContent = (cell: string | { text: string; link?: string; badge?: string }) => {
    if (typeof cell === 'string') return cell
    if (cell.badge) {
      return <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
        cell.badge === 'power' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
      }`}>{cell.text}</span>
    }
    if (cell.link) return <Link to={cell.link} className="font-medium text-accent hover:underline">{cell.text}</Link>
    return cell.text
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-auto rounded border border-gray-200">
      <table className="min-w-[760px] w-full border-collapse bg-white">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={h}
                aria-sort={sortCol === i ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                className={`select-none whitespace-nowrap bg-table-header p-0 text-left text-xs font-semibold uppercase tracking-wide text-white ${
                  sortCol === i ? (sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSort(i)}
                  className="flex w-full items-center px-3 py-2.5 text-left hover:bg-gray-700 focus-visible:bg-gray-700"
                >
                  {h}
                  <span className="ml-1 text-[0.6rem] opacity-60" aria-hidden="true">
                    {sortCol === i ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
                  </span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, ri) => (
            <tr key={ri} className={`border-b border-gray-200 transition-colors hover:bg-orange-50 ${
              ri % 2 === 1 ? 'bg-table-alt' : ''
            }`}>
              {row.map((cell, ci) => (
                <td key={ci} className="whitespace-nowrap px-3 py-2 text-sm">
                  {cellContent(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
