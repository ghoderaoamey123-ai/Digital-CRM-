export type LeadType =
  | 'new'
  | 'follow'
  | 'visit'
  | 'reschedule'
  | 'plfollow'
  | 'unatt'
  | 'unatt_npu'
  | 'npu'
  | 'requirement'
  | 'dealdone'
  | 'trash';

export type PropertyPurpose = 'sale' | 'rent';

export type PropertyType =
  | 'flat'
  | 'house'
  | 'plot'
  | 'farmhouse'
  | 'farmland'
  | 'shop'
  | 'office'
  | 'room';

export interface PropertyVariant {
  id: string;
  label: string;
  area?: string;
  price?: number;
}

export interface Property {
  id: string;
  name: string;
  purpose: PropertyPurpose;
  propType: PropertyType;
  location: string;
  landmark?: string;
  building?: string;
  bhk?: string;
  areaSqft?: number;
  areaUnit?: string;
  ratePerSqft?: number;
  price: number;
  commPct?: number;
  facing?: string;
  roadWidth?: string;
  floor?: string;
  parking?: string;
  rera?: string;
  ownerName?: string;
  ownerPhone?: string;
  mapsLink?: string;
  notes?: string;
  variants: PropertyVariant[];
  sharedWith?: string[];
  isSoldOut?: boolean;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  nickname?: string;
  leadDate: string;
  type: LeadType;
  propertyId?: string;
  variantLabel?: string;
  budget?: string;
  todayTalk?: string;
  nextPts?: string;
  nextFollowup?: string;
  followTime?: string;
  visitDate?: string;
  visitTime?: string;
  reschedDate?: string;
  reschedTime?: string;
  inPipeline?: boolean;
  isDealDone?: boolean;
  isLeakage?: boolean;
  isRequirementLead?: boolean;
  callsCount?: number;
  waCount?: number;
  createdAt: string;
}

export interface Requirement {
  id: string;
  clientName: string;
  clientPhone?: string;
  category: PropertyPurpose;
  propType: PropertyType;
  location: string;
  budget: number;
  landmark?: string;
  gated?: 'yes' | 'no' | '';
  facing?: string;
  deadline?: string;
  notes?: string;
  shareOnNetwork?: boolean;
  createdAt: string;
}

export type DealStage = 'svdone' | 'token' | 'full';

export interface DealInstallment {
  id: string;
  amount: number;
  dueDate: string;
  paid: boolean;
}

export interface Deal {
  id: string;
  stage: DealStage;
  propertyId?: string;
  propertyName: string;
  clientName: string;
  clientPhone?: string;
  dealValue: number;
  commPct: number;
  commAmount: number;
  dealDate: string;
  notes?: string;
  // Token fields
  tokenAmount?: number;
  tokenPayMode?: 'cash' | 'cheque' | 'online';
  tokenRefundable?: boolean;
  installments?: DealInstallment[];
  // SV Done fields
  extraPropNames?: string[];
  reaction?: 'hot' | 'cold' | '';
  clientOffer?: string;
  ownerOffer?: string;
  decisionMaker?: string;
  payMode?: 'cash' | 'loan' | 'installment' | 'mixed' | '';
  obstacle?: string;
  nextFollowDate?: string;
  nextFollowTime?: string;
  isLeakage?: boolean;
}

export interface BrokerProfile {
  id: string; // e.g. DOT-7421
  uid: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  greeting: string;
  email?: string;
  isSignedIn?: boolean;
  workIn?: string;
  deals?: string;
  deal?: string;
  propsCount?: number;
}

export interface NetworkProperty {
  id: string;
  brokerId: string;
  brokerName: string;
  brokerCity: string;
  title: string;
  purpose: PropertyPurpose;
  propType: PropertyType;
  location: string;
  price: number;
  areaSqft?: number;
  bhk?: string;
  notes?: string;
  sharedWith: string[];
}

export interface ConnectionRequest {
  id: string;
  brokerId: string;
  brokerName: string;
  brokerCity: string;
  workIn?: string;
  direction: 'incoming' | 'sent';
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  type: 'match' | 'propshare' | 'request' | 'followup';
  title: string;
  body: string;
  time: string;
  read: boolean;
  targetPage?: string;
}

export type MainTabFilter =
  | 'all'
  | 'visit'
  | 'follow'
  | 'plfollow'
  | 'reschedule'
  | 'new'
  | 'unatt'
  | 'requirement'
  | 'unatt_npu'
  | 'npu'
  | 'dealdone';

export type NetworkSubPage =
  | 'home'
  | 'discover'
  | 'partners'
  | 'pending'
  | 'myprops'
  | 'partnerprops'
  | 'partnerdetail'
  | 'reqs'
  | 'tools';
