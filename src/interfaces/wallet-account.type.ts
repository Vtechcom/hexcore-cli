import type { UTxOObject } from '@hydra-sdk/core'

export type WalletAccount = {
  id: number
  baseAddress: string
  pointerAddress: string
  createdAt: string
  utxo: UTxOObject
}
