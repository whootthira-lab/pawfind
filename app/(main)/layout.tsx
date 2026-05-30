import { ReactNode } from 'react'

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-washi font-sans text-foreground flex flex-col">
      
      <main className="max-w-6xl w-full mx-auto p-4 py-8 flex-1">
        {children}
      </main>

      <footer className="bg-wagashi-kinako border-t-4 border-black p-8 mt-12 text-black">
        <div className="max-w-6xl mx-auto text-center font-bold">
          <p>PobPet หาสัตว์หายด้วย AI © 2026</p>
        </div>
      </footer>
    </div>
  )
}