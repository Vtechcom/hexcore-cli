export interface Consumer {
  id: number
  address: string
  avatar: string
  registrationTx: string
  apikey: string
  createdAt: string
  status: ConsumerStatus
}
export enum ConsumerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}
