export default function Card({ title, subtitle, children, footer, className = '' }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="flex-1 p-5">{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">{footer}</div>
      )}
    </div>
  )
}
