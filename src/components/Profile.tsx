import { useState } from 'react'

// ─── Icons ────────────────────────────────────────────────────────────────────

const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)

const MailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

const PinIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
)

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  children,
}: {
  icon?: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
        {icon && <span className="text-green-500">{icon}</span>}
        <h3 className="text-gray-900 font-semibold text-[15px]">{title}</h3>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

function SecurityRow({
  label,
  description,
  buttonLabel,
  last = false,
}: {
  label: string
  description: string
  buttonLabel: string
  last?: boolean
}) {
  return (
    <>
      <div className="flex items-center justify-between py-4">
        <div>
          <p className="text-gray-900 text-sm font-medium">{label}</p>
          <p className="text-gray-400 text-xs mt-0.5">{description}</p>
        </div>
        <button className="px-4 py-1.5 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors">
          {buttonLabel}
        </button>
      </div>
      {!last && <hr className="border-gray-100" />}
    </>
  )
}

const inputStyle =
  'w-full bg-gray-100 border-0 text-gray-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-300 transition-all'

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProfilePage() {
  const [firstName, setFirstName] = useState('花子')
  const [lastName, setLastName] = useState('田中')
  const [email] = useState('tanaka.hanako@example.com')
  const [location, setLocation] = useState('東京都渋谷区')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="px-10 py-8 max-w-3xl">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">プロフィール</h1>
          <p className="text-gray-500 text-sm">アカウント情報とセキュリティ設定</p>
        </div>

        <div className="space-y-5">
          {/* User card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div>
                <p className="text-gray-900 text-xl font-bold">{lastName} {firstName}</p>
                <p className="text-gray-500 text-sm mt-0.5">{email}</p>
                <span className="inline-block mt-2 px-3 py-0.5 bg-green-50 border border-green-200 text-green-700 text-xs font-medium rounded-full">
                  プレミアム会員
                </span>
              </div>
            </div>
            <div className="mt-5">
              <button className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
                プロフィール写真を変更
              </button>
            </div>
          </div>

          {/* 個人情報 */}
          <Section title="個人情報">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 font-medium">名</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 font-medium">姓</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">メールアドレス</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <MailIcon />
                  </span>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className={`${inputStyle} pl-9 text-gray-400 cursor-default`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">主な活動地域</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <PinIcon />
                  </span>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={`${inputStyle} pl-9`}
                  />
                </div>
              </div>

              <div className="pt-1">
                <button
                  onClick={handleSave}
                  className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                >
                  {saved ? '保存しました ✓' : '変更を保存'}
                </button>
              </div>
            </div>
          </Section>

          {/* アカウント統計 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-gray-900 font-semibold text-[15px] mb-5">アカウント統計</h3>
            <div className="grid grid-cols-4 gap-4 mb-5">
              {[
                { value: '12', label: '保存ビュー' },
                { value: '48', label: 'ルート検索' },
                { value: '156', label: 'ログイン日数' },
                { value: '3.2', label: '平均安全スコア' },
              ].map(({ value, label }) => (
                <div key={label} className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-gray-900 text-2xl font-bold tabular-nums">{value}</p>
                  <p className="text-gray-500 text-xs mt-1">{label}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-xs">
              <CalendarIcon />
              <span>アカウント作成日: <span className="text-green-600 font-medium">2025年10月15日</span></span>
            </div>
          </div>

          {/* セキュリティ */}
          <Section icon={<ShieldIcon />} title="セキュリティ">
            <SecurityRow label="パスワード" description="最終更新: 2026年2月10日" buttonLabel="変更" />
            <SecurityRow label="二段階認証" description="セキュリティを強化します" buttonLabel="設定" />
            <SecurityRow label="ログインセッション" description="3つのデバイスでログイン中" buttonLabel="管理" last />
          </Section>

          {/* 危険な操作 */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <h3 className="text-red-700 font-semibold text-[15px] mb-4">危険な操作</h3>
            <button className="w-full flex items-center justify-center gap-2.5 py-3 border border-red-200 text-red-600 text-sm font-medium rounded-xl hover:bg-red-100 transition-colors">
              <LogoutIcon />
              すべてのデバイスからログアウト
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
