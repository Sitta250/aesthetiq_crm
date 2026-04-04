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
  notes?: string
  lostReason?: string
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

export interface Staff {
  id: string
  name: string
  email: string
  avatarInitials: string
  role: 'admin' | 'staff' | 'doctor'
}

export interface Template {
  id: string
  name: string
  language: Language
  body: string
  category: 'welcome' | 'follow_up' | 'deposit_reminder' | 'confirmation' | 're_engage'
}
