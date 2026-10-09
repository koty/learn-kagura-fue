import { SectionGroup, TrackItem, PhraseType } from './types';

export interface PhraseColor {
  name: string;
  main: string;
  badgeBg: string;
  bgSubtle: string;
  border: string;
  borderActive: string;
  glow: string;
  pillBg: string;
}

export const PHRASE_COLORS: Record<PhraseType, PhraseColor> = {
  '1': {
    name: '瑠璃 (るり)',
    main: '#38bdf8', // sky-400
    badgeBg: 'bg-sky-500',
    bgSubtle: 'bg-sky-950/40',
    border: 'border-sky-500/30',
    borderActive: 'border-sky-400',
    glow: 'rgba(56, 189, 248, 0.45)',
    pillBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40'
  },
  '2': {
    name: '常磐 (ときわ)',
    main: '#34d399', // emerald-400
    badgeBg: 'bg-emerald-500',
    bgSubtle: 'bg-emerald-950/40',
    border: 'border-emerald-500/30',
    borderActive: 'border-emerald-400',
    glow: 'rgba(52, 211, 153, 0.45)',
    pillBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  },
  '3': {
    name: '山吹 (やまぶき)',
    main: '#fb923c', // orange-400
    badgeBg: 'bg-orange-500',
    bgSubtle: 'bg-orange-950/40',
    border: 'border-orange-500/30',
    borderActive: 'border-orange-400',
    glow: 'rgba(251, 146, 60, 0.45)',
    pillBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40'
  },
  '4': {
    name: '藤紫 (ふじむらさき)',
    main: '#c084fc', // purple-400
    badgeBg: 'bg-purple-500',
    bgSubtle: 'bg-purple-950/40',
    border: 'border-purple-500/30',
    borderActive: 'border-purple-400',
    glow: 'rgba(192, 132, 252, 0.45)',
    pillBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
  },
  '5': {
    name: '紅 (くれない)',
    main: '#f43f5e', // rose-500
    badgeBg: 'bg-rose-500',
    bgSubtle: 'bg-rose-950/40',
    border: 'border-rose-500/30',
    borderActive: 'border-rose-400',
    glow: 'rgba(244, 63, 94, 0.45)',
    pillBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
  },
  '6': {
    name: '浅葱 (あさぎ)',
    main: '#2dd4bf', // teal-400
    badgeBg: 'bg-teal-500',
    bgSubtle: 'bg-teal-950/40',
    border: 'border-teal-500/30',
    borderActive: 'border-teal-400',
    glow: 'rgba(45, 212, 191, 0.45)',
    pillBg: 'bg-teal-500/20 text-teal-300 border-teal-500/40'
  },
  'A': {
    name: '朱赤 (しゅあか)',
    main: '#ef4444', // red-500
    badgeBg: 'bg-red-500',
    bgSubtle: 'bg-red-950/40',
    border: 'border-red-500/30',
    borderActive: 'border-red-400',
    glow: 'rgba(239, 68, 68, 0.45)',
    pillBg: 'bg-red-500/20 text-red-300 border-red-500/40'
  },
  'B': {
    name: '黄金 (こがね)',
    main: '#eab308', // yellow-500
    badgeBg: 'bg-amber-500',
    bgSubtle: 'bg-amber-950/40',
    border: 'border-amber-500/30',
    borderActive: 'border-amber-400',
    glow: 'rgba(234, 179, 8, 0.45)',
    pillBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  },
  'C': {
    name: '藍 (あい)',
    main: '#6366f1', // indigo-500
    badgeBg: 'bg-indigo-500',
    bgSubtle: 'bg-indigo-950/40',
    border: 'border-indigo-500/30',
    borderActive: 'border-indigo-400',
    glow: 'rgba(99, 102, 241, 0.45)',
    pillBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
  },
  'D': {
    name: '青竹 (あおたけ)',
    main: '#10b981', // emerald-500
    badgeBg: 'bg-teal-600',
    bgSubtle: 'bg-teal-950/40',
    border: 'border-teal-500/30',
    borderActive: 'border-teal-400',
    glow: 'rgba(16, 185, 129, 0.45)',
    pillBg: 'bg-teal-500/20 text-teal-300 border-teal-500/40'
  },
  'other': {
    name: '墨 (すみ)',
    main: '#94a3b8', // slate-400
    badgeBg: 'bg-slate-600',
    bgSubtle: 'bg-slate-900/60',
    border: 'border-slate-700/60',
    borderActive: 'border-slate-400',
    glow: 'rgba(148, 163, 184, 0.3)',
    pillBg: 'bg-slate-800 text-slate-300 border-slate-700'
  }
};

