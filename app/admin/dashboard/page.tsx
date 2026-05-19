'use client'

import React, { useEffect, useState } from 'react'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import { PawPrint, Check, Users, Share2, MessageCircle } from 'lucide-react'

// ลงทะเบียน Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)

  // TODO: สร้างฟังก์ชัน fetch ข้อมูลจริงจาก Supabase ที่นี่
  useEffect(() => {
    // จำลองการโหลดข้อมูล
    setTimeout(() => setLoading(false), 1000)
  }, [])

  // ─── ข้อมูลสำหรับกราฟ (Doughnut) ───
  const statusChartData = {
    labels: ['สัตว์หาย', 'พบสัตว์', 'หาบ้าน'],
    datasets: [{
      data: [62, 24, 14],
      backgroundColor: ['#3266ad', '#1D9E75', '#EF9F27'],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  }

  // ─── ข้อมูลสำหรับกราฟ (Bar) ───
  const monthlyChartData = {
    labels: ['ธ.ค.', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.'],
    datasets: [
      { label: 'สัตว์หาย', data: [142, 158, 171, 189, 204, 218], backgroundColor: '#3266ad', borderRadius: 4 },
      { label: 'พบสัตว์', data: [54, 61, 67, 74, 82, 91], backgroundColor: '#1D9E75', borderRadius: 4 },
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } }
  }

  if (loading) return <div className="p-8 text-center font-bold">กำลังโหลดข้อมูล Dashboard...</div>

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen font-sans">
      <h1 className="text-2xl font-black text-gray-800 border-b-2 border-gray-200 pb-4">PobPet Analytics Dashboard</h1>

      {/* ── Metric Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { icon: PawPrint, label: 'ประกาศทั้งหมด', val: '1,284', sub: '+12% จากเดือนที่แล้ว', subColor: 'text-green-600' },
          { icon: Check, label: 'พบสัตว์สำเร็จ', val: '387', sub: 'Success rate 30.1%', subColor: 'text-gray-500' },
          { icon: Users, label: 'ผู้ใช้งานทั้งหมด', val: '2,941', sub: '+8% จากเดือนที่แล้ว', subColor: 'text-green-600' },
          { icon: Share2, label: 'แชร์ทั้งหมด', val: '8,630', sub: 'เฉลี่ย 6.7 ครั้ง/ประกาศ', subColor: 'text-gray-500' },
          { icon: MessageCircle, label: 'Chatbot สนทนา', val: '4,218', sub: 'เฉลี่ย 143 ครั้ง/วัน', subColor: 'text-gray-500' },
        ].map((m, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-xs font-bold text-gray-500 flex items-center gap-2 mb-2">
              <m.icon size={14} /> {m.label}
            </div>
            <div className="text-2xl font-black text-gray-800">{m.val}</div>
            <div className={`text-xs mt-1 ${m.subColor}`}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Charts Row 1 ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* กราฟโดนัท */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">ประกาศตามประเภท</div>
          <div className="flex gap-4 text-xs text-gray-600 mb-4">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-[#3266ad]"></div>สัตว์หาย 62%</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-[#1D9E75]"></div>พบสัตว์ 24%</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-[#EF9F27]"></div>หาบ้าน 14%</span>
          </div>
          <div className="h-48 relative">
            <Doughnut data={statusChartData} options={{ ...chartOptions, cutout: '68%' }} />
          </div>
        </div>

        {/* กราฟแท่ง */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">ประกาศรายเดือน (6 เดือน)</div>
          <div className="h-56 relative">
            <Bar data={monthlyChartData} options={chartOptions} />
          </div>
        </div>
      </div>
      
      {/* หมายเหตุ: สำหรับส่วน Progress Bar (ประเภทสัตว์, จังหวัด, อาชีพ) 
        สามารถแปลงเป็น HTML Element ธรรมดาที่ผูกค่าความกว้าง (width) ด้วย Inline Style ได้เลยครับ
      */}
    </div>
  )
}