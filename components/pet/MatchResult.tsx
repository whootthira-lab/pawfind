'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, BookmarkCheck, Loader2, MapPin } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

interface PetResult {
  id: string;
  name: string;
  breed: string;
  province: string;
  image_url: string;
  status: string;
  match_percentage?: number;
}

export function MatchResultCard({ result }: { result: PetResult }) {
  const router = useRouter();
  const [isPinned, setIsPinned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingInitial, setIsCheckingInitial] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // เรียกใช้ Supabase Browser Client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. เช็ค Auth และสถานะการ Pin เมื่อโหลดการ์ด
  useEffect(() => {
    const checkPinStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUserId(session.user.id);
        
        const { data } = await supabase
          .from('saved_pets')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('pet_id', result.id)
          .single();

        if (data) {
          setIsPinned(true);
        }
      }
      setIsCheckingInitial(false);
    };

    checkPinStatus();
  }, [supabase, result.id]);

  // 2. Handle การกดปุ่ม Pin
  const handleTogglePin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 💡 ถ้ายังไม่ล็อกอิน ให้แจ้งเตือนและเด้งไปหน้า Login
    if (!userId) {
      alert('กรุณาเข้าสู่ระบบเพื่อบันทึกข้อมูลครับ');
      router.push('/login'); 
      return;
    }

    setIsLoading(true);

    try {
      if (isPinned) {
        // ยกเลิกการ Pin
        const res = await fetch(`/api/saved-pets?petId=${result.id}`, {
          method: 'DELETE',
        });

        if (!res.ok) throw new Error('Failed to unpin');
        setIsPinned(false);
      } else {
        // บันทึกข้อมูล
        const res = await fetch('/api/saved-pets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ petId: result.id }),
        });

        if (!res.ok) throw new Error('Failed to pin');
        setIsPinned(true);
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  const formatSrc = (src: string) => 
    src?.startsWith('http') ? src : `data:image/jpeg;base64,${src}`;

  const statusColor = result.status === 'lost' 
    ? 'bg-wagashi-sakura' 
    : result.status === 'found'
    ? 'bg-wagashi-sora'   
    : 'bg-wagashi-matcha';

  return (
    <div className="relative border-2 border-black rounded-xl shadow-paper-sm overflow-hidden bg-white group hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
      
      {/* 📌 ปุ่ม Pin */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleTogglePin}
        disabled={isLoading || isCheckingInitial}
        className={`absolute top-3 right-3 z-20 p-2 rounded-lg border-2 border-black shadow-paper-sm transition-colors flex items-center justify-center
          ${isCheckingInitial ? 'bg-gray-100 opacity-50' : ''}
          ${isPinned 
            ? 'bg-wagashi-kinako hover:bg-yellow-400' 
            : 'bg-white hover:bg-gray-100'
          }`}
        title={isPinned ? 'ยกเลิกการบันทึก' : 'บันทึกไว้นัดเจอ'}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-black" />
        ) : isPinned ? (
          <BookmarkCheck className="w-5 h-5 text-black" />
        ) : (
          <Bookmark className="w-5 h-5 text-black" />
        )}
      </motion.button>

      {/* เปอร์เซ็นต์ความคล้าย */}
      {result.match_percentage && (
        <div className="absolute top-3 left-3 z-10 bg-wagashi-matcha border-2 border-black px-3 py-1 rounded-full font-bold text-sm shadow-paper-sm flex items-center gap-1.5">
          🤖 AI Match {result.match_percentage.toFixed(0)}%
        </div>
      )}

      {/* รูปภาพ */}
      <div className="h-48 md:h-56 overflow-hidden border-b-2 border-black relative shrink-0">
        <img
          src={formatSrc(result.image_url)}
          alt={result.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className={`absolute bottom-0 left-0 border-t-2 border-r-2 border-black px-3 py-1 font-bold text-xs uppercase ${statusColor}`}>
          {result.status === 'lost' ? 'สัตว์หาย' : result.status === 'found' ? 'พบหลงทาง' : 'หาบ้าน'}
        </div>
      </div>

      {/* รายละเอียด */}
      <div className="p-5 flex flex-col gap-3 flex-grow justify-between">
        <div>
          <h3 className="font-bold text-2xl mb-1 truncate">{result.name || 'ไม่ทราบชื่อ'}</h3>
          <p className="text-sm font-medium text-gray-700 truncate">{result.breed || 'ไม่ระบุสายพันธุ์'}</p>
        </div>

        <div className="flex items-center gap-2 text-sm font-bold bg-gray-100 border border-black/10 px-3 py-1.5 rounded-lg w-fit">
          <MapPin size={16} className="text-gray-600" />
          <span className="truncate">{result.province}</span>
        </div>

        <Button 
          onClick={() => router.push(`/pet/${result.id}`)}
          className="w-full mt-2 bg-white text-black border-2 border-black shadow-paper-sm font-bold hover:bg-black hover:text-white hover:shadow-paper-lg hover:-translate-y-0.5 transition-all"
        >
          ดูรายละเอียด
        </Button>
      </div>
    </div>
  );
}