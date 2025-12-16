export type HydraNode = {
  id: number
  description?: string
  port: number
  vkey: string
  createdAt: string
  status: 'ACTIVE' | 'INACTIVE'
  // TODO: change to cardanoAccount
  cardanoAccount: {
    id: number
    baseAddress: string
    pointerAddress: string
    createdAt: string
  }
}
