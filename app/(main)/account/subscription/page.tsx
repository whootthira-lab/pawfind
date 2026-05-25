'use client'
// app/(main)/account/subscription/page.tsx (V4 - ปลด Paywall, แก้บั๊ครูปภาพนุด, บันทึกรูปตำหนิ 3 รูปพร้อมรายละเอียด)

import { useState, useEffect, useMemo, Suspense, useRef } from 'react'
import { createBrowserClient }                    from '@supabase/ssr'
import { useRouter, useSearchParams }             from 'next/navigation'
import Link                                       from 'next/link'
import Image                                      from 'next/image'
import { Button }                                 from '@/components/ui/button'
import {
  PawPrint, Plus, AlertCircle, Edit, Trash2, CheckCircle2, Loader2, User, Phone, 
  MapPin, Briefcase, Heart, Camera, Sparkles, Settings, Home, MessageSquare, Cake, 
  UserPlus, CalendarDays, PlusCircle, Upload, X, ShieldAlert
} from 'lucide-react'

const expertiseOptions = [
  { value: 'adopt',       label: '🐶 หาบ้านใหม่ / รับเลี้ยง' },
  { value: 'rescue',      label: '🆘 ค้นหาสัตว์หาย/ช่วยเหลือสัตว์จร' },
  { value: 'mating',      label: '❤️ หาคู่ให้สัตว์เลี้ยง' },
  { value: 'showcase',    label: '📸 ประกวด / อวดความน่ารัก' },
  { value: 'knowledge',   label: '📚 ศึกษาความรู้การเลี้ยง' },
  { value: 'general',     label: 'ผู้ใช้งานทั่วไป (พร้อมช่วยเป็นหูเป็นตา)' },
  { value: 'volunteer',   label: 'อาสาสมัคร / ศูนย์พักพิงสัตว์' },
  { value: 'petscout',    label: '🔍PetScout (รับจ้างตามหาสัตว์หาย)' },
  { value: 'vet',         label: '🏥 ประชาสัมพันธ์ คลินิกรักษาสัตว์' },
  { value: 'groomer',     label: '🪮 ประชาสัมพันธ์บริการอาบน้ำตัดขน / โรงแรมสัตว์' },
  { value: 'petsitter',   label: '🏩 ประชาสัมพันธ์รับฝากหรือดูแลสัตว์ที่บ้าน' },
  { value: 'retailer',    label: '🛍️ ประชาสัมพันธ์ ร้านจำหน่ายอาหารและอุปกรณ์สัตว์เลี้ยง' },
  { value: 'announce', label: '📢 ประชาสัมพันธ์ข่าว/กิจกรรม' },
  { value: 'other',       label: 'อื่นๆ (โปรดระบุ)' },
]

const occupationOptions = [
  { value: 'student',         label: '🎓 นักเรียน / นักศึกษา' },
  { value: 'employee',        label: '💼 พนักงานบริษัท / ลูกจ้าง' },
  { value: 'government',      label: '🏛 ข้าราชการ / รัฐวิสาหกิจ' },
  { value: 'business_owner',  label: '🏪 เจ้าของกิจการ / ธุรกิจส่วนตัว' },
  { value: 'freelance',       label: '🖥 Freelance / อาชีพอิสระ' },
  { value: 'agriculturist',   label: '🌾 เกษตรกร' },
  { value: 'healthcare',      label: '🏥 บุคลากรทางการแพทย์' },
  { value: 'educator',        label: '📚 ครู / อาจารย์' },
  { value: 'retired',         label: '🏖 เกษียณอายุ' },
  { value: 'unemployed',      label: '🔍 ว่างงาน / กำลังหางาน' },
  { value: 'other',           label: '✏️ อื่นๆ' },
]

