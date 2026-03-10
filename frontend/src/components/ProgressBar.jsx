/**
 * Полоска прогресса с процентом
 */
export default function ProgressBar({ percent, label, size = 'md' }) {
  const height = size === 'sm' ? 'h-1.5' : 'h-3'
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  const color =
    percent >= 75 ? 'bg-green-500' :
    percent >= 40 ? 'bg-yellow-500' :
    'bg-red-500'

  return (
    <div className="w-full">
      {label && (
        <div className={`flex justify-between mb-1 ${textSize}`}>
          <span className="text-gray-500">{label}</span>
          <span className="font-semibold">{percent}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${height} overflow-hidden`}>
        <div
          className={`${height} rounded-full ${color} transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
