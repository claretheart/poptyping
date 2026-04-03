import './style.css'
import { WORDS_LEVEL_1, WORDS_LEVEL_2, WORDS_LEVEL_3, WORDS_LEVEL_4, WORDS_LEVEL_5 } from './words';
import type { Word } from './words';

console.log('Pop Typing: main.ts loading...');

class SoundManager {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
  }

  playPop() {
    this.init();
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx!.currentTime + 0.1);

    gain.gain.setValueAtTime(0.3, this.ctx!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx!.destination);

    osc.start();
    osc.stop(this.ctx!.currentTime + 0.1);
  }

  playMiss() {
    this.init();
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx!.currentTime + 0.2);

    gain.gain.setValueAtTime(0.1, this.ctx!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx!.destination);

    osc.start();
    osc.stop(this.ctx!.currentTime + 0.2);
  }

  playTick() {
    this.init();
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx!.currentTime);

    gain.gain.setValueAtTime(0.1, this.ctx!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx!.destination);

    osc.start();
    osc.stop(this.ctx!.currentTime + 0.05);
  }

  playGo() {
    this.init();
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx!.currentTime);

    gain.gain.setValueAtTime(0.2, this.ctx!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx!.destination);

    osc.start();
    osc.stop(this.ctx!.currentTime + 0.3);
  }

  playWin() {
    this.init();
    const now = this.ctx!.currentTime;

    // 三和音のファンファーレ
    [440, 554.37, 659.25, 880].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);

      gain.gain.setValueAtTime(0.2, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.5);
    });
  }
}

type GameStats = {
  score: number;
  misses: number;
  maxCombo: number;
  totalKeys: number;
  kpm: number;
  correctWordCount: number;
  comboHistory: number[]; // ミスした時のコンボ数を記録
};

// 称号データの定義
const TITLES: any[] = [
  // 特殊称号（隠し要素） - 優先的に判定される
  { id: 'secret-1', title: '奇跡の一粒', class: 'rank-5', isSecret: true, condition: (s: GameStats) => s.totalKeys === 1 && s.score === 10, desc: '1文字だけ打って完走' },
  { id: 'secret-777', title: '幸運のドラジェ', class: 'rank-3', isSecret: true, condition: (s: GameStats) => s.score === 777 || s.score === 7777, desc: '777点または7777点' },
  { id: 'secret-nomiss', title: '純白の生クリーム', class: 'rank-4', isSecret: true, condition: (s: GameStats) => s.misses === 0 && s.score >= 5000, desc: 'ノーミスで5000点以上' },
  { id: 'secret-combo', title: '無限ミルフィーユ', class: 'rank-4', isSecret: true, condition: (s: GameStats) => s.maxCombo >= 100, desc: '100コンボ以上達成' },
  { id: 'secret-reversal', title: '逆転のミルフィーユ', class: 'rank-4', isSecret: true, condition: (s: GameStats) => s.comboHistory.includes(10) && s.maxCombo >= 30, desc: '10連→ミス→30連以上' },
  { id: 'secret-bitter', title: 'ほろ苦いビターチョコ', class: 'rank-0', isSecret: true, condition: (s: GameStats) => s.score === 0 && s.totalKeys > 0, desc: 'スコア0点で終了' },
  { id: 'secret-speed', title: '音速のクレープ職人', class: 'rank-5', isSecret: true, condition: (s: GameStats) => s.kpm >= 400, desc: 'タイピング速度400KPM以上' },
  { id: 'secret-just10000', title: '精巧なマドレーヌ', class: 'rank-4', isSecret: true, condition: (s: GameStats) => s.score === 10000, desc: 'スコア10000点ぴったり' },
  { id: 'secret-steps', title: '階段ドーナツ', class: 'rank-2', isSecret: true, condition: (s: GameStats) => s.score === 1234, desc: 'スコア1234点' },
  { id: 'secret-messy', title: '崩れたモンブラン', class: 'rank-1', isSecret: true, condition: (s: GameStats) => s.misses >= 100, desc: 'ミス100回以上で完走' },

  // 通常称号（スコア順：高い順に判定）
  { minScore: 15000, title: '至高 of スイーツ・ゴッド', class: 'rank-5', desc: '15,000点以上' },
  { minScore: 12000, title: '伝説のパティシエ', class: 'rank-4', desc: '12,000点以上' },
  { minScore: 10000, title: '贅沢アフタヌーンティー', class: 'rank-4', desc: '10,000点以上' },
  { minScore: 8000, title: 'イチゴのショートケーキ', class: 'rank-3', desc: '8,000点以上' },
  { minScore: 6000, title: '濃厚ガトーショコラ', class: 'rank-3', desc: '6,000点以上' },
  { minScore: 4000, title: 'ふわふわシフォン', class: 'rank-2', desc: '4,000点以上' },
  { minScore: 2500, title: 'なめらかプリン', class: 'rank-2', desc: '2,500点以上' },
  { minScore: 1500, title: '焼きたてクッキー', class: 'rank-1', desc: '1,500点以上' },
  { minScore: 1000, title: 'フルーツグミ', class: 'rank-1', desc: '1,000点以上' },
  { minScore: 500, title: 'ミルクキャンディ', class: 'rank-0', desc: '500点以上' },
  { minScore: 0, title: '角砂糖', class: 'rank-0', desc: '全プレイヤーの始まり' },
];

