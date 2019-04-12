import { IGVSegment } from '../../interface';

export interface SegmentMap 
  extends Array<{source: IGVSegment, map: {startMs: number, endMs?: number}}>{}

export interface IGVTranslation {
  segmentmap: SegmentMap 
  audio: Blob
  length: {ms: number, frames: number}
}
