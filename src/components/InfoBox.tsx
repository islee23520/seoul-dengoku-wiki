interface InfoBoxProps {
  title: string
  rows: { label: string; value: string; link?: string; badge?: 'power' | 'weak' }[]
}

export default function InfoBox({ title, rows }: InfoBoxProps) {
  return (
    <aside className="mb-4 w-full overflow-hidden rounded border border-infobox-border bg-white lg:ml-5 lg:w-[280px] lg:flex-none">
      <div className="bg-infobox-header px-3.5 py-2.5 text-center text-sm font-bold text-white">
        {title}
      </div>
      {rows.map((row) => (
        <div key={row.label} className="flex border-b border-gray-200 last:border-b-0">
          <div className="w-[40%] bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-500">
            {row.label}
          </div>
          <div className="flex-1 px-2.5 py-1.5 text-sm">
            {row.link ? (
              <a href={row.link} className="text-accent hover:underline">{row.value}</a>
            ) : row.badge ? (
              <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                row.badge === 'power' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
              }`}>
                {row.value}
              </span>
            ) : (
              row.value
            )}
          </div>
        </div>
      ))}
    </aside>
  )
}
