import { Slide } from '../../interface';
import { Gesture } from '@aikuma/gestate'

export interface IGVPrompt {
  id: string,
  type: string,
  image?: Slide
}

export interface IGVSegment {
  prompt: IGVPrompt
  startMs: number,
  endMs?: number
  gestures?: Gesture[]
}

export interface IGVData {
  segments: IGVSegment[]
  audio: Blob
  length: {ms: number, frames: number}
}

export interface IGVOptions {
  debug: boolean
}