class Game {
  private score = 0;
  private timeLeft = 60;
  private timer: number | null = null;
  private currentWord: Word = WORDS_LEVEL_1[0];
  private currentIndex = 0;
  private misses = 0;
  private totalKeys = 0;
  private isPlaying = false;
  private sounds = new SoundManager();
  private elements: any;
  // セッションを通じてプールの状態を維持するためのマップ
  private static pools: Record<number, Word[]> = {};
  private lastLevel = 1;
  private correctWordCount = 0;
  private combo = 0;
  private maxCombo = 0;
  private comboHistory: number[] = [];
  private isCurrentWordPerfect = true;

  // 獲得済み称号のIDを保存（永続化は今回はlocalStorageで行う）
  private unlockedTitles: Set<string> = new Set();

  private activeOverlaySource: 'start' | 'result' | null = null;
  private currentLv = 1;
  private countdownInterval: number | null = null;

  constructor(elements: any) {
    this.elements = elements;
    this.elements.startButton.onclick = () => this.prepareGame();
    this.elements.restartButton.onclick = () => this.prepareGame();
    this.elements.showTitlesButton.onclick = () => this.showTitlesOverlay('start');
    this.elements.showTitlesButtonResult.onclick = () => this.showTitlesOverlay('result');
    this.elements.closeTitlesButton.onclick = () => this.hideTitlesOverlay();
    window.addEventListener('keydown', (e) => this.handleInput(e));

    // モバイル入力対応: 画面タップで入力欄にフォーカスを戻す
    document.addEventListener('click', () => {
      if (this.isPlaying || this.elements.readyTimer.classList.contains('hidden') === false) {
        this.elements.mobileInput.focus();
      }
    });

    // モバイル入力対応: inputイベントで文字を拾う
    this.elements.mobileInput.oninput = (e: any) => {
      const char = e.data;
      if (char) {
        this.processChar(char);
      }
      this.elements.mobileInput.value = ''; // 常に空にする
    };

    // 保存されている獲得済み称号を読み込む
    const saved = localStorage.getItem('pop-unlocked-titles');
    if (saved) {
      try {
        const ids = JSON.parse(saved);
        ids.forEach((id: string) => this.unlockedTitles.add(id));
      } catch (e) {
        console.error('Failed to load unlocked titles:', e);
      }
    }
  }

