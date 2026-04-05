export type LeadStage =
  | 'new_lead'
  | 'contacted'
  | 'qualified'
  | 'consultation_booked'
  | 'deposit_pending'
  | 'deposit_paid'
  | 'treatment_booked'
  | 'lost'

export type LeadSource =
  | 'instagram'
  | 'facebook'
  | 'line'
  | 'whatsapp'
  | 'website'
  | 'referral'
  | 'other'

export type Language = 'EN' | 'TH' | 'ZH' | 'JA' | 'RU' | 'KO' | 'AR' | 'OTHER'

export type Role = 'admin' | 'staff' | 'doctor'

export type TemplateCategory =
  | 'welcome'
  | 'follow_up'
  | 'deposit_reminder'
  | 'confirmation'
  | 're_engage'

// ---------------------------------------------------------------------------
// Base types (scalar fields only — match Prisma model columns)
// ---------------------------------------------------------------------------

export interface Staff {
  id: string
  name: string
  email: string
  avatarInitials: string
  role: Role
}

export interface Lead {
  id: string
  name: string
  phone?: string
  email?: string
  nationality?: string
  language: Language
  treatmentInterest: string
  travelDateStart?: Date
  travelDateEnd?: Date
  source: LeadSource
  stage: LeadStage
  isForeign: boolean
  isHot: boolean
  staffId?: string
  lostReason?: string
  firstContactedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Task {
  id: string
  leadId: string
  staffId?: string
  title: string
  dueAt: Date
  done: boolean
  createdAt: Date
}

export interface Note {
  id: string
  leadId: string
  staffId?: string
  content: string
  createdAt: Date
}

export interface Template {
  id: string
  name: string
  language: Language
  body: string
  category: TemplateCategory
}

// ---------------------------------------------------------------------------
// Relation types (match Prisma include payloads)
// ---------------------------------------------------------------------------

export type NoteWithStaff = Note & { staff: Staff | null }

export type TaskWithStaff = Task & { staff: Staff | null }

export type LeadWithBoardRelations = Lead & {
  staff: Staff | null
  tasks: TaskWithStaff[]
  notes: NoteWithStaff[]
}
