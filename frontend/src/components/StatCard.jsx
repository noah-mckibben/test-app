const palette = {
  blue:   { bar: 'from-blue-500 to-blue-600',    icon: 'bg-blue-50 text-blue-600'   },
  green:  { bar: 'from-green-500 to-green-600',   icon: 'bg-green-50 text-green-600' },
  orange: { bar: 'from-orange-400 to-orange-500', icon: 'bg-orange-50 text-orange-500' },
  purple: { bar: 'from-purple-500 to-purple-600', icon: 'bg-purple-50 text-purple-600' },
  red:    { bar: 'from-red-500 to-red-600',       icon: 'bg-red-50 text-red-600'     },
}

export default function StatCard({ title, value, subtitle, icon, color = 'blue' }) {
  const c = palette[color] || palette.blue
  return (
    <div className="card-hover bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className={`h-1 bg-gradient-to-r ${c.bar}`} />
      <div className="p-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1 leading-none">{value ?? '—'}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1.5">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${c.icon}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