  private saveUnlockedTitles() {
    localStorage.setItem('pop-unlocked-titles', JSON.stringify(Array.from(this.unlockedTitles)));
  }

  private showTitlesOverlay(source: 'start' | 'result') {
    this.activeOverlaySource = source;
    if (source === 'start') {
      this.elements.startScreen.classList.add('hidden');
    } else {
      this.elements.resultScreen.classList.add('hidden');
    }

    this.elements.titlesOverlay.classList.remove('hidden');
    const titlesList = this.elements.titlesList;
    titlesList.innerHTML = '';

    const highScore = parseInt(localStorage.getItem('pop-high-score') || '0');

    TITLES.forEach(rank => {
      // 獲得済み判定:
      // 1. シークレットIDを持っていて unlockedTitles にある
      // 2. IDを持たない通常称号で、ハイスコアが minScore 以上
      const isUnlocked = rank.id
        ? this.unlockedTitles.has(rank.id)
        : (rank.minScore !== undefined && highScore >= rank.minScore);

      const displayTitle = (isUnlocked || !rank.isSecret) ? rank.title : '？？？？';
      const displayDesc = (isUnlocked || !rank.isSecret) ? rank.desc : '条件：シークレット';
      const rankClass = (isUnlocked || !rank.isSecret) ? rank.class : 'rank-hidden';

      const item = document.createElement('div');
      item.className = 'title-item';
      if (isUnlocked) item.classList.add('title-item-unlocked');

      item.innerHTML = `
        <div class="title-info">
          <span class="title-score">${displayDesc}</span>
          <span class="rank-title ${rankClass}">${displayTitle}</span>
        </div>
      `;
      titlesList.appendChild(item);
    });
  }

  private hideTitlesOverlay() {
    this.elements.titlesOverlay.classList.add('hidden');
    if (this.activeOverlaySource === 'start') {
      this.elements.startScreen.classList.remove('hidden');
    } else if (this.activeOverlaySource === 'result') {
      this.elements.resultScreen.classList.remove('hidden');
    }
    this.activeOverlaySource = null;
  }

  private prepareGame() {
    this.elements.startScreen.classList.add('hidden');
    this.elements.resultScreen.classList.add('hidden');
    this.elements.titlesOverlay.classList.add('hidden');
    this.elements.readyTimer.classList.remove('hidden');
    this.elements.mobileInput.focus();

    let countdown = 3;
    this.elements.readyTimer.textContent = countdown.toString();

    this.correctWordCount = 0;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.currentIndex = 0;
    this.timeLeft = 60;
    this.currentLv = 1;
    this.updateBackground();
    this.updateStats();

    this.countdownInterval = window.setInterval(() => {
      countdown--;
      if (countdown > 0) {
        this.elements.readyTimer.textContent = countdown.toString();
        this.sounds.playTick();
      } else if (countdown === 0) {
        this.elements.readyTimer.textContent = 'GO!';
        this.sounds.playGo();
      } else {
        if (this.countdownInterval) clearInterval(this.countdownInterval);
        this.countdownInterval = null;
        this.elements.readyTimer.classList.add('hidden');
        this.startGame();
      }
    }, 1000);
  }

