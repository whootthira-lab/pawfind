'use client'

import { useEffect, useState } from 'react'
import { PetCard } from '@/components/pet/PetCard'
import { Pet } from '@/types/pet'

export function RandomPetGrid() {
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPets = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/pets/random?limit=6')
      const { data } = await res.json()
      if (data) setPets(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPets()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse bg-washi border-2 border-black rounded-lg h-72"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">กำลังรอคนช่วยอยู่ตอนนี้...</h2>
        <button onClick={fetchPets} className="text-sm border-2 border-black px-3 py-1 bg-white hover:bg-wagashi-sakura transition-colors rounded shadow-paper-sm font-bold">
          🔄 สุ่มใหม่
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {pets.map(pet => (
          <PetCard key={pet.id} pet={pet} />
        ))}
      </div>
    </div>
  )
}