const interestOptions = [
  { value: 'dog',         label: '🐕 สุนัข' },
  { value: 'cat',         label: '🐈 แมว' },
  { value: 'bird',        label: '🦜 นกสวยงาม' },
  { value: 'fish',        label: '🐟 ปลาสวยงาม' },
  { value: 'exotic',      label: '🦎 สัตว์ Exotic' },
  { value: 'rabbit',      label: '🐰 กระต่าย / สัตว์เล็ก' },
  { value: 'adopt',       label: '🐶 หาบ้านใหม่/รับเลี้ยงสัตว์' },
  { value: 'rescue',      label: '🆘 ช่วยเหลือสัตว์เจ็บป่วย/สัตว์จร' },
  { value: 'mating',      label: '❤️ หาคู่ผสมพันธุ์ให้น้องๆ' },
  { value: 'showcase',    label: '📸 อวดความน่ารัก/ประกวดสัตว์เลี้ยง' },
  { value: 'knowledge',   label: '📚 ศึกษาความรู้และการเลี้ยงดู' },
  { value: 'health',      label: '🏥 สุขภาพสัตว์เลี้ยง' },
  { value: 'prosthetics', label: '💡 นวัตกรรม / DIY' },
  { value: 'community',   label: '🤝 ชุมชนอาสาสมัคร' },
  { value: 'memorial',    label: '🕯 ของที่ระลึกสัตว์เลี้ยง' },
  { value: 'astrology',   label: '🔮 ดูดวง / โหราศาสตร์' },
  { value: 'psychology',  label: '🧠 จิตวิทยา' },
  { value: 'selfdev',     label: '📈 พัฒนาตนเอง' },
  { value: 'sport_football',  label: '⚽ ฟุตบอล' },
  { value: 'sport_badminton', label: '🏸 แบดมินตัน / เทนนิส' },
  { value: 'sport_golf',      label: '⛳ กอล์ฟ' },
  { value: 'sport_muay',      label: '🥊 ศิลปะการต่อสู้' },
  { value: 'sport_other',     label: '🏅 กีฬาประเภทอื่นๆ' },
  { value: 'fitness',     label: '💪 ฟิตเนส / ออกกำลังกาย' },
  { value: 'fashion',     label: '👗 แฟชั่น / สไตล์' },
  { value: 'herbs',       label: '🌿 สมุนไพรธรรมชาติ' },
  { value: 'cooking',     label: '🍳 ทำอาหารเพื่อสุขภาพ' },
  { value: 'travel',      label: '✈️ ท่องเที่ยว' },
  { value: 'tech',        label: '💻 เทคโนโลยี / AI' },
  { value: 'art',         label: '🎨 ศิลปะ / งานฝีมือ' },
  { value: 'music',       label: '🎵 ดนตรี' },
  { value: 'reading',     label: '📚 อ่านหนังสือ' },
  { value: 'meditation',  label: '🧘 ทำสมาธิ / ธรรมะ' },
]

const expertiseTagOptions = [
  { value: 'rescue_expert',     label: '🚑 ยานพาหนะช่วยชีวิตสัตว์/จับสัตว์' },
  { value: 'medical_care',      label: '💊 ปฐมพยาบาล/ให้ยาสัตว์เบื้องต้น' },
  { value: 'foster_home',       label: '🏡 มีพื้นที่กักตัว/พักฟื้นสัตว์ชั่วคราว' },
  { value: 'pet_photography',   label: '📸 ถ่ายภาพสัตว์เลี้ยงโปรโมทหาบ้าน' },
  { value: 'craftsman_diy',     label: '🛠️ ช่างฝีมือ/ออกแบบวีลแชร์สัตว์พิการ' },
  { value: 'donation_co',       label: '📦 ประสานงานกองทุนและสิ่งของบริจาค' },
  { value: 'digital_creator',   label: '💻 ช่วยทำสื่อดิจิทัล/กราฟิกคอมมูนิตี้' },
  { value: 'volunteer', label: '🛌 อาสาสมัคร / ศูนย์พักพิงสัตว์' },
  { value: 'petscout', label: '🔍 PetScout (นักตามหาสัตว์หาย)' },
  { value: 'none', label: 'ไม่มี' },
  { value: 'other', label: 'อื่นๆ' },
]

const maritalStatusOptions = [
  { value: 'single',       label: 'โสด' },
  { value: 'married',      label: 'แต่งงานแล้ว' },
  { value: 'complicated',  label: 'ไม่เปิดเผย / คลุมเครือ' },
]