  private startGame() {
    this.score = 0;
    this.timeLeft = 60;
    this.misses = 0;
    this.totalKeys = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.comboHistory = [];
    this.isCurrentWordPerfect = true;
    this.isPlaying = true;
    this.updateStats();
    this.nextWord();
    this.elements.mobileInput.focus();

    this.elements.gameScreen.classList.remove('hidden');
    this.correctWordCount = 0;

    this.timer = window.setInterval(() => {
      this.timeLeft--;
      this.elements.timeDisplay.textContent = this.timeLeft.toString();
      if (this.timeLeft <= 0) this.endGame();
    }, 1000);
  }
  private nextWord() {
    if (this.correctWordCount % 10 === 0 && this.correctWordCount > 0) {
      this.levelUp();
    }

    let currentLevel = 1;
    let baseList: Word[];

    if (this.correctWordCount < 10) {
      currentLevel = 1;
      baseList = WORDS_LEVEL_1;
    } else if (this.correctWordCount < 20) {
      currentLevel = 2;
      baseList = WORDS_LEVEL_2;
    } else if (this.correctWordCount < 30) {
      currentLevel = 3;
      baseList = WORDS_LEVEL_3;
    } else if (this.correctWordCount < 40) {
      currentLevel = 4;
      baseList = WORDS_LEVEL_4;
    } else {
      currentLevel = 5;
      baseList = WORDS_LEVEL_5;
    }

    const currentPool = Game.pools[currentLevel] || [];

    if (currentPool.length === 0 || this.lastLevel !== currentLevel) {
      if (currentPool.length === 0) {
        Game.pools[currentLevel] = [...baseList].sort(() => Math.random() - 0.5);
      }
      this.lastLevel = currentLevel;
    }

    this.currentWord = Game.pools[currentLevel].pop()!;
    if (!this.currentWord) {
      this.currentWord = baseList[Math.floor(Math.random() * baseList.length)];
    }

    this.currentIndex = 0;
    this.isCurrentWordPerfect = true;
    this.renderWord();
  }

  private renderWord() {
    const kanjiHTML = this.currentWord.kanji;
    const kanaHTML = this.currentWord.kana;
    const romajiHTML = this.currentWord.romaji
      .split('')
      .map((char, i) => {
        let className = '';
        if (i < this.currentIndex) {
          className = 'char-correct';
          if (i === this.currentIndex - 1) {
            className += ' char-pop-anim';
          }
        }
        if (i === this.currentIndex) className = 'char-current';
        return `<span class="${className}">${char}</span>`;
      })
      .join('');

    this.elements.wordDisplay.innerHTML = `
      <div class="kanji-display">
        <ruby>${kanjiHTML}<rt>${kanaHTML}</rt></ruby>
      </div>
      <div class="romaji-display">${romajiHTML}</div>
    `;
  }

  private handleInput(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      this.returnToTitle();
      return;
    }

