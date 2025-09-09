interface DashboardStatsProps {
  totalGames: number
  pendingApplications: number
  upcomingMatches: number
}

export default function DashboardStats({ 
  totalGames, 
  pendingApplications, 
  upcomingMatches 
}: DashboardStatsProps) {
  const stats = [
    {
      label: '作成した試合',
      value: totalGames,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: '承認待ち申請',
      value: pendingApplications,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      label: '予定試合',
      value: upcomingMatches,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {stats.map((stat, index) => (
        <div 
          key={index}
          className={`${stat.bgColor} rounded-lg p-6 text-center`}
        >
          <div className={`${stat.color} text-3xl font-bold mb-2`}>
            {stat.value}
          </div>
          <div className="text-gray-600 font-medium">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  )
}