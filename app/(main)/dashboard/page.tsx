'use client'
// app/dashboard/page.tsx (V3 - แดชบอร์ดสถิติแพลตฟอร์ม เพิ่มระบบรวมสถิติเพศและการทำหมันสัตว์เลี้ยงสมบูรณ์ 100%)

import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { Loader2, PawPrint, CheckCircle, Users, Share, MessageCircle, Heart, ShieldAlert } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. ดึงข้อมูลทั้งหมดจากตารางหลัก (🟢 เพิ่มการดึงคอลัมน์ gender และ is_sterilized ออกมาร่วมประมวลผล)
        const [
          { data: pets },
          { data: profiles },
          { data: chats }
        ] = await Promise.all([
          supabase.from('pets').select('id, status, species, province, gender, is_sterilized, is_resolved, created_at'),
          supabase.from('profiles').select('id, occupation, interests, created_at'),
          supabase.from('pet_chat_histories').select('id, role, text, created_at')
        ])

        // 2. ประมวลผลข้อมูล (Aggregation)
        const totalPets = pets?.length || 0
        const resolvedPets = pets?.filter(p => p.is_resolved).length || 0
        const totalUsers = profiles?.length || 0
        const totalChats = chats?.length || 0

        // - สัดส่วนประกาศ
        const lostCount = pets?.filter(p => p.status === 'lost').length || 0
        const foundCount = pets?.filter(p => p.status === 'found').length || 0
        const adoptionCount = pets?.filter(p => p.status === 'adoption').length || 0

        // ── 🟢 [ฟังก์ชันเพิ่มใหม่] ประมวลผลสถิติเพศและการทำหมันของสัตว์เลี้ยงในระบบ ──
        const maleCount = pets?.filter(p => p.gender === 'male').length || 0
        const femaleCount = pets?.filter(p => p.gender === 'female').length || 0
        const unknownGenderCount = pets?.filter(p => !p.gender || p.gender === 'unknown').length || 0
        
        const sterilizedCount = pets?.filter(p => p.is_sterilized === true).length || 0
        const nonSterilizedCount = totalPets - sterilizedCount

        // - นับจำนวนสัตว์ Top 6 
        const petTypeCount = pets?.reduce((acc: any, curr) => {
          const type = curr.species || 'อื่นๆ'
          acc[type] = (acc[type] || 0) + 1
          return acc
        }, {})
        const topPetsList = Object.entries(petTypeCount || {}).sort((a: any, b: any) => b[1] - a[1]).slice(0, 6)

        // - นับจำนวนจังหวัด Top 6
        const provinceCount = pets?.reduce((acc: any, curr) => {
          const prov = curr.province || 'ไม่ระบุ'
          acc[prov] = (acc[prov] || 0) + 1
          return acc
        }, {})
        const topProvincesList = Object.entries(provinceCount || {}).sort((a: any, b: any) => b[1] - a[1]).slice(0, 6)

        // - ข้อมูลสัดส่วนข้อความในฐานข้อมูล
        const userCount = chats?.filter(c => c.role === 'user').length || 0
        const botCount  = chats?.filter(c => c.role === 'bot').length || 0

        // ความสนใจ และ อาชีพ
        const interestsCount: Record<string, number> = {}
        const occupationCount: Record<string, number> = {}
        profiles?.forEach(p => {
          if (p.occupation) occupationCount[p.occupation] = (occupationCount[p.occupation] || 0) + 1
          if (p.interests && Array.isArray(p.interests)) {
            p.interests.forEach((i: string) => interestsCount[i] = (interestsCount[i] || 0) + 1)
          }
        })
        const topInterests = Object.entries(interestsCount).sort((a: any, b: any) => b[1] - a[1]).slice(0, 6)
        const topOccupations = Object.entries(occupationCount).sort((a: any, b: any) => b[1] - a[1]).slice(0, 6)

        // - รวมกิจกรรมล่าสุด (Recent Activity)
        const allActivities = [
          ...(pets?.map(p => ({ type: 'pet', text: `ลงประกาศช่วยน้อง ${p.species || 'สัตว์เลี้ยง'}`, time: p.created_at, color: '#3266ad' })) || []),
          ...(profiles?.map(p => ({ type: 'user', text: `คนรักสัตว์ลงทะเบียนผู้ใช้ใหม่`, time: p.created_at, color: '#EF9F27' })) || []),
          ...(chats?.map(c => ({ type: 'chat', text: `ทักคุยปรึกษาลักกี้บอทผ่านช่องแชท`, time: c.created_at, color: '#1D9E75' })) || [])
        ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 7)

        setStats({
          totalPets, resolvedPets, totalUsers, totalChats,
          statusData: [lostCount, foundCount, adoptionCount],
          genderData: [maleCount, femaleCount, unknownGenderCount], // ส่งต่อค่าสถิติเพศ
          sterilizedStats: { sterilizedCount, nonSterilizedCount },  // ส่งต่อค่าสถิติทําหมัน
          topPetsList, topProvincesList,
          charData: [userCount, botCount, totalChats],
          topInterests, topOccupations,
          activities: allActivities
        })

      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-ori-orange" size={48} />
    </div>
  )

  const statusChartData = {
    labels: ['สัตว์หาย', 'พบสัตว์', 'หาบ้าน'],
    datasets: [{ data: stats.statusData, backgroundColor: ['#3266ad', '#1D9E75', '#EF9F27'], borderWidth: 2, borderColor: '#fff' }]
  }

  const charChartData = {
    labels: ['คำถามผู้ใช้', 'คำตอบบอท', 'ยอดรวมรวม'],
    datasets: [{ data: stats.charData, backgroundColor: ['#FF9F66', '#FFCC00', '#A0522D'], borderWidth: 2, borderColor: '#fff' }]
  }

  // ── 🟢 ข้อมูล Chart สถิติเพศของน้องๆ ในระบบ ──
  const genderChartData = {
    labels: ['เพศผู้ ♂', 'เพศเมีย ♀', 'ไม่ระบุ ❓'],
    datasets: [{ data: stats.genderData, backgroundColor: ['#2196F3', '#E91E63', '#9E9E9E'], borderWidth: 2, borderColor: '#fff' }]
  }

  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '65%' }

  const ProgressBar = ({ label, value, max, color }: { label: string, value: number, max: number, color: string }) => {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0
    return (
      <div className="flex items-center gap-2 mb-2 text-xs">
        <span className="w-24 text-gray-500 text-right truncate flex-shrink-0">{label}</span>
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
        <span className="w-10 text-gray-500 text-right">{value}</span>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen font-sans text-black">
      <div>
        <h2 className="text-xs font-medium text-gray-500 text-left uppercase tracking-wider mb-3">ภาพรวมแพลตฟอร์มพบเพ็ต</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MetricCard icon={<PawPrint size={16}/>} title="ประกาศทั้งหมด" value={stats.totalPets} sub="ข้อมูลล่าสุด" />
          <MetricCard icon={<CheckCircle size={16}/>} title="พบสัตว์สำเร็จ" value={stats.resolvedPets} sub={`Success rate ${stats.totalPets ? ((stats.resolvedPets/stats.totalPets)*100).toFixed(1) : 0}%`} />
          <MetricCard icon={<Users size={16}/>} title="ผู้ใช้งานทั้งหมด" value={stats.totalUsers} sub="ลงทะเบียนแล้ว" />
          <MetricCard icon={<Share size={16}/>} title="แชร์ทั้งหมด" value="-" sub="รอเชื่อม API" />
          <MetricCard icon={<MessageCircle size={16}/>} title="Chatbot สนทนา" value={stats.totalChats} sub="ข้อความในระบบ" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* กราฟสัดส่วนประกาศ */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-xs font-medium text-gray-500 text-left uppercase tracking-wider mb-2">ประกาศตามประเภท</h2>
          <div className="flex flex-wrap gap-3 mb-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#3266ad]"/> สัตว์หาย</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#1D9E75]"/> พบสัตว์</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#EF9F27]"/> หาบ้าน</span>
          </div>
          <div className="h-[180px] relative">
            <Doughnut data={statusChartData} options={chartOptions} />
          </div>
        </div>

        {/* ── 🟢 กราฟแสดงสัดส่วนเพศสัตว์เลี้ยงที่เพิ่มเข้ามาใหม่ ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-xs font-medium text-gray-500 text-left uppercase tracking-wider mb-2">สัดส่วนเพศสัตว์เลี้ยง</h2>
          <div className="flex flex-wrap gap-3 mb-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#2196F3]"/> เพศผู้</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#E91E63]"/> เพศเมีย</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#9E9E9E]"/> ไม่ระบุ</span>
          </div>
          <div className="h-[180px] relative">
            <Doughnut data={genderChartData} options={chartOptions} />
          </div>
        </div>

        {/* กิจกรรมล่าสุด Real-time */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-xs font-medium text-gray-500 text-left uppercase tracking-wider mb-4">กิจกรรมล่าสุด (Real-time)</h2>
          <div className="space-y-3">
            {stats.activities.map((act: any, i: number) => (
              <div key={i} className="flex items-center gap-3 py-1 border-b border-gray-50 last:border-0 text-sm">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: act.color }} />
                <span className="flex-1 font-medium text-gray-800 text-left truncate">{act.text}</span>
                <span className="text-xs text-gray-400 shrink-0">
                  {formatDistanceToNow(new Date(act.time), { addSuffix: true, locale: th })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* สถิติสายพันธุ์สูงสุด */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-xs font-medium text-gray-500 text-left uppercase tracking-wider mb-4">ประเภทสัตว์ที่มีประกาศสูงสุด</h2>
          {stats.topPetsList.map(([name, count]: any) => (
            <ProgressBar key={name} label={name} value={count} max={stats.topPetsList[0]?.[1] || 1} color="#3266ad" />
          ))}
        </div>

        {/* สถิติจังหวัดสูงสุด */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-xs font-medium text-gray-500 text-left uppercase tracking-wider mb-4">จังหวัดที่มีประกาศสูงสุด</h2>
          {stats.topProvincesList.map(([name, count]: any) => (
            <ProgressBar key={name} label={name} value={count} max={stats.topProvincesList[0]?.[1] || 1} color="#1D9E75" />
          ))}
        </div>

        {/* ── 🟢 แผง ProgressBar แสดงเปอร์เซ็นต์สถิติการทำหมันสัตว์เลี้ยงในระบบ ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-xs font-medium text-gray-500 text-left uppercase tracking-wider mb-4">สถิติการควบคุมประชากร (ทำหมัน)</h2>
          <div className="space-y-4 pt-2">
            <ProgressBar 
              label="🩺 ทำหมันแล้ว" 
              value={stats.sterilizedStats.sterilizedCount} 
              max={stats.totalPets || 1} 
              color="#4CAF50" 
            />
            <ProgressBar 
              label="❌ ยังไม่ทำหมัน" 
              value={stats.sterilizedStats.nonSterilizedCount} 
              max={stats.totalPets || 1} 
              color="#F44336" 
            />
            <div className="p-3 bg-green-50 rounded-xl border border-green-200 text-xs font-bold text-green-800 text-left mt-2">
              💡 สัตว์เลี้ยงทำหมันแล้วรวมคิดเป็น {stats.totalPets ? ((stats.sterilizedStats.sterilizedCount / stats.totalPets) * 100).toFixed(1) : 0}% ของทั้งระบบ
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* สัดส่วนข้อความบอท */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-xs font-medium text-gray-500 text-left uppercase tracking-wider mb-2">สัดส่วนข้อความผ่านแชตบอต</h2>
          <div className="flex flex-wrap gap-3 mb-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#FF9F66]"/> คำถามผู้ใช้</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#FFCC00]"/> คำตอบบอท</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#A0522D]"/> ยอดรวม</span>
          </div>
          <div className="h-[150px] relative">
            <Doughnut data={charChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ icon, title, value, sub }: any) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col text-left">
      <div className="text-gray-500 text-xs mb-1.5 flex items-center gap-1.5 font-medium">{icon} {title}</div>
      <div className="text-2xl font-bold text-gray-900 leading-none">{value}</div>
      <div className="text-[10px] text-gray-400 mt-2">{sub}</div>
    </div>
  )
}