import type { ConsumerStatus } from './consumer.type'

export type ConsumerInfo = {
  id: number
  address: string
  avatar: string
  apikey: string
  mappers: ConsumerKeyMapper[]
  createdAt: string
  updatedAt: string
  status: ConsumerStatus
}

export type ConsumerKeyMapper = {
  id: number
  consumerKey: string
  url: string
  isActive: boolean
  isOnline: boolean
  createdAt: string
  updatedAt: string
  hydraNode: HydraNode
}

export type HydraNode = {
  id: number
  description: string
  port: number
  vkey: string
  createdAt: string
  updatedAt: string
}
