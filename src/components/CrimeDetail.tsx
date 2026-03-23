import type { CrimeRecord } from '../types/crime'

interface Props {
  crime: CrimeRecord
  onClose: () => void
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '不明'
  const d = new Date(dateStr)
  return d.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function CrimeDetail({ crime, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-blue-500/30 rounded-2xl shadow-2xl w-full max-w-md text-white overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">
              {crime.offense}
            </h2>
            <p className="text-blue-300 text-sm mt-0.5">{crime.offense_parent_group}</p>
          </div>
          <button
            onClick={onClose}
            className="text-blue-300 hover:text-white transition-colors text-2xl leading-none ml-4"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <DetailRow label="発生日時" value={formatDate(crime.offense_start_datetime)} />
          <DetailRow label="報告日時" value={formatDate(crime.report_datetime)} />
          <DetailRow label="住所" value={crime._100_block_address || '不明'} />
          <DetailRow label="地区 / セクター / ビート" value={`${crime.precinct} / ${crime.sector} / ${crime.beat}`} />
          <DetailRow label="エリア (MCPP)" value={crime.mcpp || '不明'} />
          <DetailRow label="被害カテゴリ" value={crime.crime_against_category || '不明'} />
          <DetailRow label="グループ分類" value={crime.group_a_b || '不明'} />
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-blue-400 uppercase tracking-wider">{label}</span>
      <span className="text-sm text-white">{value}</span>
    </div>
  )
}
