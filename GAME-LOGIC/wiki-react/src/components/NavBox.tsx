import { useState } from 'react'

interface NavBoxProps {
  title: string
  groups: { label: string; links: { label: string; to: string }[] }[]
}

export default function NavBox({ title, groups }: NavBoxProps) {
  const [open, setOpen] = useState(true)
  return (
    <div className="mt-6 overflow-hidden rounded border border-gray-300 bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between bg-infobox-header px-3.5 py-2 text-sm font-bold text-white"
      >
        {title}
        <span className="text-xs opacity-70">{open ? '▼' : '▶'}</span>
      </button>
      {open && (
        <div className="p-3">
          {groups.map(g => (
            <div key={g.label} className="mb-2 last:mb-0">
              <div className="mb-1 text-[0.7rem] font-bold uppercase tracking-wide text-accent-dark">
                {g.label}
              </div>
              <div className="flex flex-wrap gap-1">
                {g.links.map(l => (
                  <a key={l.label} href={l.to}
                    className="rounded border border-gray-200 bg-table-alt px-2.5 py-1 text-xs text-gray-700 transition-colors hover:border-accent hover:bg-accent hover:text-white">
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
