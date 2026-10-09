import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Repeat,
  Repeat1,
  RotateCcw,
  Sparkles,
  Music,
  Flame,
} from 'lucide-react';
import { TrackItem, SectionGroup, PhraseType, PlayMode } from './types';
import {
  ALL_TRACKS,
  PHRASE_COLORS,
  PHRASE_GROUPS,
  MAJOR_GROUPS,
  MajorGroup,
} from './songData';

// --- Web Audio API エンジン ---
let audioCtx: AudioContext | null = null;

function unlockAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioCtxClass();
    (window as any).__audioCtx = audioCtx;
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function getAudioContext(): AudioContext {
  return unlockAudioContext();
}

// デコード済みバッファのキャッシュ（生音源 & デクリック処理済み音源）
const rawBufferCache = new Map<string, AudioBuffer>();
const declickedBufferCache = new Map<string, AudioBuffer>();

/**
 * 音声バッファを取得し、デクリック（先頭/末尾のマイクロフェード）を適用する
 */
async function loadAudioBuffer(fileName: string, declick: boolean): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  const url = `/audio/${encodeURIComponent(fileName)}`;
  console.log('>>> [loadAudioBuffer START]', url);

  let raw = rawBufferCache.get(url);
  if (!raw) {
    console.log('>>> [loadAudioBuffer] fetching:', url);
    const res = await fetch(url);
    if (!res.ok) {
      console.error('>>> [loadAudioBuffer] fetch failed! status:', res.status, url);
      throw new Error(`Fetch failed with status ${res.status}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    console.log('>>> [loadAudioBuffer] decoding audio data for:', url, 'bytes:', arrayBuffer.byteLength);
    raw = await ctx.decodeAudioData(arrayBuffer);
    console.log('>>> [loadAudioBuffer] decode success! duration:', raw.duration);
    rawBufferCache.set(url, raw);
  }

  if (!declick) return raw;

  let declicked = declickedBufferCache.get(url);
  if (!declicked) {
    declicked = ctx.createBuffer(raw.numberOfChannels, raw.length, raw.sampleRate);
    const fadeSamplesIn = Math.min(Math.floor(raw.sampleRate * 0.025), raw.length);
    const fadeSamplesOut = Math.min(Math.floor(raw.sampleRate * 0.04), raw.length);

    for (let ch = 0; ch < raw.numberOfChannels; ch++) {
      const srcData = raw.getChannelData(ch);
      const dstData = declicked.getChannelData(ch);
      dstData.set(srcData);

      // 1. 演奏内部の2秒周期バッファ段差（プツプツ音の本体）を検出してコサイン補間
      for (let i = 2; i < dstData.length - 10; i++) {
        const d2 = dstData[i] - 2 * dstData[i - 1] + dstData[i - 2];
        // 笛の音にはない急激なステップ段差 (|d2| > 0.09) を検出
        if (Math.abs(d2) > 0.09) {
          const left = i - 2;
          const right = i + 6;
          const valL = dstData[left];
          const valR = dstData[right];
          for (let idx = left; idx <= right; idx++) {
            const prog = (idx - left) / (right - left);
            const factor = 0.5 * (1 - Math.cos(Math.PI * prog));
            dstData[idx] = valL + (valR - valL) * factor;
          }
          i = right; // 補間区間をスキップ
        }
      }

      // 2. 先頭フェードイン（0 -> 1）
      for (let i = 0; i < fadeSamplesIn; i++) {
        const factor = 0.5 * (1 - Math.cos((Math.PI * i) / fadeSamplesIn));
        dstData[i] *= factor;
      }
      // 3. 末尾フェードアウト（1 -> 0）
      const len = raw.length;
      for (let i = 0; i < fadeSamplesOut; i++) {
        const factor = 0.5 * (1 + Math.cos((Math.PI * i) / fadeSamplesOut));
        dstData[len - fadeSamplesOut + i] *= factor;
      }
    }
    declickedBufferCache.set(url, declicked);
  }

  return declicked;
}

export default function App() {
  // 再生状態
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [playMode, setPlayMode] = useState<PlayMode>('continuous'); // continuous | section-loop | single
  const [hoveredPhraseType, setHoveredPhraseType] = useState<PhraseType | null>(null);

  // プチ音軽減 (De-click) モード（改善時まで一旦OFF）
  const isDeclickEnabled = false;

  // Web Audio 再生制御用のRef
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const activeGainRef = useRef<GainNode | null>(null);
  const activeFilterRef = useRef<BiquadFilterNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const isManuallyStoppingRef = useRef<boolean>(false);

  // 現在再生中のトラック
  const currentTrack: TrackItem | null = useMemo(() => {
    if (currentTrackIndex === null) return null;
    return ALL_TRACKS[currentTrackIndex] || null;
  }, [currentTrackIndex]);

  // 現在再生中のフレーズと同じフレーズを持つ全トラック
  const matchingTracks: TrackItem[] = useMemo(() => {
    if (!currentTrack || currentTrack.phraseType === 'other') return [];
    return PHRASE_GROUPS[currentTrack.phraseType] || [];
  }, [currentTrack]);

  // 初回タップ時の Web Audio アンロック（iOS Safari / Chrome Autoplay Policy 対策）
  useEffect(() => {
    const unlock = () => {
      unlockAudioContext();
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('click', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // 進行状況の定期更新
  const stopProgressLoop = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const startProgressLoop = useCallback((trackDuration: number) => {
    stopProgressLoop();
    const update = () => {
      if (!audioCtx) return;
      const elapsed = (audioCtx.currentTime - startTimeRef.current) * playbackRate + pausedAtRef.current;
      setCurrentTime(Math.min(elapsed, trackDuration));
      if (elapsed < trackDuration) {
        rafIdRef.current = requestAnimationFrame(update);
      }
    };
    rafIdRef.current = requestAnimationFrame(update);
  }, [playbackRate, stopProgressLoop]);

  // 音声の停止（マイクロフェードアウトでクリックを完全に防ぐ）
  const stopAudio = useCallback((instant = false) => {
    isManuallyStoppingRef.current = true;
    stopProgressLoop();

    const ctx = audioCtx;
    const gain = activeGainRef.current;
    const source = activeSourceRef.current;

    // 手動停止時は onended リスナーを即座に破棄（次のトラックへの誤進行を完全防止）
    if (source) {
      source.onended = null;
    }

    if (gain && ctx && !instant) {
      // 20ms かけてボリュームを滑らかに 0 に落とす
      try {
        gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.02);
      } catch {
        // ignore
      }
      setTimeout(() => {
        try {
          source?.stop();
        } catch {
          // ignore
        }
      }, 25);
    } else {
      try {
        source?.stop();
      } catch {
        // ignore
      }
    }

    activeSourceRef.current = null;
    activeGainRef.current = null;
    activeFilterRef.current = null;
    setIsPlaying(false);
  }, [stopProgressLoop]);

  // トラック再生
  const playTrack = useCallback(
    async (index: number, startOffset = 0) => {
      if (index < 0 || index >= ALL_TRACKS.length) {
        console.warn('Index out of bounds:', index);
        return;
      }

      const track = ALL_TRACKS[index];
      stopAudio(false);

      const ctx = unlockAudioContext();
      if (ctx.state === 'suspended') {
        try {
          await Promise.race([
            ctx.resume(),
            new Promise(resolve => setTimeout(resolve, 150))
          ]);
        } catch {
          // ignore
        }
      }

      try {
        const buffer = await loadAudioBuffer(track.fileName, isDeclickEnabled);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = playbackRate;

        // ハイパスフィルター（80Hz以下をカットし、息の吹かれ音や低域ポップノイズを除去）
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = isDeclickEnabled ? 85 : 10;

        // ゲインノード
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(1, ctx.currentTime);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        activeSourceRef.current = source;
        activeGainRef.current = gain;
        activeFilterRef.current = filter;

        const effectiveDuration = buffer.duration;
        setDuration(effectiveDuration);
        pausedAtRef.current = startOffset;
        startTimeRef.current = ctx.currentTime;
        isManuallyStoppingRef.current = false;

        setCurrentTrackIndex(index);
        setIsPlaying(true);

        source.start(0, startOffset);
        startProgressLoop(effectiveDuration);

        source.onended = () => {
          if (activeSourceRef.current !== source || isManuallyStoppingRef.current) return;
          stopProgressLoop();
          setIsPlaying(false);
          pausedAtRef.current = 0;
          setCurrentTime(0);

          // 再生モードに応じた次トラック処理
          if (playMode === 'continuous') {
            if (index + 1 < ALL_TRACKS.length) {
              playTrack(index + 1);
            } else {
              setCurrentTrackIndex(null);
            }
          } else if (playMode === 'section-loop') {
            const currentSectionId = track.sectionId;
            const sectionTracks = ALL_TRACKS.filter(t => t.sectionId === currentSectionId);
            const currentIndexInSection = sectionTracks.findIndex(t => t.id === track.id);

            if (currentIndexInSection + 1 < sectionTracks.length) {
              const nextTrack = sectionTracks[currentIndexInSection + 1];
              const nextGlobalIndex = ALL_TRACKS.findIndex(t => t.id === nextTrack.id);
              playTrack(nextGlobalIndex);
            } else {
              const firstTrack = sectionTracks[0];
              const firstGlobalIndex = ALL_TRACKS.findIndex(t => t.id === firstTrack.id);
              playTrack(firstGlobalIndex);
            }
          } else {
            setCurrentTrackIndex(null);
          }
        };
      } catch (err) {
        console.error('Audio playback error:', err);
        setIsPlaying(false);
      }
    },
    [isDeclickEnabled, playbackRate, playMode, stopAudio, startProgressLoop, stopProgressLoop]
  );

  // 再生 / 一時停止切り替え
  const togglePlayPause = useCallback(() => {
    unlockAudioContext();
    if (currentTrackIndex === null) {
      playTrack(0);
      return;
    }

    if (isPlaying) {
      // 一時停止
      if (audioCtx) {
        const elapsed = (audioCtx.currentTime - startTimeRef.current) * playbackRate + pausedAtRef.current;
        pausedAtRef.current = elapsed;
      }
      stopAudio(false);
    } else {
      // 再開
      playTrack(currentTrackIndex, pausedAtRef.current);
    }
  }, [currentTrackIndex, isPlaying, playTrack, playbackRate, stopAudio]);

  // 前へ
  const handlePrev = useCallback(() => {
    unlockAudioContext();
    if (currentTrackIndex === null) return;
    if (currentTime > 2) {
      playTrack(currentTrackIndex, 0);
      return;
    }
    const prevIndex = Math.max(0, currentTrackIndex - 1);
    playTrack(prevIndex, 0);
  }, [currentTrackIndex, currentTime, playTrack]);

  // 次へ
  const handleNext = useCallback(() => {
    unlockAudioContext();
    if (currentTrackIndex === null) return;
    const nextIndex = Math.min(ALL_TRACKS.length - 1, currentTrackIndex + 1);
    playTrack(nextIndex, 0);
  }, [currentTrackIndex, playTrack]);

  // 再生速度の変更
  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (activeSourceRef.current) {
      activeSourceRef.current.playbackRate.value = speed;
    }
  };


  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, handleNext, handlePrev]);

  // 時間フォーマット
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-36 selection:bg-rose-500 selection:text-white">
      {/* 背景の雅やかな光彩効果 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-rose-900/15 via-indigo-900/10 to-transparent blur-3xl opacity-70" />
      </div>

      {/* --- ヘッダー --- */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 shadow-lg shadow-black/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
          {/* タイトル & ロゴ */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 to-red-800 text-white font-bold flex items-center justify-center shadow-lg shadow-rose-900/40 border border-rose-500/30 text-base tracking-wider">
              笛
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white font-serif flex items-center gap-1.5">
                  神楽笛 旋律・リピート暗記帖
                </h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  全33節
                </span>
              </div>
              <p className="text-[11px] text-slate-400">楽譜のないお祭りの笛曲を、反復構造の可視化で覚える学習ナビ</p>
            </div>
          </div>
        </div>
      </header>

      {/* --- メインコンテンツ --- */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 w-full relative z-10 flex-1">
        {/* --- 現在再生中の同調案内バナー --- */}
        {currentTrack && (
          <div className="mb-3 rounded-xl bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-slate-900/95 border border-slate-700/80 p-3 shadow-xl relative overflow-hidden backdrop-blur-md">
            {/* アンビエント発光背景 */}
            <div
              className="absolute -right-20 -top-20 w-48 h-48 rounded-full blur-3xl opacity-25 pointer-events-none"
              style={{ backgroundColor: PHRASE_COLORS[currentTrack.phraseType].main }}
            />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 relative z-10">
              {/* 再生中タイトルとバッジ */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-xl ${PHRASE_COLORS[currentTrack.phraseType].badgeBg} text-white font-black text-xl flex items-center justify-center shadow-md border border-white/20 shrink-0 transform transition-transform animate-pulse`}
                  style={{
                    boxShadow: `0 0 15px ${PHRASE_COLORS[currentTrack.phraseType].glow}`,
                  }}
                >
                  {currentTrack.phraseLabel}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
                      PLAYING
                    </span>
                    <span className="text-xs text-slate-300 font-bold">
                      {currentTrack.majorPart} - {currentTrack.subPart} ({currentTrack.phraseLabel})
                    </span>
                  </div>
                </div>
              </div>

              {/* 同フレーズ登場箇所のクイックリンク */}
              {currentTrack.phraseType !== 'other' && matchingTracks.length > 1 && (
                <div className="w-full md:w-auto bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800/80 backdrop-blur-sm flex items-center gap-2 flex-wrap">
                  <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 shrink-0">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>同じ「{currentTrack.phraseType}」:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {matchingTracks.map(t => {
                      const isSelf = t.id === currentTrack.id;
                      const globalIdx = ALL_TRACKS.findIndex(item => item.id === t.id);
                      return (
                        <button
                          key={t.id}
                          onClick={() => playTrack(globalIdx)}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 ${
                            isSelf
                              ? `${PHRASE_COLORS[t.phraseType].badgeBg} text-white font-bold shadow-sm ring-1 ring-white/40`
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                          }`}
                        >
                          <span>{t.subPart}</span>
                          <span className="text-[10px] opacity-80">({t.phraseLabel})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 曲全体の通しタイムライン（パノラマ・ミニマップ） */}
        <div className="mb-2 p-2 sm:p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-bold text-slate-300">通し進行バー（全33節）</span>
            </div>
            <span className="text-[10px] text-slate-400">タップで再生</span>
          </div>

          {/* 33個のブロックバー */}
          <div className="flex gap-1 h-8 bg-slate-950 p-1 rounded-xl border border-slate-800/80 overflow-x-auto items-center">
            {ALL_TRACKS.map((t, idx) => {
              const isCurrent = currentTrackIndex === idx;
              const isSamePhrase =
                !isCurrent &&
                currentTrack &&
                currentTrack.phraseType !== 'other' &&
                currentTrack.phraseType === t.phraseType;
              const color = PHRASE_COLORS[t.phraseType];
              const minimapLabel =
                t.phraseType !== 'other'
                  ? t.phraseType
                  : t.phraseLabel === '前奏'
                  ? '前'
                  : t.phraseLabel.startsWith('結')
                  ? '結'
                  : t.phraseLabel === '導入'
                  ? '導'
                  : t.phraseLabel;
              const isMultiChar = minimapLabel.length > 1;

              return (
                <button
                  key={t.id}
                  onClick={() => {
                    unlockAudioContext();
                    playTrack(idx);
                  }}
                  title={`#${t.order} ${t.title} (${t.subPart})`}
                  className={`h-full ${
                    isMultiChar ? 'min-w-[22px] text-[9px] px-0.5' : 'min-w-[17px] text-[10px]'
                  } flex-1 rounded-md font-bold flex items-center justify-center transition-all relative group ${
                    isCurrent
                      ? 'bg-slate-950 text-white border-2 scale-110 z-10 font-black'
                      : isSamePhrase
                      ? `${color.badgeBg} text-white ring-2 ring-white/60 animate-pulse`
                      : `${color.badgeBg} text-white/90 opacity-60 hover:opacity-100 hover:scale-105`
                  }`}
                  style={{
                    borderColor: isCurrent ? color.main : undefined,
                    boxShadow: isCurrent ? `0 0 12px ${color.glow}` : undefined,
                  }}
                >
                  {minimapLabel}
                  {/* ホバーツールチップ */}
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-800 text-[10px] text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity border border-slate-700 shadow-lg z-20">
                    #{t.order} {t.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 大項目グルーピング（前奏・前半・後半の3項目で構成） */}
        <div className="space-y-2 sm:space-y-2.5">
          {MAJOR_GROUPS.map((group: MajorGroup) => (
            <div
              key={group.id}
              className="rounded-2xl bg-slate-900/80 border border-slate-800/90 p-2 sm:p-2.5 shadow-md backdrop-blur-sm hover:border-slate-700/80 transition-colors"
            >
              {/* 大項目ヘッダー（項のタイトル） */}
              <div className="flex items-center justify-between mb-1.5 px-1 pb-1 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded text-white shadow-sm ${group.badgeBg}`}
                  >
                    {group.displayName}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    全{group.totalTracks}節
                  </span>
                </div>
                {group.majorPart === '前半' && (
                  <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                    初番 ➔ 中盤 ➔ 後半 ➔ 宮 ➔ 結び
                  </span>
                )}
                {group.majorPart === '後半' && (
                  <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                    導入 ➔ 主旋律 ➔ 宮 ➔ 結び
                  </span>
                )}
              </div>

              {/* 項の中のサブセクション行リスト */}
              <div className="space-y-1 sm:space-y-1.5">
                {group.sections.map((section: SectionGroup) => (
                  <div
                    key={section.id}
                    className="rounded-xl bg-slate-950/45 border border-slate-800/40 px-2 sm:px-2.5 py-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 hover:bg-slate-950/70 transition-colors"
                  >
                    {/* 左側: サブパート名（初番、中盤、後半、宮、結び 等） */}
                    <div className="flex items-center gap-2 min-w-[50px] sm:min-w-[65px] shrink-0">
                      <span className="text-xs font-bold text-slate-300">
                        {section.displayName}
                      </span>
                    </div>

                    {/* 右側: フレーズボックスの横並び（コンパクトな正方形タイル群） */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      {section.tracks.map(track => {
                        const globalIndex = ALL_TRACKS.findIndex(t => t.id === track.id);
                        const isCurrent = currentTrackIndex === globalIndex;
                        const isSamePhrase =
                          !isCurrent &&
                          currentTrack &&
                          currentTrack.phraseType !== 'other' &&
                          currentTrack.phraseType === track.phraseType;
                        const isHovered =
                          hoveredPhraseType !== null &&
                          hoveredPhraseType !== 'other' &&
                          hoveredPhraseType === track.phraseType;
                        const color = PHRASE_COLORS[track.phraseType];
                        const isMultiChar = track.phraseLabel.length > 1;

                        return (
                          <button
                            key={track.id}
                            onClick={() => {
                              unlockAudioContext();
                              playTrack(globalIndex);
                            }}
                            onMouseEnter={() =>
                              track.phraseType !== 'other' && setHoveredPhraseType(track.phraseType)
                            }
                            onMouseLeave={() => setHoveredPhraseType(null)}
                            title={`${track.subPart} ${track.phraseLabel}`}
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-black ${
                              isMultiChar ? 'text-[11px] sm:text-xs tracking-tighter' : 'text-sm sm:text-base'
                            } transition-all duration-150 relative select-none ${
                              isCurrent
                                ? 'bg-slate-950 text-white scale-110 shadow-2xl border-2 z-10'
                                : isSamePhrase
                                ? `${color.badgeBg} text-white ring-2 ring-white animate-pulse shadow-md`
                                : isHovered
                                ? `${color.badgeBg} text-white shadow-lg scale-105 brightness-110`
                                : `${color.badgeBg} text-white/95 opacity-90 hover:opacity-100 hover:scale-105 border border-white/20 shadow-sm`
                            }`}
                            style={{
                              borderColor: isCurrent ? color.main : undefined,
                              boxShadow: isCurrent
                                ? `0 0 18px ${color.glow}, inset 0 0 10px ${color.glow}`
                                : isSamePhrase
                                ? `0 0 10px ${color.glow}`
                                : undefined,
                            }}
                          >
                            {track.phraseLabel}
                            {isCurrent && (
                              <>
                                <span
                                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-ping"
                                  style={{ backgroundColor: color.main }}
                                />
                                <span
                                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                                  style={{ backgroundColor: color.main }}
                                />
                              </>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ============================================================== */}
      {/* フローティング・プレイヤー（Apple風グラスモーフィズム・ドック） */}
      {/* ============================================================== */}
      <div className="fixed bottom-3 inset-x-3 sm:inset-x-6 max-w-4xl mx-auto z-50">
        <div className="rounded-2xl bg-slate-900/90 backdrop-blur-2xl border border-slate-700/80 p-3 sm:p-4 shadow-2xl shadow-black/80">
          {/* プログレスバー */}
          <div className="mb-2">
            <div
              className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden relative cursor-pointer"
              onClick={e => {
                if (!duration || currentTrackIndex === null) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                const targetTime = pos * duration;
                playTrack(currentTrackIndex, targetTime);
              }}
            >
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-150"
                style={{
                  width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            {/* 左側: 現在再生中のトラック情報 */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {currentTrack ? (
                <>
                  <div
                    className={`w-10 h-10 rounded-xl ${PHRASE_COLORS[currentTrack.phraseType].badgeBg} text-white font-extrabold flex items-center justify-center shrink-0 text-base shadow-md`}
                  >
                    {currentTrack.phraseLabel}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-white truncate">
                      {currentTrack.title}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 font-mono">
                      <span>{formatTime(currentTime)}</span>
                      <span>/</span>
                      <span>{formatTime(duration || currentTrack.durationSec || 0)}</span>
                      <span className="hidden sm:inline text-slate-400">({currentTrack.subPart})</span>
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <Music className="w-4 h-4 text-slate-400" />
                  <span>節を選んで再生を開始</span>
                </div>
              )}
            </div>

            {/* 中央: 操作ボタン群 */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* 前へ */}
              <button
                onClick={handlePrev}
                disabled={currentTrackIndex === null || currentTrackIndex === 0}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all"
                title="前の節 (←キー)"
              >
                <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* 再生 / 一時停止 */}
              <button
                onClick={togglePlayPause}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-700 text-white flex items-center justify-center shadow-lg shadow-rose-950/60 hover:scale-105 active:scale-95 transition-all"
                title={isPlaying ? '一時停止 (Spaceキー)' : '再生 (Spaceキー)'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                ) : (
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-0.5" />
                )}
              </button>

              {/* 次へ */}
              <button
                onClick={handleNext}
                disabled={currentTrackIndex === null || currentTrackIndex >= ALL_TRACKS.length - 1}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all"
                title="次の節 (→キー)"
              >
                <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* 右側: 再生モード & 速度 */}
            <div className="flex items-center gap-1.5 sm:gap-2 justify-end flex-1">
              {/* モード切替 */}
              <button
                onClick={() => {
                  const nextMode: Record<PlayMode, PlayMode> = {
                    continuous: 'section-loop',
                    'section-loop': 'single',
                    single: 'continuous',
                  };
                  setPlayMode(nextMode[playMode]);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                  playMode === 'continuous'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : playMode === 'section-loop'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
                title="再生モード切替"
              >
                {playMode === 'continuous' ? (
                  <>
                    <Repeat className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">通し再生</span>
                  </>
                ) : playMode === 'section-loop' ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">段内ループ</span>
                  </>
                ) : (
                  <>
                    <Repeat1 className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">1回のみ</span>
                  </>
                )}
              </button>

              {/* 速度切り替えピル */}
              <div className="hidden sm:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                {[0.8, 1.0, 1.2].map(speed => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                      playbackRate === speed
                        ? 'bg-slate-800 text-rose-400 shadow-sm'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}