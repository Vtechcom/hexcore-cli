import type { ApiResponse } from '../response-factory.type'
import type { HydraNode } from './hydra-node.type'

export type HydraHead = {
  id: number
  description: string
  nodes: number
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  hydraNodes: HydraNode[]
}

export type HydraHeadResponse = ApiResponse<HydraHead[]>
