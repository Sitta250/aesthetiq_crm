import { PrismaClient } from '../src/generated/prisma/client'

const prisma = new PrismaClient()

async function main() {
  // ── Staff ──────────────────────────────────────────────────────────────────
  await prisma.staff.upsert({
    where: { email: 'admin@aesthetiq.co.th' },
    update: {},
    create: {
      name: 'Nattaya Sombat',
      email: 'admin@aesthetiq.co.th',
      avatarInitials: 'NS',
      role: 'admin',
    },
  })

  await prisma.staff.upsert({
    where: { email: 'pim@aesthetiq.co.th' },
    update: {},
    create: {
      name: 'Pimchanok Rungrot',
      email: 'pim@aesthetiq.co.th',
      avatarInitials: 'PR',
      role: 'staff',
    },
  })

  await prisma.staff.upsert({
    where: { email: 'dr.karn@aesthetiq.co.th' },
    update: {},
    create: {
      name: 'Dr. Karnchana Boonma',
      email: 'dr.karn@aesthetiq.co.th',
      avatarInitials: 'KB',
      role: 'doctor',
    },
  })

  // ── Templates ──────────────────────────────────────────────────────────────
  const templates = [
    // welcome
    {
      name: 'Welcome EN',
      language: 'EN' as const,
      category: 'welcome' as const,
      body: "Hi! Thank you for reaching out to AesthetiQ Clinic. We'd love to help you look and feel your best. Could you share a bit more about the treatment you're interested in?",
    },
    {
      name: 'Welcome TH',
      language: 'TH' as const,
      category: 'welcome' as const,
      body: 'สวัสดีค่ะ! ขอบคุณที่ติดต่อ AesthetiQ Clinic นะคะ ทางคลินิกยินดีให้คำปรึกษาค่ะ รบกวนบอกทรีตเมนต์ที่สนใจได้เลยนะคะ',
    },
    {
      name: 'Welcome ZH',
      language: 'ZH' as const,
      category: 'welcome' as const,
      body: '您好！感谢您联系 AesthetiQ 诊所。请问您对哪种治疗项目感兴趣？我们很乐意为您提供详细信息。',
    },
    {
      name: 'Welcome JA',
      language: 'JA' as const,
      category: 'welcome' as const,
      body: 'こんにちは！AesthetiQ クリニックへのお問い合わせありがとうございます。ご興味のある施術をお聞かせいただけますか？',
    },
    {
      name: 'Welcome RU',
      language: 'RU' as const,
      category: 'welcome' as const,
      body: 'Здравствуйте! Благодарим за обращение в клинику AesthetiQ. Расскажите, пожалуйста, какая процедура вас интересует?',
    },
    // follow_up
    {
      name: 'Follow-up EN',
      language: 'EN' as const,
      category: 'follow_up' as const,
      body: "Hi again! Just checking in to see if you have any questions about your treatment or if you'd like to book a consultation.",
    },
    {
      name: 'Follow-up TH',
      language: 'TH' as const,
      category: 'follow_up' as const,
      body: 'สวัสดีค่ะ ติดตามมาสอบถามนะคะ มีคำถามเพิ่มเติมเกี่ยวกับทรีตเมนต์ไหมคะ หรือต้องการนัดปรึกษาแพทย์ได้เลยนะคะ',
    },
    // deposit_reminder
    {
      name: 'Deposit Reminder EN',
      language: 'EN' as const,
      category: 'deposit_reminder' as const,
      body: 'Hi! This is a friendly reminder that your booking will be confirmed once we receive your deposit. Please let us know if you need any assistance.',
    },
    {
      name: 'Deposit Reminder ZH',
      language: 'ZH' as const,
      category: 'deposit_reminder' as const,
      body: '您好！温馨提醒：收到定金后我们将为您确认预约。如有任何问题，请随时联系我们。',
    },
    // confirmation
    {
      name: 'Consultation Confirmation EN',
      language: 'EN' as const,
      category: 'confirmation' as const,
      body: 'Great news! Your consultation has been confirmed. Please arrive 10 minutes early and bring a valid ID. We look forward to seeing you!',
    },
    {
      name: 'Consultation Confirmation TH',
      language: 'TH' as const,
      category: 'confirmation' as const,
      body: 'ยืนยันการนัดปรึกษาแพทย์เรียบร้อยแล้วค่ะ รบกวนมาก่อนเวลา 10 นาที และนำบัตรประชาชนมาด้วยนะคะ',
    },
    // re_engage
    {
      name: 'Re-engagement EN',
      language: 'EN' as const,
      category: 're_engage' as const,
      body: "Hi! We noticed it's been a while since we last spoke. We'd love to reconnect and answer any questions you might have. Is there anything we can help you with?",
    },
    {
      name: 'Re-engagement RU',
      language: 'RU' as const,
      category: 're_engage' as const,
      body: 'Здравствуйте! Мы заметили, что давно не общались. Если у вас появились вопросы или вы хотите записаться на консультацию — мы всегда рады помочь!',
    },
  ]

  await prisma.template.deleteMany({})

  for (const t of templates) {
    await prisma.template.create({ data: t })
  }

  console.log('Seed complete: 3 staff, 13 templates')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
