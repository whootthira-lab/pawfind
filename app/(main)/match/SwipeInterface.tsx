"use client"

import { useState } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { Pet } from '@/types/pet'
import { Button } from '@/components/ui/button'

export function SwipeInterface({ initialPets }: { initialPets: Pet[] }) {
  const [pets, setPets] = useState(initialPets)
  
  const handleSwipe = (id: string, direction: 'left' | 'right') => {
    // In a real app, save the swipe direction (like/pass) to the database here
    setPets(current => current.filter(p => p.id !== id))
  }

  return (
    <div className="relative w-full h-full">
      <AnimatePresence>
        {pets.map((pet, index) => {
          const isFront = index === 0
          return (
            <SwipeCard
              key={pet.id}
              pet={pet}
              isFront={isFront}
              onSwipe={(direction) => handleSwipe(pet.id, direction)}
              zIndex={pets.length - index}
            />
          )
        })}
      </AnimatePresence>
    </div>
  )
}

function SwipeCard({ 
  pet, 
  isFront, 
  onSwipe, 
  zIndex 
}: { 
  pet: Pet, 
  isFront: boolean, 
  onSwipe: (dir: 'left' | 'right') => void,
  zIndex: number
}) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-10, 10])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])

  const handleDragEnd = (e: any, info: { offset: { x: number } }) => {
    if (info.offset.x > 100) {
      onSwipe('right')
    } else if (info.offset.x < -100) {
      onSwipe('left')
    }
  }

  return (
    <motion.div
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      style={{ x, rotate, opacity, zIndex }}
      drag={isFront ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: isFront ? 1 : 0.95, opacity: 1, top: isFront ? 0 : 20 }}
      exit={{ x: x.get(), opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-washi border-4 border-black w-full h-full rounded-xl shadow-paper flex flex-col overflow-hidden pointer-events-none">
        <div className="h-2/3 border-b-4 border-black relative">
          {pet.primary_image ? (
            <img src={pet.primary_image} alt={pet.name || 'pet'} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center font-bold text-xl">ไม่มีรูปภาพ</div>
          )}
          
          {pet.special_needs && (
            <div className="absolute top-4 left-4 bg-wagashi-sakura border-2 border-black px-3 py-1 font-bold rounded shadow-paper-sm text-sm">
              🌟 ต้องการดูแลพิเศษ
            </div>
          )}
        </div>
        
        <div className="flex-1 p-6 flex flex-col justify-center bg-white pointer-events-auto">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-3xl">{pet.name || 'ไม่ทราบชื่อ'}</h3>
            <span className="text-sm font-bold bg-wagashi-sora px-3 py-1 border-2 border-black rounded shadow-paper-sm">
              {pet.type === 'dog' ? '🐶 หมา' : pet.type === 'cat' ? '🐱 แมว' : '🐾 อื่นๆ'}
            </span>
          </div>
          <p className="text-lg font-medium text-gray-700 mb-4">{pet.breed} • {pet.province}</p>
          
          <div className="flex gap-4 justify-center mt-auto">
            <Button 
              variant="outline" 
              className="flex-1 border-2 border-black shadow-paper-sm hover:shadow-paper hover:-translate-y-1 bg-white text-xl py-6 rounded-xl font-bold"
              onClick={() => onSwipe('left')}
            >
              ❌ ผ่าน
            </Button>
            <Button 
              className="flex-1 border-2 border-black shadow-paper-sm hover:shadow-paper hover:-translate-y-1 bg-wagashi-matcha text-black text-xl py-6 rounded-xl font-bold"
              onClick={() => onSwipe('right')}
            >
              💖 สนใจ
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