    if (!this.isPlaying || e.key === 'Shift') return;
  }

  private processChar(char: string) {
    this.totalKeys++;
    const targetChar = this.currentWord.romaji[this.currentIndex];

    if (char === targetChar) {
      this.currentIndex++;

      // 全文字一律 10点
      const charPoints = 10;

      // 10コンボごとにさらに加重 (最大+20) - 10点単位に変更
      const comboBonus = Math.min(Math.floor(this.combo / 10) * 10, 20);
      this.score += (charPoints + comboBonus);

      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;

      this.sounds.playPop();
      this.createPopEffect();

      if (this.currentIndex === this.currentWord.romaji.length) {
        // 単語完成ボーナス (レベルに応じて変動: 20 -> 50 -> 100)
        const baseBonus = this.correctWordCount < 5 ? 20 : (this.correctWordCount < 10 ? 50 : 100);
        const wordBonus = baseBonus + (Math.floor(this.combo / 10) * 10);
        // パーフェクトボーナス (ノーミスの時だけ一律 +1点)
        const perfectionBonus = this.isCurrentWordPerfect ? 1 : 0;

        this.score += (wordBonus + perfectionBonus);
        this.correctWordCount++;
        this.nextWord();
      } else {
        this.renderWord();
      }
    } else if (this.checkAlternatives(char)) {
      this.currentIndex++;

      const charPoints = 10;
      const comboBonus = Math.min(Math.floor(this.combo / 10) * 10, 20);
      this.score += (charPoints + comboBonus);

      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;
      this.sounds.playPop();
      this.createPopEffect();

      if (this.currentIndex === this.currentWord.romaji.length) {
        // 単語完成ボーナス (レベルに応じて変動)
        const baseBonus = this.correctWordCount < 5 ? 20 : (this.correctWordCount < 10 ? 50 : 100);
        const wordBonus = baseBonus + (Math.floor(this.combo / 10) * 10);
        // パーフェクトボーナス (一律 +1点)
        const perfectionBonus = this.isCurrentWordPerfect ? 1 : 0;

        this.score += (wordBonus + perfectionBonus);
        this.correctWordCount++;
        this.nextWord();
      } else {
        this.renderWord();
      }
    } else {
      this.misses++;
      this.isCurrentWordPerfect = false;
      // ミスした瞬間のコンボ数を記録
      if (this.combo > 0) this.comboHistory.push(this.combo);
      this.combo = 0;
      this.sounds.playMiss();
      this.elements.gameScreen.classList.add('shake');
      setTimeout(() => this.elements.gameScreen.classList.remove('shake'), 200);
    }

    this.updateStats();
  }

  private checkAlternatives(key: string): boolean {
    const remaining = this.currentWord.romaji.substring(this.currentIndex);
    const patterns = [
      { from: 'ti', to: 'chi' }, { from: 'chi', to: 'ti' },
      { from: 'si', to: 'shi' }, { from: 'shi', to: 'si' },
      { from: 'tu', to: 'tsu' }, { from: 'tsu', to: 'tu' },
      { from: 'hu', to: 'fu' }, { from: 'fu', to: 'hu' },
      { from: 'zi', to: 'ji' }, { from: 'ji', to: 'zi' },
      { from: 'sya', to: 'sha' }, { from: 'sha', to: 'sya' },
      { from: 'syu', to: 'shu' }, { from: 'shu', to: 'syu' },
      { from: 'syo', to: 'sho' }, { from: 'sho', to: 'syo' },
      { from: 'tya', to: 'cha' }, { from: 'cha', to: 'tya' },
      { from: 'cya', to: 'cha' }, { from: 'cha', to: 'cya' },
      { from: 'tyu', to: 'chu' }, { from: 'chu', to: 'tyu' },
      { from: 'cyu', to: 'chu' }, { from: 'chu', to: 'cyu' },
      { from: 'tyo', to: 'cho' }, { from: 'cho', to: 'tyo' },
      { from: 'cyo', to: 'cho' }, { from: 'cho', to: 'cyo' },
      { from: 'zya', to: 'ja' }, { from: 'ja', to: 'zya' },
      { from: 'zyu', to: 'ju' }, { from: 'ju', to: 'zyu' },
      { from: 'zyo', to: 'jo' }, { from: 'jo', to: 'zyo' },
      { from: 'nn', to: 'n ' }, { from: 'ha', to: 'wa' }
    ];

    for (const p of patterns) {
      if (remaining.startsWith(p.from) && key === p.to[0]) {
        const before = this.currentWord.romaji.substring(0, this.currentIndex);
        const after = this.currentWord.romaji.substring(this.currentIndex + p.from.length);
        this.currentWord.romaji = before + p.to + after;
        return true;
      }
    }
    return false;
  }

  private createPopEffect() {
    const rect = this.elements.wordDisplay.getBoundingClientRect();
    const containerRect = this.elements.particleContainer.getBoundingClientRect();
    const centerX = (rect.left + rect.width / 2) - containerRect.left;
    const centerY = (rect.top + rect.height / 2) - containerRect.top;
    const particles = ['⭐', '💖', '✨', '🌸', '✨'];
    const particleCount = Math.min(5 + Math.floor(this.combo / 10) * 3, 20);

    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      p.className = 'pop-particle';
      p.textContent = particles[Math.floor(Math.random() * particles.length)];
      const angle = (Math.random() * 176 - 178) * (Math.PI / 180);
      const baseVelocity = 100 + Math.random() * 600;
      const velocity = baseVelocity + (Math.min(this.combo, 50) * 4);
      const tx = Math.cos(angle) * velocity;
      const ty = Math.sin(angle) * (velocity * 0.5);
      const delay = Math.random() * 0.8;
      p.style.animationDelay = `${delay}s`;
      p.style.setProperty('--tx', `${tx}px`);
      p.style.setProperty('--ty', `${ty}px`);
      p.style.left = `${centerX}px`;
      p.style.top = `${centerY + 100}px`;
      this.elements.particleContainer.appendChild(p);
      setTimeout(() => p.remove(), 3500);
    }
  }

  private updateStats() {
    this.elements.scoreDisplay.textContent = this.score.toString();

    // レベルとゲージの更新
    if (this.elements.currentLevel) {
      this.elements.currentLevel.textContent = this.currentLv.toString();
    }
    if (this.elements.xpBarFill) {
      const progress = (this.correctWordCount % 10) * 10; // 10単語で100%
      this.elements.xpBarFill.style.width = `${progress}%`;
    }

    if (this.elements.timerCircle) {
      const circumference = 282.7;
      const progress = Math.max(0, this.timeLeft / 60);
      const offset = circumference * (1 - progress);
      this.elements.timerCircle.style.strokeDashoffset = offset.toString();
      if (this.timeLeft <= 10) {
        this.elements.timerCircle.style.stroke = '#ff4757';
      } else if (this.timeLeft <= 20) {
        this.elements.timerCircle.style.stroke = '#ffa502';
      } else {
        this.elements.timerCircle.style.stroke = 'var(--primary)';
      }
    }
  }

  private levelUp() {
    this.currentLv++;
    this.timeLeft += 5;
    this.updateBackground();

    // 演出表示
    const overlay = this.elements.levelUpOverlay;
    if (overlay) {
      overlay.classList.remove('hidden', 'animate');
      void overlay.offsetWidth; // リフロー
      overlay.classList.add('animate');
      setTimeout(() => overlay.classList.add('hidden'), 1500);
    }

    const bonusPop = this.elements.timeBonusPop;
    if (bonusPop) {
      bonusPop.classList.remove('hidden', 'animate');
      void bonusPop.offsetWidth;
      bonusPop.classList.add('animate');
      setTimeout(() => bonusPop.classList.add('hidden'), 1000);
    }

    // レベルアップ音（既存のplayWinを少し流用）
    this.sounds.playWin();
  }

  private updateBackground() {
    const colors = [
      'var(--lv1-bg)',
      'var(--lv2-bg)',
      'var(--lv3-bg)',
      'var(--lv4-bg)',
      'var(--lv5-bg)'
    ];
    const color = colors[Math.min(this.currentLv - 1, colors.length - 1)];
    document.body.style.background = color;
  }

  private returnToTitle() {
    // 状態のクリア
    this.isPlaying = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    // 画面の切り替え
    this.elements.gameScreen.classList.add('hidden');
    this.elements.resultScreen.classList.add('hidden');
    this.elements.readyTimer.classList.add('hidden');
    this.elements.titlesOverlay.classList.add('hidden');
    this.elements.startScreen.classList.remove('hidden');

    // 背景をリセット
    this.currentLv = 1;
    this.updateBackground();
    this.elements.timeDisplay.textContent = '60';
  }

  private endGame() {
    this.isPlaying = false;
    if (this.timer) clearInterval(this.timer);

    this.elements.gameScreen.classList.add('hidden');
    this.elements.resultScreen.classList.remove('hidden');

    this.elements.finalScore.textContent = this.score.toString();

    const highScore = parseInt(localStorage.getItem('pop-high-score') || '0');
    if (this.score > highScore) {
      localStorage.setItem('pop-high-score', this.score.toString());
      this.elements.highScore.textContent = `${this.score} (New!)`;
      this.sounds.playWin();
    } else {
      this.elements.highScore.textContent = highScore.toString();
    }

    const elapsed = 60 - this.timeLeft;
    const kpm = elapsed > 0 ? Math.floor((this.totalKeys / elapsed) * 60) : 0;
    this.elements.wpmDisplay.textContent = kpm.toString();
    this.elements.missDisplay.textContent = this.misses.toString();

    this.showTitle(kpm);
  }

  private showTitle(kpm: number) {
    const stats: GameStats = {
      score: this.score,
      misses: this.misses,
      maxCombo: this.maxCombo,
      totalKeys: this.totalKeys,
      kpm: kpm,
      correctWordCount: this.correctWordCount,
      comboHistory: this.comboHistory,
    };

    const earnedTitles: any[] = [];

    // 特殊称号（隠し要素）は条件を満たすすべてを表示
    for (const rank of TITLES) {
      if (rank.condition && rank.condition(stats)) {
        earnedTitles.push(rank);
        if (rank.id) {
          this.unlockedTitles.add(rank.id);
        }
      }
    }

    // 通常のスコア称号（そのスコアで到達可能な最高のもの1つ）も追加
    let highestScoreTitle = null;
    for (const rank of TITLES) {
      if (!rank.condition && rank.minScore !== undefined && this.score >= rank.minScore) {
        highestScoreTitle = rank;
        break; // 高い順に並んでいるので最初に見つかったものが最高
      }
    }

    if (highestScoreTitle) {
      earnedTitles.push(highestScoreTitle);
      if (highestScoreTitle.id) {
        this.unlockedTitles.add(highestScoreTitle.id);
      }
    }

    this.saveUnlockedTitles();

    if (this.elements.titleContainer && this.elements.rankTitlesList) {
      this.elements.rankTitlesList.innerHTML = '';

      earnedTitles.forEach((title, index) => {
        const item = document.createElement('div');
        item.className = 'rank-title-item ' + title.class;
        item.textContent = title.title;
        item.style.animationDelay = `${index * 0.2}s`;
        this.elements.rankTitlesList.appendChild(item);
      });

      if (earnedTitles.length > 0) {
        this.elements.titleContainer.classList.remove('hidden');
      }
    }
  }
}

