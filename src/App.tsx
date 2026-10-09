import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Repeat,
  Repeat1,
  RotateCcw,
  Sparkles,
  BookOpen,
  Music,
  Layers,
  Volume2,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Flame,
} from 'lucide-react';
import { TrackItem, SectionGroup, PhraseType, PlayMode } from './types';
import {
  SONG_SECTIONS,
  ALL_TRACKS,
  PHRASE_COLORS,
  PHRASE_GROUPS,
} from './songData';

export default function App() {
  // 再生状態
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [playMode, setPlayMode] = useState<PlayMode>('continuous'); // continuous | section-loop | single
  const [hoveredPhraseType, setHoveredPhraseType] = useState<PhraseType | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'structure' | 'compare'>('all');
  const [selectedPhraseForCompare, setSelectedPhraseForCompare] = useState<PhraseType>('1');

  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  // 音声の停止
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  // トラック再生
  const playTrack = useCallback(
    (index: number) => {
      if (index < 0 || index >= ALL_TRACKS.length) return;

      const track = ALL_TRACKS[index];
      stopAudio();

      const audio = new Audio(`/audio/${encodeURIComponent(track.fileName)}`);
      audio.playbackRate = playbackRate;
      audioRef.current = audio;

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
      };

      audio.onloadedmetadata = () => {
        setDuration(audio.duration);
      };

      audio.onended = () => {
        setIsPlaying(false);

        if (playMode === 'continuous') {
          // 通し再生：次のトラックへ
          if (index + 1 < ALL_TRACKS.length) {
            playTrack(index + 1);
          } else {
            setCurrentTrackIndex(null);
          }
        } else if (playMode === 'section-loop') {
          // セクション内ループ
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
          // 単発再生
          setCurrentTrackIndex(null);
        }
      };

      audio
        .play()
        .then(() => {
          setCurrentTrackIndex(index);
          setIsPlaying(true);
        })
        .catch(err => {
          console.error('Playback error:', err);
          setIsPlaying(false);
        });
    },
    [playbackRate, playMode, stopAudio]
  );

  // 再生 / 一時停止
  const togglePlayPause = useCallback(() => {
    if (!audioRef.current || currentTrackIndex === null) {
      playTrack(0);
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error(err));
    }
  }, [isPlaying, currentTrackIndex, playTrack]);

  // 前へ
  const handlePrev = useCallback(() => {
    if (currentTrackIndex === null) return;
    if (currentTime > 2) {
      if (audioRef.current) audioRef.current.currentTime = 0;
      return;
    }
    const prevIndex = Math.max(0, currentTrackIndex - 1);
    playTrack(prevIndex);
  }, [currentTrackIndex, currentTime, playTrack]);

  // 次へ
  const handleNext = useCallback(() => {
    if (currentTrackIndex === null) return;
    const nextIndex = Math.min(ALL_TRACKS.length - 1, currentTrackIndex + 1);
    playTrack(nextIndex);
  }, [currentTrackIndex, playTrack]);

  // 再生速度
  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* タイトル & ロゴ */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-red-800 text-white font-bold flex items-center justify-center shadow-lg shadow-rose-900/40 border border-rose-500/30 text-lg tracking-wider">
              笛
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white font-serif flex items-center gap-1.5">
                  神楽笛 旋律・リピート暗記帖
                </h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  全33節
                </span>
              </div>
              <p className="text-xs text-slate-400">楽譜のないお祭りの笛曲を、反復構造の可視化で覚える学習ナビ</p>
            </div>
          </div>

          {/* ナビゲーションタブ */}
          <nav className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              曲の全景マップ
            </button>
            <button
              onClick={() => setActiveTab('structure')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'structure'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              暗記の秘訣（要約）
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'compare'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              同フレーズ聴き比べ
            </button>
          </nav>
        </div>
      </header>

      {/* --- メインコンテンツ --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full relative z-10 flex-1">
        {/* --- 現在再生中の同調案内バナー --- */}
        {currentTrack && (
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-slate-900/95 border border-slate-700/80 p-4 sm:p-5 shadow-2xl relative overflow-hidden backdrop-blur-md">
            {/* アンビエント発光背景 */}
            <div
              className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none"
              style={{ backgroundColor: PHRASE_COLORS[currentTrack.phraseType].main }}
            />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
              {/* 再生中タイトルとバッジ */}
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl ${PHRASE_COLORS[currentTrack.phraseType].badgeBg} text-white font-extrabold text-2xl flex items-center justify-center shadow-lg border border-white/20 shrink-0 transform transition-transform animate-pulse`}
                  style={{
                    boxShadow: `0 0 20px ${PHRASE_COLORS[currentTrack.phraseType].glow}`,
                  }}
                >
                  {currentTrack.phraseLabel}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                      NOW PLAYING
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      [{currentTrack.majorPart} - {currentTrack.subPart}]
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    {currentTrack.title}
                    <span className="text-xs font-normal text-slate-400">
                      (通し #{currentTrack.order})
                    </span>
                  </h2>
                </div>
              </div>

              {/* 同フレーズ登場箇所のクイックリンク */}
              {currentTrack.phraseType !== 'other' && matchingTracks.length > 1 && (
                <div className="w-full md:w-auto bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 backdrop-blur-sm">
                  <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      同じフレーズ「{currentTrack.phraseType}」（{PHRASE_COLORS[currentTrack.phraseType].name}）の全登場箇所:
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-bold">
                      全{matchingTracks.length}回
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {matchingTracks.map(t => {
                      const isSelf = t.id === currentTrack.id;
                      const globalIdx = ALL_TRACKS.findIndex(item => item.id === t.id);
                      return (
                        <button
                          key={t.id}
                          onClick={() => playTrack(globalIdx)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                            isSelf
                              ? `${PHRASE_COLORS[t.phraseType].badgeBg} text-white font-bold shadow-md ring-2 ring-white/30`
                              : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700'
                          }`}
                        >
                          <span>{t.subPart}</span>
                          <span className="text-[10px] opacity-80">({t.phraseLabel})</span>
                          {isSelf && <span className="text-[9px] bg-black/30 px-1 rounded">演奏中</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- フレーズ色分け凡例バー --- */}
        <div className="mb-6 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="font-bold text-slate-200">フレーズ色分け凡例:</span>
            <span className="hidden sm:inline">同じ色の節は同じメロディです（タップでハイライト）</span>
          </div>

          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {(['1', '2', '3', '4', '5', '6', 'A', 'B', 'C', 'D'] as PhraseType[]).map(type => {
              const count = PHRASE_GROUPS[type]?.length || 0;
              const isSelected = hoveredPhraseType === type;
              const color = PHRASE_COLORS[type];

              return (
                <button
                  key={type}
                  onClick={() => setHoveredPhraseType(prev => (prev === type ? null : type))}
                  onMouseEnter={() => setHoveredPhraseType(type)}
                  onMouseLeave={() => setHoveredPhraseType(null)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                    isSelected
                      ? `${color.badgeBg} text-white shadow-lg shadow-black/50 border-white/40 scale-105`
                      : `${color.pillBg} hover:brightness-125`
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current opacity-80" />
                  <span>{type}</span>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: 曲の全景マップ */}
        {/* ============================================================== */}
        {activeTab === 'all' && (
          <div className="space-y-8">
            {/* 曲全体の通しタイムライン（パノラマ・ミニマップ） */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-300">曲全体の通し進行バー（全33節）</span>
                </div>
                <span className="text-[11px] text-slate-400">タップした位置から再生</span>
              </div>

              {/* 33個のブロックバー */}
              <div className="flex gap-1 h-9 bg-slate-950 p-1 rounded-xl border border-slate-800/80 overflow-x-auto items-center">
                {ALL_TRACKS.map((t, idx) => {
                  const isCurrent = currentTrackIndex === idx;
                  const isSamePhrase =
                    !isCurrent &&
                    currentTrack &&
                    currentTrack.phraseType !== 'other' &&
                    currentTrack.phraseType === t.phraseType;
                  const color = PHRASE_COLORS[t.phraseType];

                  return (
                    <button
                      key={t.id}
                      onClick={() => playTrack(idx)}
                      title={`#${t.order} ${t.title} (${t.subPart})`}
                      className={`h-full min-w-[20px] flex-1 rounded-md text-[10px] font-bold flex items-center justify-center transition-all relative group ${
                        isCurrent
                          ? 'bg-white text-slate-950 shadow-lg ring-2 ring-rose-500 scale-110 z-10'
                          : isSamePhrase
                          ? `${color.badgeBg} text-white ring-2 ring-white/60 animate-pulse`
                          : `${color.badgeBg} text-white/90 opacity-60 hover:opacity-100 hover:scale-105`
                      }`}
                    >
                      {t.phraseType !== 'other' ? t.phraseType : '・'}
                      {/* ホバーツールチップ */}
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-800 text-[10px] text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity border border-slate-700 shadow-lg z-20">
                        #{t.order} {t.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 各セクションブロックごとのカードグリッド */}
            <div className="space-y-6">
              {SONG_SECTIONS.map((section: SectionGroup) => (
                <section
                  key={section.id}
                  className="rounded-2xl bg-slate-900/60 border border-slate-800/90 p-4 sm:p-5 shadow-xl backdrop-blur-sm relative overflow-hidden"
                >
                  {/* セクション上部見出し */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-extrabold px-2.5 py-0.5 rounded-md text-white ${
                          section.majorPart === '前奏'
                            ? 'bg-slate-700'
                            : section.majorPart === '前半'
                            ? 'bg-blue-600'
                            : 'bg-rose-700'
                        }`}
                      >
                        {section.majorPart}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                        {section.displayName}
                      </h3>
                      <span className="text-xs text-slate-400 hidden sm:inline">
                        — {section.description}
                      </span>
                    </div>

                    {section.repeatHint && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 self-start sm:self-auto">
                        <Sparkles className="w-3 h-3" />
                        {section.repeatHint}
                      </span>
                    )}
                  </div>

                  {/* セクション内フレーズカード */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
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

                      return (
                        <div
                          key={track.id}
                          onClick={() => playTrack(globalIndex)}
                          onMouseEnter={() =>
                            track.phraseType !== 'other' && setHoveredPhraseType(track.phraseType)
                          }
                          onMouseLeave={() => setHoveredPhraseType(null)}
                          className={`rounded-2xl p-3.5 flex flex-col justify-between transition-all duration-300 cursor-pointer relative group ${
                            isCurrent
                              ? 'bg-slate-900 border-2 border-rose-500 shadow-2xl scale-[1.03] z-10'
                              : isSamePhrase
                              ? 'bg-slate-900/90 border-2 border-dashed border-white/80 shadow-xl shadow-rose-950/20'
                              : isHovered
                              ? 'bg-slate-800/90 border-slate-500 shadow-lg -translate-y-0.5'
                              : 'bg-slate-950/60 hover:bg-slate-900/80 border border-slate-800/90 hover:border-slate-700'
                          }`}
                          style={{
                            boxShadow: isCurrent
                              ? `0 0 25px ${color.glow}`
                              : isSamePhrase
                              ? `0 0 15px ${color.glow}`
                              : undefined,
                          }}
                        >
                          {/* 再生中バッジ */}
                          {isCurrent && (
                            <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-600 text-white tracking-wider flex items-center gap-1 shadow-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                              演奏中
                            </span>
                          )}

                          {/* 同期ハイライトバッジ */}
                          {isSamePhrase && (
                            <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-slate-950 tracking-wider shadow-md">
                              同調中
                            </span>
                          )}

                          {/* 上部: 番号 & 秒数 */}
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 font-medium">
                            <span>#{track.order}</span>
                            {track.durationSec && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {track.durationSec}s
                              </span>
                            )}
                          </div>

                          {/* 中央: 家紋風 フレーズ大シンボル */}
                          <div className="flex items-center justify-center my-2">
                            <div
                              className={`w-12 h-12 rounded-2xl ${color.badgeBg} text-white font-extrabold text-xl flex items-center justify-center shadow-lg border border-white/20 transition-transform group-hover:scale-105`}
                            >
                              {track.phraseLabel}
                            </div>
                          </div>

                          {/* 下部: タイトル */}
                          <div className="text-center mt-1">
                            <p className="text-xs font-bold text-slate-200 truncate">
                              {track.title}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {color.name}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: 暗記の秘訣（要約フロー） */}
        {/* ============================================================== */}
        {activeTab === 'structure' && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-rose-500" />
                <h2 className="text-lg font-bold text-white">
                  お祭り笛 楽曲暗記の核心ルール（どこを繰り返すのか？）
                </h2>
              </div>
              <p className="text-sm text-slate-400 mb-6">
                楽譜がない伝承曲は、各節の音自体よりも「曲全体の中でどこへ展開し、何を繰り返すか」の分岐点を身体に染み込ませることが最重要です。
              </p>

              {/* ルールカード 1 */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 to-slate-900 border border-blue-500/30 mb-5 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-xs font-bold">
                    前半の鉄則
                  </span>
                  <h3 className="text-base font-bold text-white">
                    ①〜⑥を吹いた後、中盤を挟んで「①〜⑤」が2連続！
                  </h3>
                </div>
                <p className="text-xs text-blue-200/80 mb-4 leading-relaxed">
                  曲の出だしは <b>①〜⑥</b>（6まで行く）です。その後、中盤（A〜D）を挟んだら、
                  次は <b>①〜⑤</b>（6は吹かない！）を通常バージョンと「宮」バージョンで <b>2回連続</b> 演奏します。
                </p>

                {/* 進行図 */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <div className="px-3 py-1.5 rounded-xl bg-blue-900/60 border border-blue-500/40 text-blue-200">
                    前半-前半: ① ② ③ ④ ⑤ ⑥
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <div className="px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200">
                    前半-中盤: A B C D
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <div className="px-3 py-1.5 rounded-xl bg-blue-900/90 border border-blue-400 text-white ring-2 ring-blue-500/50">
                    前半-後半: ① ② ③ ④ ⑤
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <div className="px-3 py-1.5 rounded-xl bg-indigo-900/90 border border-indigo-400 text-white ring-2 ring-indigo-500/50">
                    前半-後半宮: ① ② ③ ④ ⑤
                  </div>
                </div>
              </div>

              {/* ルールカード 2 */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/30 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded bg-amber-600 text-white text-xs font-bold">
                    後半の鉄則
                  </span>
                  <h3 className="text-base font-bold text-white">
                    中盤の「A〜D」が再登場！そして最後に【B】をもう一度吹く！
                  </h3>
                </div>
                <p className="text-xs text-amber-200/80 mb-4 leading-relaxed">
                  後半では中盤で吹いたフレーズが戻ってきます。
                  <b>A ➔ B ➔ C ➔ D ➔ B</b> という順で、<b>「B」を最後にもう一度反復する</b>のが一番のポイントです。
                  その後の宮演奏では <b>C ➔ D ➔ B</b> で締めくくられます。
                </p>

                {/* 進行図 */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <div className="px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200">
                    前半-中盤: A ➔ B ➔ C ➔ D
                  </div>
                  <span className="text-slate-500">➔【後半で変化】➔</span>
                  <div className="px-3 py-1.5 rounded-xl bg-amber-900/90 border border-amber-400 text-white ring-2 ring-amber-500/50 font-bold">
                    後半-前半: A ➔ B ➔ C ➔ D ➔ <span className="text-yellow-300 underline">B(反復!)</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <div className="px-3 py-1.5 rounded-xl bg-orange-950/80 border border-orange-500/40 text-orange-200">
                    後半宮: C ➔ D ➔ B
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: 同フレーズ聴き比べ */}
        {/* ============================================================== */}
        {activeTab === 'compare' && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-rose-500" />
                <h2 className="text-lg font-bold text-white">
                  同じフレーズの各テイク・ニュアンス聴き比べ
                </h2>
              </div>
              <p className="text-sm text-slate-400 mb-6">
                フレーズ記号を選ぶと、通常・後半・宮バージョンなどの演奏テイクを並べて集中的に比較再生できます。
              </p>

              {/* フレーズ選択セレクタ */}
              <div className="flex flex-wrap gap-2 mb-6">
                {(['1', '2', '3', '4', '5', '6', 'A', 'B', 'C', 'D'] as PhraseType[]).map(type => {
                  const isSelected = selectedPhraseForCompare === type;
                  const color = PHRASE_COLORS[type];

                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedPhraseForCompare(type)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border flex items-center gap-2 ${
                        isSelected
                          ? `${color.badgeBg} text-white shadow-lg shadow-black/50 border-white/50 scale-105`
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      <span>フレーズ {type}</span>
                      <span className="text-xs opacity-75 font-normal">({color.name})</span>
                    </button>
                  );
                })}
              </div>

              {/* 選択されたフレーズの全テイク一覧 */}
              <div className="space-y-3">
                {(PHRASE_GROUPS[selectedPhraseForCompare] || []).map((track: TrackItem) => {
                  const globalIdx = ALL_TRACKS.findIndex(t => t.id === track.id);
                  const isCurrent = currentTrackIndex === globalIdx;
                  const color = PHRASE_COLORS[track.phraseType];

                  return (
                    <div
                      key={track.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-slate-900 border-rose-500 shadow-xl ring-1 ring-rose-500/50'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-xl ${color.badgeBg} text-white font-bold flex items-center justify-center text-lg shadow-md shrink-0`}
                        >
                          {track.phraseLabel}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            {track.majorPart} - {track.subPart} ({track.title})
                            {isCurrent && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                                再生中
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5 font-mono">
                            通し #{track.order} • 長さ: {track.durationSec}秒 • 音源: {track.fileName}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (isCurrent && isPlaying) {
                            togglePlayPause();
                          } else {
                            playTrack(globalIdx);
                          }
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all self-end sm:self-auto ${
                          isCurrent && isPlaying
                            ? 'bg-rose-600 text-white shadow-lg shadow-rose-950'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                      >
                        {isCurrent && isPlaying ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            一時停止
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            このテイクを再生
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* フローティング・プレイヤー（Apple風グラスモーフィズム・ドック） */}
      {/* ============================================================== */}
      <div className="fixed bottom-3 inset-x-3 sm:inset-x-6 max-w-4xl mx-auto z-50">
        <div className="rounded-2xl bg-slate-900/90 backdrop-blur-2xl border border-slate-700/80 p-3 sm:p-4 shadow-2xl shadow-black/80">
          {/* プログレスバー */}
          <div className="mb-2">
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden relative cursor-pointer">
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
            <div className="flex items-center gap-2 justify-end flex-1">
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