export const SONG_SECTIONS: SectionGroup[] = [
  {
    id: 'intro',
    majorPart: '前奏',
    subPart: '前奏',
    displayName: '前奏',
    description: '曲の始まり（導入演奏）',
    tracks: [
      {
        id: '00',
        order: 0,
        fileName: '00前奏.mp3',
        title: '前奏',
        phraseType: 'other',
        phraseLabel: '前奏',
        sectionId: 'intro',
        subPart: '前奏',
        majorPart: '前奏',
        durationSec: 130
      }
    ]
  },
  {
    id: 'zenhan-zenhan',
    majorPart: '前半',
    subPart: '前半',
    displayName: '前半 - 前半',
    description: '基本となる数字フレーズ ① 〜 ⑥',
    repeatHint: '基本形',
    tracks: [
      {
        id: '01',
        order: 1,
        fileName: '01前半-前半-1.mp3',
        title: 'フレーズ 1',
        phraseType: '1',
        phraseLabel: '①',
        sectionId: 'zenhan-zenhan',
        subPart: '前半',
        majorPart: '前半',
        durationSec: 12
      },
      {
        id: '02',
        order: 2,
        fileName: '02前半-前半-2.mp3',
        title: 'フレーズ 2',
        phraseType: '2',
        phraseLabel: '②',
        sectionId: 'zenhan-zenhan',
        subPart: '前半',
        majorPart: '前半',
        durationSec: 10
      },
      {
        id: '03',
        order: 3,
        fileName: '03前半-前半-3.mp3',
        title: 'フレーズ 3',
        phraseType: '3',
        phraseLabel: '③',
        sectionId: 'zenhan-zenhan',
        subPart: '前半',
        majorPart: '前半',
        durationSec: 28
      },
      {
        id: '04',
        order: 4,
        fileName: '04前半-前半-4.mp3',
        title: 'フレーズ 4',
        phraseType: '4',
        phraseLabel: '④',
        sectionId: 'zenhan-zenhan',
        subPart: '前半',
        majorPart: '前半',
        durationSec: 16
      },
      {
        id: '05',
        order: 5,
        fileName: '05前半-前半-5.mp3',
        title: 'フレーズ 5',
        phraseType: '5',
        phraseLabel: '⑤',
        sectionId: 'zenhan-zenhan',
        subPart: '前半',
        majorPart: '前半',
        durationSec: 21
      },
      {
        id: '06',
        order: 6,
        fileName: '06前半-前半-6.mp3',
        title: 'フレーズ 6',
        phraseType: '6',
        phraseLabel: '⑥',
        sectionId: 'zenhan-zenhan',
        subPart: '前半',
        majorPart: '前半',
        durationSec: 14
      }
    ]
  },
  {
    id: 'zenhan-chuhan',
    majorPart: '前半',
    subPart: '中盤',
    displayName: '前半 - 中盤',
    description: 'アルファベットフレーズ A 〜 D',
    repeatHint: '後半で再登場！',
    tracks: [
      {
        id: '07',
        order: 7,
        fileName: '07前半-中盤-A.mp3',
        title: 'フレーズ A',
        phraseType: 'A',
        phraseLabel: 'A',
        sectionId: 'zenhan-chuhan',
        subPart: '中盤',
        majorPart: '前半',
        durationSec: 24
      },
      {
        id: '08',
        order: 8,
        fileName: '08前半-中盤-B.mp3',
        title: 'フレーズ B',
        phraseType: 'B',
        phraseLabel: 'B',
        sectionId: 'zenhan-chuhan',
        subPart: '中盤',
        majorPart: '前半',
        durationSec: 23
      },
      {
        id: '10',
        order: 9,
        fileName: '10前半-中盤-C.mp3',
        title: 'フレーズ C',
        phraseType: 'C',
        phraseLabel: 'C',
        sectionId: 'zenhan-chuhan',
        subPart: '中盤',
        majorPart: '前半',
        durationSec: 17
      },
      {
        id: '08d',
        order: 10,
        fileName: '08前半-中盤-D.mp3',
        title: 'フレーズ D',
        phraseType: 'D',
        phraseLabel: 'D',
        sectionId: 'zenhan-chuhan',
        subPart: '中盤',
        majorPart: '前半',
        durationSec: 27
      }
    ]
  },
  {
    id: 'zenhan-kohan',
    majorPart: '前半',
    subPart: '後半',
    displayName: '前半 - 後半',
    description: 'フレーズ ① 〜 ⑤ の繰り返し（⑥は無し）',
    repeatHint: '前半-前半 ①〜⑤ と同じ',
    tracks: [
      {
        id: '11',
        order: 11,
        fileName: '11前半-後半-1.mp3',
        title: 'フレーズ 1',
        phraseType: '1',
        phraseLabel: '①',
        sectionId: 'zenhan-kohan',
        subPart: '後半',
        majorPart: '前半',
        durationSec: 11
      },
      {
        id: '12',
        order: 12,
        fileName: '12前半-後半-2.mp3',
        title: 'フレーズ 2',
        phraseType: '2',
        phraseLabel: '②',
        sectionId: 'zenhan-kohan',
        subPart: '後半',
        majorPart: '前半',
        durationSec: 11
      },
      {
        id: '13',
        order: 13,
        fileName: '13前半-後半-3.mp3',
        title: 'フレーズ 3',
        phraseType: '3',
        phraseLabel: '③',
        sectionId: 'zenhan-kohan',
        subPart: '後半',
        majorPart: '前半',
        durationSec: 27
      },
      {
        id: '14',
        order: 14,
        fileName: '14前半-後半-4.mp3',
        title: 'フレーズ 4',
        phraseType: '4',
        phraseLabel: '④',
        sectionId: 'zenhan-kohan',
        subPart: '後半',
        majorPart: '前半',
        durationSec: 16
      },
      {
        id: '15',
        order: 15,
        fileName: '15前半-後半-5.mp3',
        title: 'フレーズ 5',
        phraseType: '5',
        phraseLabel: '⑤',
        sectionId: 'zenhan-kohan',
        subPart: '後半',
        majorPart: '前半',
        durationSec: 21
      }
    ]
  },
  {
    id: 'zenhan-kohan-miya',
    majorPart: '前半',
    subPart: '後半宮',
    displayName: '前半 - 後半宮',
    description: '宮バージョン ① 〜 ⑤',
    repeatHint: 'フレーズ ①〜⑤ 宮演奏',
    tracks: [
      {
        id: '16',
        order: 16,
        fileName: '16前半-後半宮-1.mp3',
        title: 'フレーズ 1 (宮)',
        phraseType: '1',
        phraseLabel: '①宮',
        sectionId: 'zenhan-kohan-miya',
        subPart: '後半宮',
        majorPart: '前半',
        durationSec: 10
      },
      {
        id: '17',
        order: 17,
        fileName: '17前半-後半宮-2.mp3',
        title: 'フレーズ 2 (宮)',
        phraseType: '2',
        phraseLabel: '②宮',
        sectionId: 'zenhan-kohan-miya',
        subPart: '後半宮',
        majorPart: '前半',
        durationSec: 11
      },
      {
        id: '18',
        order: 18,
        fileName: '18前半-後半宮-3.mp3',
        title: 'フレーズ 3 (宮)',
        phraseType: '3',
        phraseLabel: '③宮',
        sectionId: 'zenhan-kohan-miya',
        subPart: '後半宮',
        majorPart: '前半',
        durationSec: 28
      },
      {
        id: '19',
        order: 19,
        fileName: '19前半-後半宮-4.mp3',
        title: 'フレーズ 4 (宮)',
        phraseType: '4',
        phraseLabel: '④宮',
        sectionId: 'zenhan-kohan-miya',
        subPart: '後半宮',
        majorPart: '前半',
        durationSec: 16
      },
      {
        id: '20',
        order: 20,
        fileName: '20前半-後半宮-5.mp3',
        title: 'フレーズ 5 (宮)',
        phraseType: '5',
        phraseLabel: '⑤宮',
        sectionId: 'zenhan-kohan-miya',
        subPart: '後半宮',
        majorPart: '前半',
        durationSec: 22
      }
    ]
  },
  {
    id: 'zenhan-musubi',
    majorPart: '前半',
    subPart: '後半結び',
    displayName: '前半 - 結び',
    description: '前半の締めくくり',
    tracks: [
      {
        id: '21',
        order: 21,
        fileName: '21前半-後半.mp3',
        title: '前半結び',
        phraseType: 'other',
        phraseLabel: '結び',
        sectionId: 'zenhan-musubi',
        subPart: '後半結び',
        majorPart: '前半',
        durationSec: 32
      }
    ]
  },
  {
    id: 'kohan-donyu',
    majorPart: '後半',
    subPart: '導入',
    displayName: '後半 - 導入',
    description: '後半への繋ぎ演奏',
    tracks: [
      {
        id: '22',
        order: 22,
        fileName: '22後半-前半.mp3',
        title: '後半導入',
        phraseType: 'other',
        phraseLabel: '導入',
        sectionId: 'kohan-donyu',
        subPart: '導入',
        majorPart: '後半',
        durationSec: 49
      }
    ]
  },
  {
    id: 'kohan-zenhan',
    majorPart: '後半',
    subPart: '前半',
    displayName: '後半 - 前半',
    description: 'A → B → C → D → B (Bを2回反復！)',
    repeatHint: 'A〜D再登場、Bが2回',
    tracks: [
      {
        id: '23',
        order: 23,
        fileName: '23後半-前半-A.mp3',
        title: 'フレーズ A',
        phraseType: 'A',
        phraseLabel: 'A',
        sectionId: 'kohan-zenhan',
        subPart: '前半',
        majorPart: '後半',
        durationSec: 21
      },
      {
        id: '24',
        order: 24,
        fileName: '24後半-前半-B.mp3',
        title: 'フレーズ B (1回目)',
        phraseType: 'B',
        phraseLabel: 'B',
        sectionId: 'kohan-zenhan',
        subPart: '前半',
        majorPart: '後半',
        durationSec: 66
      },
      {
        id: '25',
        order: 25,
        fileName: '25後半-前半-C.mp3',
        title: 'フレーズ C',
        phraseType: 'C',
        phraseLabel: 'C',
        sectionId: 'kohan-zenhan',
        subPart: '前半',
        majorPart: '後半',
        durationSec: 40
      },
      {
        id: '26',
        order: 26,
        fileName: '26後半-前半-D.mp3',
        title: 'フレーズ D',
        phraseType: 'D',
        phraseLabel: 'D',
        sectionId: 'kohan-zenhan',
        subPart: '前半',
        majorPart: '後半',
        durationSec: 27
      },
      {
        id: '27',
        order: 27,
        fileName: '27後半-前半-B.mp3',
        title: 'フレーズ B (2回目)',
        phraseType: 'B',
        phraseLabel: 'B',
        sectionId: 'kohan-zenhan',
        subPart: '前半',
        majorPart: '後半',
        durationSec: 66
      }
    ]
  },
  {
    id: 'kohan-zenhan-miya',
    majorPart: '後半',
    subPart: '前半宮',
    displayName: '後半 - 前半宮',
    description: '宮バージョン C → D → B',
    repeatHint: 'C, D, B 宮演奏',
    tracks: [
      {
        id: '28',
        order: 28,
        fileName: '28後半-前半宮-C.mp3',
        title: 'フレーズ C (宮)',
        phraseType: 'C',
        phraseLabel: 'C宮',
        sectionId: 'kohan-zenhan-miya',
        subPart: '前半宮',
        majorPart: '後半',
        durationSec: 39
      },
      {
        id: '29d',
        order: 29,
        fileName: '29後半-前半宮-D.mp3',
        title: 'フレーズ D (宮)',
        phraseType: 'D',
        phraseLabel: 'D宮',
        sectionId: 'kohan-zenhan-miya',
        subPart: '前半宮',
        majorPart: '後半',
        durationSec: 27
      },
      {
        id: '29b',
        order: 30,
        fileName: '29後半-前半宮-B.mp3',
        title: 'フレーズ B (宮)',
        phraseType: 'B',
        phraseLabel: 'B宮',
        sectionId: 'kohan-zenhan-miya',
        subPart: '前半宮',
        majorPart: '後半',
        durationSec: 64
      }
    ]
  },
  {
    id: 'kohan-kohan',
    majorPart: '後半',
    subPart: '後半',
    displayName: '後半 - 後半（終盤）',
    description: '曲のクライマックスと締めくくり',
    tracks: [
      {
        id: '30',
        order: 31,
        fileName: '30後半-後半.mp3',
        title: '後半結び 1',
        phraseType: 'other',
        phraseLabel: '結び①',
        sectionId: 'kohan-kohan',
        subPart: '後半',
        majorPart: '後半',
        durationSec: 87
      },
      {
        id: '31',
        order: 32,
        fileName: '31後半-後半.mp3',
        title: '後半結び 2 (フィナーレ)',
        phraseType: 'other',
        phraseLabel: '結び②',
        sectionId: 'kohan-kohan',
        subPart: '後半',
        majorPart: '後半',
        durationSec: 74
      }
    ]
  }
];

// フラットな全トラックリスト（再生進行用）
export const ALL_TRACKS: TrackItem[] = SONG_SECTIONS.flatMap(s => s.tracks);

// フレーズ種別ごとのトラック一覧（「どこと同じか」の検索用）
export const PHRASE_GROUPS = ALL_TRACKS.reduce<Record<PhraseType, TrackItem[]>>((acc, track) => {
  if (track.phraseType !== 'other') {
    if (!acc[track.phraseType]) acc[track.phraseType] = [];
    acc[track.phraseType].push(track);
  }
  return acc;
}, {} as Record<PhraseType, TrackItem[]>);
