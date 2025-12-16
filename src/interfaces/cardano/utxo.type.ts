type Nullable<T> = T | null

export type ReferenceScript = Nullable<{
  scriptLanguage: string
  script: {
    type: 'SimpleScript' | 'PlutusScriptV1' | 'PlutusScriptV2' | 'PlutusScriptV3'
    description: string
    cborHex: string
  }
}>
