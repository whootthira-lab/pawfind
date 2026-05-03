import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar"; // 1. Import Navbar เข้ามา

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-sans' 
});

export const metadata: Metadata = {
  title: "PawFind - แพลตฟอร์มตามหาสัตว์เลี้ยงด้วย AI",
  description: "ช่วยเหลือน้องๆ สัตว์เลี้ยงที่พลัดหลงในพื้นที่นครราชสีมาและทั่วประเทศ ด้วยระบบ AI Matching ที่แม่นยำ",
  // สามารถเพิ่ม icons หรือ metadata อื่นๆ ตรงนี้ได้
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={cn("font-sans", inter.variable)}> {/* 2. เปลี่ยน lang เป็น th */}
      <body className="antialiased bg-white text-black min-h-screen flex flex-col">
        {/* 3. วาง Navbar ไว้บนสุดเพื่อให้แสดงผลในทุกหน้า */}
        <Navbar />

        {/* 4. ส่วนของเนื้อหาหลัก เพิ่ม margin-top หรือ padding เพื่อไม่ให้ Navbar บังเนื้อหา (ถ้า Navbar เป็น sticky) */}
        <main className="flex-grow">
          {children}
        </main>

        {/* 5. (เพิ่มเติม) สามารถเพิ่ม Footer ด้านล่างได้ในอนาคต */}
        <footer className="border-t-4 border-black p-6 bg-gray-50 font-bold text-center">
          <p>© {new Date().getFullYear()} PAWFIND - Community for Pets</p>
        </footer>
      </body>
    </html>
  );
}