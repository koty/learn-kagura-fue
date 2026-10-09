export type PhraseType = '1' | '2' | '3' | '4' | '5' | '6' | 'A' | 'B' | 'C' | 'D' | 'other';

export interface TrackItem {
  id: string;
  order: number;
  fileName: string;
  title: string;
  phraseType: PhraseType;
  phraseLabel: string;
  sectionId: string;
  subPart: string;
  majorPart: '前奏' | '前半' | '後半';
  durationSec?: number;
}

export interface SectionGroup {
  id: string;
  majorPart: '前奏' | '前半' | '後半';
  subPart: string;
  displayName: string;
  description: string;
  repeatHint?: string;
  tracks: TrackItem[];
}

export type PlayMode = 'continuous' | 'single' | 'section-loop';