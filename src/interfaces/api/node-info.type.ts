import type { ApiResponse } from './response-factory.type'

export type NodeTip = {
  block: number
  epoch: number
  era: string
  hash: string
  slot: number
  slotInEpoch: number
  slotsToEpochEnd: number
  syncProgress: string
}

export interface ProtocolParameters {
  collateralPercentage: number
  committeeMaxTermLength: number
  committeeMinSize: number
  costModels: {
    PlutusV1: number[]
    PlutusV2: number[]
    PlutusV3: number[]
  }
  dRepActivity: number
  dRepDeposit: number
  dRepVotingThresholds: {
    committeeNoConfidence: number
    committeeNormal: number
    hardForkInitiation: number
    motionNoConfidence: number
    ppEconomicGroup: number
    ppGovGroup: number
    ppNetworkGroup: number
    ppTechnicalGroup: number
    treasuryWithdrawal: number
    updateToConstitution: number
  }
  executionUnitPrices: {
    priceMemory: number
    priceSteps: number
  }
  govActionDeposit: number
  govActionLifetime: number
  maxBlockBodySize: number
  maxBlockExecutionUnits: {
    memory: number
    steps: number
  }
  maxBlockHeaderSize: number
  maxCollateralInputs: number
  maxTxExecutionUnits: {
    memory: number
    steps: number
  }
  maxTxSize: number
  maxValueSize: number
  minFeeRefScriptCostPerByte: number
  minPoolCost: number
  monetaryExpansion: number
  poolPledgeInfluence: number
  poolRetireMaxEpoch: number
  poolVotingThresholds: {
    committeeNoConfidence: number
    committeeNormal: number
    hardForkInitiation: number
    motionNoConfidence: number
    ppSecurityGroup: number
  }
  protocolVersion: {
    major: number
    minor: number
  }
  stakeAddressDeposit: number
  stakePoolDeposit: number
  stakePoolTargetNum: number
  treasuryCut: number
  txFeeFixed: number
  txFeePerByte: number
  utxoCostPerByte: number
}

export type NodeInfo = {
  tip: NodeTip
  protocolParameters: ProtocolParameters
}

export type NodeInfoResponse = ApiResponse<NodeInfo>
