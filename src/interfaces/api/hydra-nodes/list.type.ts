import type { ApiResponse } from '../response-factory.type'
import type { HydraNode } from './hydra-node.type'

export type HydraNodes = HydraNode[]

export type HydraNodesResponse = ApiResponse<HydraNodes>