function initGame() {
  try {
    const elements = {
      startScreen: document.getElementById('start-screen'),
      gameScreen: document.getElementById('game-screen'),
      resultScreen: document.getElementById('result-screen'),
      readyTimer: document.getElementById('ready-timer'),
      wordDisplay: document.getElementById('word-display'),
      scoreDisplay: document.getElementById('score'),
      timeDisplay: document.getElementById('time-left'),
      finalScore: document.getElementById('final-score'),
      highScore: document.getElementById('high-score'),
      wpmDisplay: document.getElementById('wpm'),
      missDisplay: document.getElementById('misses'),
      startButton: document.getElementById('start-button'),
      restartButton: document.getElementById('restart-button'),
      timerCircle: document.getElementById('timer-circle'),
      particleContainer: document.getElementById('particle-container'),
      titleContainer: document.getElementById('title-container'),
      rankTitlesList: document.getElementById('rank-titles-list'),
      showTitlesButton: document.getElementById('show-titles-button'),
      showTitlesButtonResult: document.getElementById('show-titles-button-result'),
      closeTitlesButton: document.getElementById('close-titles-button'),
      titlesOverlay: document.getElementById('titles-overlay'),
      titlesList: document.getElementById('titles-list'),
      currentLevel: document.getElementById('current-level'),
      xpBarFill: document.getElementById('xp-bar-fill'),
      timeBonusPop: document.getElementById('time-bonus-pop'),
      levelUpOverlay: document.getElementById('level-up-overlay'),
      mobileInput: document.getElementById('mobile-input')
    };

    const missing = Object.entries(elements).filter(([_, el]) => !el);
    if (missing.length > 0) {
      throw new Error(`Missing elements: ${missing.map(([id]) => id).join(', ')}`);
    }

    // @ts-ignore
    new Game(elements);
  } catch (error) {
    console.error('Pop Typing: Failed to initialize game:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