const thailandProvinces = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยะลา", "ยโสธร", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อุดรธานี", "อุทัยธานี", "อุตรดิตถ์", "อุบลราชธานี", "อำนาจเจริญ"
].sort()

function SubscriptionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  // ── 🟢 ปรับเพิ่มแท็บจัดการน้อง ──
  const [activeTab, setActiveTab] = useState<'profile' | 'events' | 'pets'>('profile')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [myPets, setMyPets] = useState<any[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)

  // Profile Form State
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    display_name: '',
    first_name: '',
    last_name: '',
    birth_date: '',
    phone_number: '',
    province: 'นครราชสีมา',
    district: '',
    subdistrict: '',
    address: '',
    line_id: '',
    gender: 'unknown',
    avatar_url: '',
    occupation: 'employee',
    community_role: 'general',
    community_role_custom: '',
    interests: [] as string[],
    expertise_tags: [] as string[],
    marital_status: 'single'
  })

  // ── States สำหรับฟอร์มสร้างน้องพรีเมียมตัวใหม่ในแผงบัญชี ──
  const [petFormOpen, setPetFormOpen] = useState(false)
  const [petSaving, setPetSaving] = useState(false)
  const petFileInputRef = useRef<HTMLInputElement>(null)
  const featureFileInputRef = useRef<HTMLInputElement>(null)
  
  const [petImages, setPetImages] = useState<{ file: File; preview: string }[]>([])
  const [featureImages, setFeatureImages] = useState<{ file: File; preview: string; description: string }[]>([])

  const [petDataForm, setPetDataForm] = useState({
    name: '',
    species: 'cat',
    breed: '',
    gender: 'unknown',
    province: 'นครราชสีมา',
    district: '',
    sub_district: '',
    details: '',
    reward_amount: '0'
  })

  const fetchMyEventsAndPets = async (userId: string) => {
    setIsLoadingEvents(true)
    const [eventsRes, petsRes] = await Promise.all([
      supabase.from('events').select('*').eq('organizer_id', userId).order('created_at', { ascending: false }),
      supabase.from('pets').select('*').eq('user_id', userId).not('status', 'eq', 'archived').order('created_at', { ascending: false })
    ])
    setEvents(eventsRes.data || [])
    setMyPets(petsRes.data || [])
    setIsLoadingEvents(false)
  }

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'events') setActiveTab('events')
    if (tabParam === 'pets') setActiveTab('pets')
  }, [searchParams])

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          router.push('/login')
          return
        }
        setUser(session.user)

        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        if (prof) {
          setFormData({
            display_name:         prof.display_name || '',
            first_name:           prof.first_name || '',
            last_name:            prof.last_name || '',
            birth_date:           prof.birth_date || '',
            phone_number:         prof.phone_number || '',
            province:             prof.province || 'นครราชสีมา',
            district:             prof.district || '',
            subdistrict:          prof.subdistrict || '',
            address:              prof.address || '',
            line_id:              prof.line_id || '',
            gender:               prof.gender || 'unknown',
            avatar_url:           prof.avatar_url || '',
            occupation:           prof.occupation || 'employee',
            community_role:       prof.community_role || 'general',
            community_role_custom: prof.community_role_custom || '',
            interests:            Array.isArray(prof.interests) ? prof.interests : [],
            expertise_tags:       Array.isArray(prof.expertise_tags) ? prof.expertise_tags : [],
            marital_status:       prof.marital_status || 'single'
          })
        }

        await fetchMyEventsAndPets(session.user.id)

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [supabase, router])

  // ── 🟢 [แก้ไขบั๊ครูปไม่แสดง] ปรับโครงสร้างพาทไฟล์อัปโหลดให้พ่นค่า Public URL ลงล็อกตรงบักเก็ต profile-images ──
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return
    setUploading(true)
    setProfileMsg(null)

    try {
      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadErr } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: true })

      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }))
      setProfileMsg({ type: 'success', text: 'อัปโหลดรูปโปรไฟล์ชั่วคราวสำเร็จ อย่าลืมกดบันทึกด้านล่างนะคะ' })
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'อัปโหลดรูปภาพไม่สำเร็จ' })
    } finally {
      setUploading(false)
    }
  }

  const handleInterestChange = (value: string) => {
    setFormData(prev => {
      const current = [...prev.interests]
      if (current.includes(value)) {
        return { ...prev, interests: current.filter(i => i !== value) }
      } else {
        return { ...prev, interests: [...current, value] }
      }
    })
  }

  const handleExpertiseTagChange = (value: string) => {
    setFormData(prev => {
      const current = [...prev.expertise_tags]
      if (current.includes(value)) {
        return { ...prev, expertise_tags: current.filter(t => t !== value) }
      } else {
        return { ...prev, expertise_tags: [...current, value] }
      }
    })
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSavingProfile(true)
    setProfileMsg(null)

    if (!formData.display_name.trim() || !formData.phone_number.trim() || !formData.first_name.trim() || !formData.last_name.trim()) {
      setProfileMsg({ type: 'error', text: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วนก่อนทำการบันทึก' })
      setSavingProfile(false)
      return
    }

    try {
      const finalCommunityRole = formData.community_role === 'other' ? formData.community_role_custom.trim() : formData.community_role

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id:                    user.id,
          email:                 user.email,
          display_name:          formData.display_name.trim(),
          first_name:            formData.first_name.trim(),
          last_name:             formData.last_name.trim(),
          birth_date:            formData.birth_date || null,
          phone_number:          formData.phone_number.trim(),
          province:              formData.province,
          district:              formData.district.trim() || null,
          subdistrict:           formData.subdistrict.trim() || null,
          address:               formData.address.trim() || null,
          line_id:               formData.line_id.trim() || null,
          gender:                formData.gender,
          avatar_url:            formData.avatar_url || null,
          occupation:            formData.occupation,
          community_role:        finalCommunityRole,
          community_role_custom: formData.community_role_custom.trim() || null,
          interests:             formData.interests,
          expertise_tags:        formData.expertise_tags,
          marital_status:        formData.marital_status,
          updated_at:            new Date().toISOString()
        })

      if (error) throw error
      setProfileMsg({ type: 'success', text: '🎉 บันทึกการอัปเดตโปรไฟล์ของคุณเรียบร้อยแล้ว' })
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleEventDelete = async (eventId: string, title: string) => {
    if (!window.confirm(`⚠️ ยืนยันการลบประกาศ "${title}"?\nข้อมูลนี้จะถูกลบอย่างถาวรและไม่สามารถกู้คืนได้`)) return

    try {
      const { error } = await supabase.from('events').delete().eq('id', eventId)
      if (error) throw error
      
      alert('✅ ลบประกาศเรียบร้อยแล้วครับ')
      fetchMyEventsAndPets(user.id)
    } catch (err: any) {
      alert(`ลบไม่สำเร็จ: ${err.message}`)
    }
  }

  // ── 🟢 กลไกอัปโหลดและแมปข้อมูลรูปตำหนิพิเศษ 3 รูปพร้อมรายละเอียดลงช่อง markings ──
  const handlePetSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (petSaving || !user) return
    if (petImages.length === 0) return alert('กรุณาแนบรูปถ่ายน้องอย่างน้อย 1 รูป')
    setPetSaving(true)

    try {
      const uploadedUrls: string[] = []
      // 1. อัปโหลดคลังรูปสแตนดาร์ดสูงสุด 5 รูป
      for (const img of petImages) {
        const fileExt = img.file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        await supabase.storage.from('pet-images').upload(fileName, img.file)
        const { data: { publicUrl } } = supabase.storage.from('pet-images').getPublicUrl(fileName)
        uploadedUrls.push(publicUrl)
      }

      // 2. อัปโหลดรูปตำหนิพิเศษสูงสุด 3 รูป พร้อมแพ็คคำอธิบายรวมเป็น Object JSON แมปลงช่อง markings
      const markingsList = []
      for (const feat of featureImages) {
        const fileExt = feat.file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}-feature.${fileExt}`
        await supabase.storage.from('pet-images').upload(fileName, feat.file)
        const { data: { publicUrl } } = supabase.storage.from('pet-images').getPublicUrl(fileName)
        markingsList.push({
          url: publicUrl,
          description: feat.description
        })
      }

      const { error } = await supabase
        .from('pets')
        .insert({
          user_id: user.id,
          name: petDataForm.name || 'ไม่ทราบชื่อ',
          species: petDataForm.species,
          breed: petDataForm.breed || null,
          gender: petDataForm.gender,
          province: petDataForm.province,
          district: petDataForm.district || null,
          sub_district: petDataForm.sub_district || null,
          details: petDataForm.details || null,
          reward_amount: parseFloat(petDataForm.reward_amount) || 0,
          image_url: uploadedUrls[0],
          // เก็บอาเรย์รูปภาพทั้งหมดและโครงสร้างรูปตำหนิลงฟิลด์ตามลำดับโครงสร้างสากล
          doc_urls: uploadedUrls,
          distinctive_features: JSON.stringify(markingsList),
          status: 'active',
          is_public: true
        })

      if (error) throw error
      alert('🎉 เพิ่มประวัติน้องสำเร็จแล้ว!')
      setPetFormOpen(false)
      setPetImages([])
      setFeatureImages([])
      await fetchMyEventsAndPets(user.id)
    } catch (err: any) {
      alert(`ไม่สามารถบันทึกได้: ${err.message}`)
    } finally {
      setPetSaving(false)
    }
  }

  const handlePetImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    if (petImages.length + files.length > 5) return alert('แนบรูปถ่ายน้องหลักได้สูงสุด 5 รูป ควรมีหความหลากหลายของมุมที่ถ่าย')
    const mapped = files.map(f => ({ file: f, preview: URL.createObjectURL(f) }))
    setPetImages(prev => [...prev, ...mapped])
  }

  const handleFeatureImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    if (featureImages.length + files.length > 3) return alert('แนบรูปตำหนิได้สูงสุด 3 รูป')
    const mapped = files.map(f => ({ file: f, preview: URL.createObjectURL(f), description: '' }))
    setFeatureImages(prev => [...prev, ...mapped])
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <span className="bg-green-100 text-green-800 border-2 border-green-300 px-3 py-1 rounded-lg text-xs font-black">✅ อนุมัติแล้ว</span>
      case 'pending_ai': return <span className="bg-blue-100 text-blue-800 border-2 border-blue-300 px-3 py-1 rounded-lg text-xs font-black">🤖 รอ AI ตรวจสอบ</span>
      case 'pending_admin': return <span className="bg-orange-100 text-orange-800 border-2 border-orange-300 px-3 py-1 rounded-lg text-xs font-black">⏳ รอแอดมินพิจารณา</span>
      default: return <span className="bg-gray-100 text-gray-800 border-2 border-gray-300 px-3 py-1 rounded-lg text-xs font-black">{status}</span>
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="animate-spin text-black" size={40} />
        <p className="font-bold text-gray-500">กำลังโหลดข้อมูลบัญชีผู้ใช้งาน...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-black">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-4 border-black p-6 rounded-3xl bg-white shadow-paper mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-wagashi-matcha/30 border-2 border-black rounded-2xl shadow-paper-sm">
            <Settings className="w-8 h-8 text-black" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl md:text-3xl font-black">{formData.display_name || 'KRUTH'}</h1>
            <p className="text-sm font-bold text-gray-500 mt-0.5">{user?.email}</p>
            <span className="inline-block bg-green-100 text-green-800 border-2 border-green-400 text-xs font-black px-2.5 py-0.5 rounded-full mt-1">
              🛡️ สมาชิกเครือข่ายความปลอดภัย PobPet
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('profile')} className={`px-6 py-3 font-black rounded-xl border-2 border-black transition-all ${activeTab === 'profile' ? 'bg-black text-white' : 'bg-white text-black shadow-paper-sm'}`}>
          ⚙️ ข้อมูลโปรไฟล์ทั่วไป
        </button>
        <button onClick={() => setActiveTab('events')} className={`px-6 py-3 font-black rounded-xl border-2 border-black transition-all ${activeTab === 'events' ? 'bg-black text-white' : 'bg-white text-black shadow-paper-sm'}`}>
          📋 ประกาศกิจกรรม
        </button>
        <button onClick={() => setActiveTab('pets')} className={`px-6 py-3 font-black rounded-xl border-2 border-black transition-all ${activeTab === 'pets' ? 'bg-black text-white' : 'bg-white text-black shadow-paper-sm'}`}>
          🐾 จัดการโปรไฟล์น้อง ({myPets.length})
        </button>
      </div>

      <div className="bg-white border-4 border-black rounded-3xl p-6 md:p-10 shadow-paper">
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="md:col-span-2 flex flex-col items-center justify-center pb-4 border-b-2 border-dashed border-black/20">
              <div className="relative w-28 h-28 border-4 border-black rounded-full overflow-hidden bg-gray-100 shadow-paper-sm">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={64} /></div>
                )}
                <label className="absolute bottom-0 right-0 left-0 bg-black/70 text-white p-1.5 text-center cursor-pointer text-xs font-bold hover:bg-black">
                  <Camera size={14} className="mx-auto" />
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-black text-xs text-black flex items-center gap-1"><UserPlus size={16}/> ชื่อเล่น / ชื่อในระบบ <span className="text-red-500">*</span></label>
              <input type="text" required value={formData.display_name} onChange={e => setFormData({...formData, display_name: e.target.value})} className="w-full border-2 border-black p-3 rounded-xl font-bold" />
            </div>

            <div className="space-y-1">
              <label className="font-black text-xs text-black flex items-center gap-1"><Phone size={16}/> เบอร์โทรศัพท์ติดต่อ <span className="text-red-500">*</span></label>
              <input type="tel" required value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} className="w-full border-2 border-black p-3 rounded-xl font-bold" />
            </div>

            <div className="space-y-1">
              <label className="font-black text-xs text-black">ชื่อจริง (ภาษาไทย) <span className="text-red-500">*</span></label>
              <input type="text" required value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className="w-full border-2 border-black p-3 rounded-xl font-bold" />
            </div>

            <div className="space-y-1">
              <label className="font-black text-xs text-black">นามสกุล (ภาษาไทย) <span className="text-red-500">*</span></label>
              <input type="text" required value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className="w-full border-2 border-black p-3 rounded-xl font-bold" />
            </div>

            <div className="space-y-1">
              <label className="font-black text-xs text-black flex items-center gap-1"><MapPin size={16}/> จังหวัดประจำการหลัก</label>
              {/* ── 🟢 บังคับทุกช่องเลือกจังหวัดเป็น Dropdown List สอดคล้องกัน ── */}
              <select value={formData.province} onChange={e => setFormData({...formData, province: e.target.value})} className="w-full border-2 border-black p-3 rounded-xl font-bold bg-white cursor-pointer">
                {thailandProvinces.map(prov => <option key={prov} value={prov}>{prov}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-black text-xs text-black">อำเภอ / เขต</label>
              <input type="text" value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} className="w-full border-2 border-black p-3 rounded-xl font-bold" />
            </div>

            {profileMsg && (
              <div className="md:col-span-2 p-4 rounded-xl border-2 border-black font-bold bg-green-50 text-green-900">
                <span>{profileMsg.text}</span>
              </div>
            )}

            {/* ── 🟢 ลบแผงแถบโฆษณา Paywall ท้ายปุ่มเซฟออกหมดจดตามสั่ง ── */}
            <Button type="submit" disabled={savingProfile || uploading} className="md:col-span-2 bg-black text-white py-7 text-lg font-black rounded-2xl border-4 border-black shadow-paper-sm">
              💾 บันทึกการเปลี่ยนแปลง
            </Button>
          </form>
        )}

        {activeTab === 'events' && (
          <div className="space-y-6 text-left">
            <div className="flex justify-between items-center border-b-4 border-black pb-4">
              <h3 className="text-xl font-black">🎪 ประกาศกิจกรรมเครือข่ายของฉัน</h3>
              <Link href="/events/create"><Button className="bg-black text-white font-black"><PlusCircle size={16}/> สร้างกิจกรรม</Button></Link>
            </div>
            {events.length === 0 ? <p className="text-center text-gray-400 py-8 font-bold">ยังไม่มีประกาศกิจกรรมย่อย</p> : (
              <div className="space-y-3">
                {events.map(ev => (
                  <div key={ev.id} className="border-2 border-black p-4 rounded-xl flex justify-between items-center">
                    <div>{getStatusBadge(ev.status)}<h4 className="font-black text-lg mt-1">{ev.title}</h4></div>
                    <Button onClick={() => handleEventDelete(ev.id, ev.title)} className="bg-red-100 text-red-700 border-2 border-red-400 font-black"><Trash2 size={14}/> ลบ</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 🟢 [ย้ายฟีเจอร์พรีเมียมจาก LINE OA มาแสดงผลหน้าเว็บ] แผงสมุดจัดการสุขภาพและสลับโหมดตามลักกี้บอต ── */}
        {activeTab === 'pets' && (
          <div className="space-y-6 text-left">
            <div className="flex justify-between items-center border-b-4 border-black pb-4">
              <div>
                <h3 className="text-2xl font-black">🐾 สมุดทะเบียนรายชื่อและประวัติสุขภาพน้อง</h3>
                <p className="text-xs font-bold text-gray-500 mt-0.5">เพิ่มประวัติน้อง อัปโหลดรูปตำหนิพิเศษ 3 มุม เพื่อใช้ร่วมกับระบบ AI Web Push แจ้งเตือนความจำฟรี</p>
              </div>
              <Button onClick={() => setPetFormOpen(!petFormOpen)} className="bg-black text-white font-black">
                {petFormOpen ? '✖️ ปิดฟอร์ม' : '➕ ลงทะเบียนประวัติน้องใหม่'}
              </Button>
            </div>

            {petFormOpen && (
              <form onSubmit={handlePetSave} className="border-4 border-black p-6 rounded-2xl bg-gray-50/50 space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-black text-sm">ชื่อน้อง <span className="text-red-500">*</span></label>
                    <input type="text" required value={petDataForm.name} onChange={e => setPetDataForm({...petDataForm, name: e.target.value})} placeholder="เช่น ชาเย็น" className="w-full border-2 border-black p-2.5 rounded-xl font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-black text-sm">ประเภทสายพันธุ์สัตว์</label>
                    <select value={petDataForm.species} onChange={e => setPetDataForm({...petDataForm, species: e.target.value})} className="w-full border-2 border-black p-2.5 rounded-xl font-bold bg-white">
                      <option value="cat">🐈 แมว</option>
                      <option value="dog">🐕 สุนัข</option>
                      <option value="bird">🦜 นกสวยงาม</option>
                      <option value="other">🐾 อื่นๆ</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-black text-sm">จังหวัดเกิดเหตุประจำตัว</label>
                    {/* ── 🟢 ช่องเลือกจังหวัดสัตว์เลี้ยง บังคับเป็น Dropdown สอดคล้องตามสั่ง ── */}
                    <select value={petDataForm.province} onChange={e => setPetDataForm({...petDataForm, province: e.target.value})} className="w-full border-2 border-black p-2.5 rounded-xl font-bold bg-white cursor-pointer">
                      {thailandProvinces.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-black text-sm">อำเภอ</label>
                    <input type="text" value={petDataForm.district} onChange={e => setPetDataForm({...petDataForm, district: e.target.value})} placeholder="เช่น ด่านขุนทด" className="w-full border-2 border-black p-2.5 rounded-xl font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-black text-sm">ตำบล</label>
                    <input type="text" value={petDataForm.sub_district} onChange={e => setPetDataForm({...petDataForm, sub_district: e.target.value})} placeholder="เช่น ด่านขุนทด" className="w-full border-2 border-black p-2.5 rounded-xl font-bold" />
                  </div>
                </div>

                {/* อัปโหลดคลังรูปภาพปกติสูงสุด 5 รูป */}
                <div className="space-y-2 border-2 border-black p-4 rounded-xl bg-white">
                  <label className="font-black text-sm flex items-center gap-1">🖼️ อัปโหลดรูปถ่ายปกติน้อง (สูงสุด 5 รูป) <span className="text-red-500">*</span></label>
                  <input type="file" multiple accept="image/*" ref={petFileInputRef} onChange={handlePetImageChange} className="hidden" />
                  <Button type="button" onClick={() => petFileInputRef.current?.click()} variant="outline" className="border-2 border-dashed border-gray-400 py-6 w-full font-black"><Upload size={16}/> เลือกรูปภาพประกอบ</Button>
                  <div className="flex gap-2 flex-wrap mt-2">
                    {petImages.map((img, i) => <img key={i} src={img.preview} className="w-14 h-14 object-cover border-2 border-black rounded-lg" />)}
                  </div>
                </div>

                {/* ── 🟢 ส่วนอัปโหลดรูปตำหนิ/จุดสังเกตเด่น 3 รูป พร้อมช่องกรอกคำอธิบายประจำรูป ── */}
                <div className="space-y-3 border-2 border-black p-4 rounded-xl bg-amber-50/20">
                  <label className="font-black text-sm flex items-center gap-1 text-amber-900">⚡ อัปโหลดรูปตำหนิพิเศษหรือจุดสังเกตเด่น (สูงสุด 3 รูป)</label>
                  <input type="file" multiple accept="image/*" ref={featureFileInputRef} onChange={handleFeatureImageChange} className="hidden" />
                  <Button type="button" onClick={() => featureFileInputRef.current?.click()} className="bg-amber-100 text-amber-900 border-2 border-amber-300 w-full font-black"><Plus size={14}/> เพิ่มรูปจุดสังเกตเด่น</Button>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                    {featureImages.map((feat, idx) => (
                      <div key={idx} className="border-2 border-black p-3 rounded-xl bg-white space-y-2">
                        <img src={feat.preview} className="w-full h-24 object-cover border-2 border-black rounded-lg" />
                        <input 
                          type="text" required
                          placeholder="อธิบายตำหนิรูปนี้ เช่น มีแต้มสีดำแก้มขวา" 
                          value={feat.description}
                          onChange={e => {
                            const updated = [...featureImages]
                            updated[idx].description = e.target.value
                            setFeatureImages(updated)
                          }}
                          className="w-full border border-gray-400 p-1.5 rounded text-xs font-bold" 
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-black text-sm">รายละเอียดลักษณะพฤติกรรมและการดูแล</label>
                  <textarea rows={2} value={petDataForm.details} onChange={e => setPetDataForm({...petDataForm, details: e.target.value})} placeholder="เช่น ชอบกินอาหารเปียกรสปลาทู ตื่นตระหนกเสียงฟ้าร้องง่าย" className="w-full border-2 border-black p-2.5 rounded-xl font-bold resize-none" />
                </div>

                <Button type="submit" disabled={petSaving} className="w-full bg-black text-white font-black py-4 rounded-xl border-2 border-black shadow-paper-sm">
                  {petSaving ? '⏳ กำลังส่งข้อมูลประวัติน้อง...' : '💾 ยืนยันบันทึกข้อมูล'}
                </Button>
              </form>
            )}

            {/* รายการแสดงรายชื่อสัตว์เลี้ยงปฐมภูมิในเครือข่าย */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myPets.map(pet => (
                <div key={pet.id} className="border-4 border-black p-4 rounded-2xl bg-white shadow-paper-sm flex gap-3 text-left">
                  <img src={pet.image_url || '/favicons.ico'} className="w-20 h-20 object-cover border-2 border-black rounded-xl bg-gray-100" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-lg leading-tight truncate">{pet.name}</h4>
                    <p className="text-xs font-bold text-gray-500 mt-0.5">{pet.species} · {pet.province}</p>
                    <div className="flex gap-1.5 mt-3">
                      <Link href={`/pets/${pet.id}`} className="text-[10px] font-black border-2 border-black bg-gray-100 px-2 py-1 rounded-md hover:bg-gray-200">🏥 สมุดสุขภาพ</Link>
                      <Link href={`/pets/${pet.id}/edit`} className="text-[10px] font-black border-2 border-black bg-white px-2 py-1 rounded-md hover:bg-gray-100">✏️ แก้ไข</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AccountSubscriptionPage() {
  return (
    <Suspense fallback={<div className="p-10 flex justify-center"><Loader2 className="animate-spin text-black" size={40} /></div>}>
      <SubscriptionContent />
    </Suspense>
  )
}