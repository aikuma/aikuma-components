import { Gesture } from '@aikuma/gestate'

export interface IGVBundle {
  imageurls: string[]
  audiourls: string[]
  segments: {id?: string, startMs: number, endMs?: number, gestures: Gesture[]}[]
}
