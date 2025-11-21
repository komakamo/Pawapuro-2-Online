import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Trophy, Calendar, User, Users, Play, FastForward, Pause, Activity, TrendingUp, ChevronsUp, Award, Shield, Zap } from 'lucide-react';

// --- Types & Constants ---

const TEAMS_CONFIG = [
  { id: 'dragons', name: 'レッドドラゴンズ', short: '竜', color: 'bg-red-600', text: 'text-red-600', border: 'border-red-600', softBg: 'bg-red-50' },
  { id: 'tigers', name: 'イエロータイガース', short: '虎', color: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-500', softBg: 'bg-yellow-50' },
  { id: 'blues', name: 'ブルーウェーブス', short: '波', color: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-600', softBg: 'bg-blue-50' },
  { id: 'carps', name: 'スカーレットカープ', short: '鯉', color: 'bg-red-500', text: 'text-red-500', border: 'border-red-500', softBg: 'bg-red-50' },
  { id: 'stars', name: 'ゴールドスターズ', short: '星', color: 'bg-orange-400', text: 'text-orange-500', border: 'border-orange-400', softBg: 'bg-orange-50' },
  { id: 'swallows', name: 'グリーンスワローズ', short: '燕', color: 'bg-green-600', text: 'text-green-600', border: 'border-green-600', softBg: 'bg-green-50' },
];

type Condition = 'excellent' | 'good' | 'normal' | 'bad' | 'terrible';

interface Player {
  id: string;
  name: string;
  position: 'P' | 'C' | '1B' | '2B' | '3B' | 'SS' | 'OF';
  age: number;
  potential: 'S' | 'A' | 'B' | 'C';
  growthExp: number;
  // Abilities (0-100)
  contact: number;
  power: number;
  speed: number;
  defense: number;
  control: number; // Pitcher only
  stamina: number; // Pitcher only
  // Current State
  condition: Condition;
  // Season Stats
  games: number;
  atBats: number;
  hits: number;
  homeruns: number;
  rbi: number;
  innings: number;
  earnedRuns: number;
  wins: number;
  losses: number;
  saves: number;
}

interface Team {
  id: string;
  name: string;
  short: string;
  color: string;
  textColor: string;
  border: string;
  softBg: string;
  players: Player[];
  wins: number;
  losses: number;
  draws: number;
  runsScored: number;
  runsAllowed: number;
}

interface GameResult {
  day: number;
  homeId: string;
  awayId: string;
  homeScore: number;
  awayScore: number;
  details: string[];
  growthUpdates: string[];
}

// --- Helper Functions ---

const generateRandomName = () => {
  const familyNames = ['佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤', '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水', '矢部', '猪狩', '友沢', '橘', '早川', '六道', '滝本', '清本'];
  const givenNames = ['大輔', '誠', '翔', '達也', '健太', '拓也', '直人', '浩二', '一郎', '次郎', '三郎', 'あおい', '聖', '進', '守', '亮', '光', '昴'];
  return `${familyNames[Math.floor(Math.random() * familyNames.length)]} ${givenNames[Math.floor(Math.random() * givenNames.length)]}`;
};

const getRandomCondition = (): Condition => {
  const rand = Math.random();
  if (rand < 0.1) return 'terrible';
  if (rand < 0.3) return 'bad';
  if (rand < 0.7) return 'normal';
  if (rand < 0.9) return 'good';
  return 'excellent';
};

const getConditionIcon = (cond: Condition) => {
  switch (cond) {
    case 'excellent': return <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs shadow-sm ring-2 ring-pink-100 animate-pulse">絶</div>;
    case 'good': return <div className="w-6 h-6 rounded-full bg-orange-400 text-white flex items-center justify-center text-xs shadow-sm">好</div>;
    case 'normal': return <div className="w-6 h-6 rounded-full bg-yellow-400 text-white flex items-center justify-center text-xs shadow-sm">普</div>;
    case 'bad': return <div className="w-6 h-6 rounded-full bg-blue-400 text-white flex items-center justify-center text-xs shadow-sm">不</div>;
    case 'terrible': return <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs shadow-sm">絶不</div>;
  }
};

const getConditionMultiplier = (cond: Condition) => {
  switch (cond) {
    case 'excellent': return 1.2;
    case 'good': return 1.1;
    case 'normal': return 1.0;
    case 'bad': return 0.9;
    case 'terrible': return 0.8;
  }
};

const generatePlayer = (id: string, position: Player['position']): Player => {
  const isPitcher = position === 'P';
  
  const potentialRoll = Math.random();
  let potential: Player['potential'] = 'C';
  if (potentialRoll > 0.95) potential = 'S';
  else if (potentialRoll > 0.80) potential = 'A';
  else if (potentialRoll > 0.50) potential = 'B';

  const baseMult = potential === 'S' ? 1.3 : potential === 'A' ? 1.15 : potential === 'B' ? 1.05 : 0.9;
  const baseStat = (min: number, max: number) => Math.floor((min + Math.random() * (max - min)) * baseMult);
  
  const age = Math.floor(18 + (Math.random() * Math.random() * 15)); 

  return {
    id,
    name: generateRandomName(),
    position,
    age,
    potential,
    growthExp: 0,
    contact: Math.min(99, isPitcher ? baseStat(10, 30) : baseStat(30, 85)),
    power: Math.min(99, isPitcher ? baseStat(10, 40) : baseStat(20, 85)),
    speed: Math.min(99, baseStat(30, 85)),
    defense: Math.min(99, baseStat(30, 85)),
    control: Math.min(99, isPitcher ? baseStat(30, 85) : 0),
    stamina: Math.min(99, isPitcher ? baseStat(30, 90) : 0),
    condition: getRandomCondition(),
    games: 0,
    atBats: 0,
    hits: 0,
    homeruns: 0,
    rbi: 0,
    innings: 0,
    earnedRuns: 0,
    wins: 0,
    losses: 0,
    saves: 0,
  };
};

const createTeam = (config: typeof TEAMS_CONFIG[0]): Team => {
  const players: Player[] = [];
  players.push(generatePlayer(`${config.id}-p1`, 'P'));
  players.push(generatePlayer(`${config.id}-p2`, 'P'));
  players.push(generatePlayer(`${config.id}-p3`, 'P'));
  players.push(generatePlayer(`${config.id}-p4`, 'P'));
  players.push(generatePlayer(`${config.id}-p5`, 'P'));
  
  const positions: Player['position'][] = ['C', '1B', '2B', '3B', 'SS', 'OF', 'OF', 'OF', 'OF'];
  positions.forEach((pos, idx) => {
    players.push(generatePlayer(`${config.id}-f${idx}`, pos));
  });

  return {
    ...config,
    textColor: config.text,
    players,
    wins: 0,
    losses: 0,
    draws: 0,
    runsScored: 0,
    runsAllowed: 0,
  };
};

// --- Simulation Logic ---

const simulateMatch = (home: Team, away: Team, day: number): { result: GameResult, updatedHome: Team, updatedAway: Team } => {
  const updateCondition = (p: Player): Player => ({
    ...p,
    condition: Math.random() < 0.2 ? getRandomCondition() : p.condition
  });

  const homePlayers = home.players.map(updateCondition);
  const awayPlayers = away.players.map(updateCondition);

  const getTeamPower = (players: Player[]) => {
    let offense = 0;
    let defense = 0;
    players.forEach(p => {
      const mult = getConditionMultiplier(p.condition);
      if (p.position === 'P') {
        defense += (p.control + p.stamina) * mult;
      } else {
        offense += (p.contact + p.power + p.speed) * mult;
      }
    });
    return { offense, defense };
  };

  const hPower = getTeamPower(homePlayers);
  const aPower = getTeamPower(awayPlayers);

  let homeScore = Math.floor(Math.max(0, (Math.random() * 8) + (hPower.offense / 1000) - (aPower.defense / 1200)));
  let awayScore = Math.floor(Math.max(0, (Math.random() * 8) + (aPower.offense / 1000) - (hPower.defense / 1200)));

  if (Math.random() < 0.05) homeScore += Math.floor(Math.random() * 5);
  if (Math.random() < 0.05) awayScore += Math.floor(Math.random() * 5);

  const growthEvents: string[] = [];

  const resolveStatsAndGrowth = (teamPlayers: Player[], teamName: string, ownScore: number, oppScore: number, isWin: boolean, isLoss: boolean): Player[] => {
    return teamPlayers.map(p => {
      let newP = { ...p };
      let xpGained = 10;

      if (p.position === 'P') {
        const isStarter = p.id.endsWith('p1') || p.id.endsWith('p2');
        if (!isStarter) return p;

        const innings = isStarter ? (Math.random() * 3 + 5) : 1;
        const er = Math.floor((oppScore / 9) * innings);
        
        newP.games += 1;
        newP.innings += innings;
        newP.earnedRuns += er;
        if (isWin && isStarter) { newP.wins += 1; xpGained += 50; }
        if (isLoss && isStarter) { newP.losses += 1; xpGained += 10; }
        
        xpGained += innings * 5;
        if (er === 0) xpGained += 30;

      } else {
        const abs = Math.floor(Math.random() * 2) + 3;
        const successRate = (p.contact * getConditionMultiplier(p.condition)) / 300; 
        const hits = Math.random() < successRate ? Math.ceil(Math.random() * 2) : (Math.random() < 0.2 ? 1 : 0);
        
        let hrs = 0;
        if (hits > 0 && Math.random() < (p.power / 200)) hrs = 1;
        
        const rbis = hrs + (hits > 0 && Math.random() < 0.3 ? 1 : 0);

        newP.games += 1;
        newP.atBats += abs;
        newP.hits += hits;
        newP.homeruns += hrs;
        newP.rbi += rbis;

        xpGained += hits * 20;
        xpGained += hrs * 40;
        xpGained += rbis * 10;
      }

      if (p.age < 22) xpGained *= 1.5;
      else if (p.age < 26) xpGained *= 1.2;
      else if (p.age > 32) xpGained *= 0.5;

      newP.growthExp += Math.floor(xpGained);
      
      if (newP.growthExp >= 200) {
         newP.growthExp -= 200;
         const growthAmount = Math.floor(Math.random() * 2) + 1;
         let statGrown = '';

         if (newP.position === 'P') {
             const roll = Math.random();
             if (roll < 0.4 && newP.stamina < 99) { newP.stamina += growthAmount; statGrown = 'スタミナ'; }
             else if (roll < 0.8 && newP.control < 99) { newP.control += growthAmount; statGrown = 'コントロール'; }
             else if (newP.speed < 160) { newP.speed += 1; statGrown = '球速'; }
         } else {
             const roll = Math.random();
             if (roll < 0.3 && newP.contact < 99) { newP.contact += growthAmount; statGrown = 'ミート'; }
             else if (roll < 0.6 && newP.power < 99) { newP.power += growthAmount; statGrown = 'パワー'; }
             else if (roll < 0.8 && newP.speed < 99) { newP.speed += growthAmount; statGrown = '走力'; }
             else if (newP.defense < 99) { newP.defense += growthAmount; statGrown = '守備'; }
         }

         if (statGrown) {
             growthEvents.push(`${teamName}・${newP.name} (${newP.age}) の${statGrown}がUP！`);
         }
      }

      return newP;
    });
  };

  const isHomeWin = homeScore > awayScore;
  const isAwayWin = awayScore > homeScore;
  const isDraw = homeScore === awayScore;

  return {
    result: {
      day,
      homeId: home.id,
      awayId: away.id,
      homeScore,
      awayScore,
      details: [`${home.short} ${homeScore} - ${awayScore} ${away.short}`],
      growthUpdates: growthEvents
    },
    updatedHome: {
      ...home,
      players: resolveStatsAndGrowth(homePlayers, home.short, homeScore, awayScore, isHomeWin, isAwayWin),
      wins: home.wins + (isHomeWin ? 1 : 0),
      losses: home.losses + (isAwayWin ? 1 : 0),
      draws: home.draws + (isDraw ? 1 : 0),
      runsScored: home.runsScored + homeScore,
      runsAllowed: home.runsAllowed + awayScore,
    },
    updatedAway: {
      ...away,
      players: resolveStatsAndGrowth(awayPlayers, away.short, awayScore, homeScore, isAwayWin, isHomeWin),
      wins: away.wins + (isAwayWin ? 1 : 0),
      losses: away.losses + (isHomeWin ? 1 : 0),
      draws: away.draws + (isDraw ? 1 : 0),
      runsScored: away.runsScored + awayScore,
      runsAllowed: away.runsAllowed + homeScore,
    }
  };
};

// --- Components ---

export default function PennantGame() {
  const TOTAL_GAMES = 143;

  const [teams, setTeams] = useState<Team[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [view, setView] = useState<'league' | 'schedule' | 'team'>('league');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [gameSpeed, setGameSpeed] = useState(500);
  const teamsRef = useRef<Team[]>([]);
  const currentDayRef = useRef(currentDay);

  useEffect(() => {
    const initialTeams = TEAMS_CONFIG.map(createTeam);
    setTeams(initialTeams);
  }, []);

  useEffect(() => {
    teamsRef.current = teams;
  }, [teams]);

  useEffect(() => {
    currentDayRef.current = currentDay;
  }, [currentDay]);

  useEffect(() => {
    let interval: number;
    if (isPlaying && currentDay <= TOTAL_GAMES) {
      interval = window.setInterval(() => {
        playDay();
      }, gameSpeed);
    } else if (currentDay > TOTAL_GAMES) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentDay, gameSpeed]);

  const playDay = () => {
    const day = currentDayRef.current;
    const currentTeams = teamsRef.current;

    if (day > TOTAL_GAMES) return;
    if (currentTeams.length < 6) {
      setIsPlaying(false);
      return;
    }

    const shuffled = [...currentTeams].sort(() => Math.random() - 0.5);
    const matchups: [Team, Team][] = [];

    for (let i = 0; i < shuffled.length - 1; i += 2) {
      matchups.push([shuffled[i], shuffled[i + 1]]);
    }

    const dayResults: GameResult[] = [];
    const nextTeamsState = [...currentTeams];

    matchups.forEach(([home, away]) => {
      const hIndex = nextTeamsState.findIndex(t => t.id === home.id);
      const aIndex = nextTeamsState.findIndex(t => t.id === away.id);
      
      const { result, updatedHome, updatedAway } = simulateMatch(nextTeamsState[hIndex], nextTeamsState[aIndex], day);
      
      nextTeamsState[hIndex] = updatedHome;
      nextTeamsState[aIndex] = updatedAway;
      dayResults.push(result);
    });

    teamsRef.current = nextTeamsState;
    setTeams(nextTeamsState);
    setGameHistory(prev => [...dayResults, ...prev]);
    setCurrentDay(d => d + 1);
  };

  const hasMinimumTeams = teams.length >= 6;

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      const winPctA = (a.wins + a.losses) > 0 ? a.wins / (a.wins + a.losses) : 0;
      const winPctB = (b.wins + b.losses) > 0 ? b.wins / (b.wins + b.losses) : 0;
      return winPctB - winPctA;
    });
  }, [teams]);

  const getGameDiff = (targetTeam: Team) => {
    const leader = sortedTeams[0];
    if (!leader) return '-';
    if (targetTeam.id === leader.id) return '-';
    const diff = ((leader.wins - leader.losses) - (targetTeam.wins - targetTeam.losses)) / 2;
    return diff.toFixed(1);
  };

  const renderAbilityRank = (val: number) => {
    let rank = 'G';
    let bg = 'bg-gray-100 text-gray-500';
    
    if (val >= 90) { rank = 'S'; bg = 'bg-yellow-400 text-yellow-900 ring-2 ring-yellow-200'; }
    else if (val >= 80) { rank = 'A'; bg = 'bg-pink-500 text-white ring-2 ring-pink-200'; }
    else if (val >= 70) { rank = 'B'; bg = 'bg-red-500 text-white'; }
    else if (val >= 60) { rank = 'C'; bg = 'bg-orange-500 text-white'; }
    else if (val >= 50) { rank = 'D'; bg = 'bg-green-500 text-white'; }
    else if (val >= 40) { rank = 'E'; bg = 'bg-green-600 text-white'; }
    else { rank = 'F'; bg = 'bg-blue-500 text-white'; }
    
    return (
      <div className="flex items-center justify-center space-x-1">
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${bg}`}>
          {rank}
        </span>
        <span className="text-xs text-gray-400 font-mono w-6 text-right hidden sm:inline-block">{val}</span>
      </div>
    );
  };

  const renderPlayerRow = (player: Player) => {
    const isPitcher = player.position === 'P';
    const era = player.innings > 0 ? ((player.earnedRuns * 9) / player.innings).toFixed(2) : '0.00';
    const avg = player.atBats > 0 ? (player.hits / player.atBats).toFixed(3) : '.000';

    const growthPct = Math.min(100, (player.growthExp / 200) * 100);

    return (
      <tr key={player.id} className="border-b border-gray-50 hover:bg-blue-50/50 transition-colors group">
        <td className="p-3 text-center w-10">{getConditionIcon(player.condition)}</td>
        <td className="p-3">
           <span className={`inline-block w-8 text-center text-xs font-bold py-1 px-1.5 rounded bg-gray-100 text-gray-600 ${player.position === 'P' ? 'bg-blue-50 text-blue-700' : ''}`}>
             {player.position}
           </span>
        </td>
        <td className="p-3">
          <div className="flex flex-col">
            <span className="font-bold text-gray-800 text-sm md:text-base">{player.name}</span>
            <div className="flex items-center mt-1 space-x-2">
               <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{player.age}歳</span>
               <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${player.potential === 'S' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                 成長: {player.potential}
               </span>
            </div>
            {/* Growth Bar */}
            <div className="w-full bg-gray-200 h-1.5 mt-2 rounded-full overflow-hidden shadow-inner">
              <div className="bg-gradient-to-r from-green-400 to-green-500 h-full transition-all duration-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" style={{ width: `${growthPct}%` }}></div>
            </div>
          </div>
        </td>
        
        {isPitcher ? (
          <>
            <td className="p-2 text-center">{renderAbilityRank(player.stamina)}</td>
            <td className="p-2 text-center">{renderAbilityRank(player.control)}</td>
            <td className="p-2 text-right font-mono font-bold text-gray-700 text-lg">{era}</td>
            <td className="p-2 text-right text-sm text-gray-600">{player.wins}勝 {player.losses}敗</td>
          </>
        ) : (
          <>
            <td className="p-2 text-center hidden md:table-cell">{renderAbilityRank(player.contact)}</td>
            <td className="p-2 text-center hidden md:table-cell">{renderAbilityRank(player.power)}</td>
            <td className="p-2 text-center hidden md:table-cell">{renderAbilityRank(player.speed)}</td>
            {/* Mobile Only Summary */}
             <td className="p-2 text-center md:hidden">
                <div className="flex flex-col items-center gap-1">
                   <span className="text-xs text-gray-400">能力</span>
                   <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-gray-300" title={`ミート: ${player.contact}`} style={{opacity: player.contact/100}}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-300" title={`パワー: ${player.power}`} style={{opacity: player.power/100}}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-300" title={`走力: ${player.speed}`} style={{opacity: player.speed/100}}></div>
                   </div>
                </div>
             </td>
            <td className="p-2 text-right font-mono font-bold text-gray-700 text-lg">{avg}</td>
            <td className="p-2 text-right text-sm font-mono">{player.homeruns} <span className="text-xs text-gray-400">HR</span></td>
            <td className="p-2 text-right text-sm font-mono">{player.rbi} <span className="text-xs text-gray-400">打点</span></td>
          </>
        )}
      </tr>
    );
  };

  return (
    <div className="max-w-5xl mx-auto bg-slate-50 min-h-screen font-sans text-gray-800 pb-20">
      
      {/* Header */}
      <header className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white px-6 py-5 shadow-xl sticky top-0 z-20 border-b border-slate-700/50 backdrop-blur-sm bg-opacity-95">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => setView('league')}>
            <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wider font-['Helvetica_Neue']">PENNANT SIM</h1>
              <span className="text-xs text-slate-400 tracking-widest uppercase">Professional Baseball</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="flex items-center space-x-3 bg-slate-800/80 px-5 py-2 rounded-full border border-slate-700 shadow-inner">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="font-mono font-bold text-lg tracking-widest">
                   {currentDay > TOTAL_GAMES ? <span className="text-red-400">SEASON END</span> : `${String(currentDay).padStart(3, '0')} / ${TOTAL_GAMES}`}
                </span>
             </div>
          </div>
        </div>
      </header>

      {/* Navigation & Controls */}
      <div className="sticky top-[80px] z-10 px-4 py-4 md:px-6">
         <div className="bg-white rounded-2xl shadow-lg p-2 md:p-3 flex flex-col md:flex-row justify-between items-center gap-4 border border-gray-100">
            
            {/* Navigation Tabs */}
            <div className="flex p-1 bg-gray-100 rounded-xl w-full md:w-auto overflow-x-auto">
              {[
                { id: 'league', icon: Users, label: '順位表' },
                { id: 'schedule', icon: Calendar, label: '日程・結果' },
                { id: 'team', icon: User, label: '選手データ' }
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setView(tab.id as any)} 
                  className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center space-x-2 transition-all duration-200 ${
                    view === tab.id 
                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5 scale-100' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${view === tab.id ? 'text-blue-500' : ''}`} />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Game Controls */}
            <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
              {currentDay <= TOTAL_GAMES ? (
                <>
                  <button
                    onClick={() => { setGameSpeed(500); setIsPlaying(!isPlaying); }}
                    disabled={!hasMinimumTeams}
                    className={`flex-1 md:flex-none flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 hover:shadow-xl ${
                      isPlaying
                      ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                    <span>{isPlaying ? 'STOP' : 'START'}</span>
                  </button>

                  <button
                    onClick={() => { setGameSpeed(50); setIsPlaying(true); }}
                    disabled={isPlaying || !hasMinimumTeams}
                    className="p-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200 shadow-sm"
                    title="高速進行"
                  >
                    <FastForward className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <div className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold flex items-center space-x-2 shadow-md">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span>シーズン終了</span>
                </div>
              )}
            </div>
         </div>
      </div>

      {/* Content Area */}
      <div className="px-4 md:px-6 pb-12">
        
        {/* --- LEAGUE VIEW --- */}
        {view === 'league' && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-slate-50 to-white p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                 <div className="p-2 bg-yellow-100 rounded-lg">
                   <Trophy className="w-5 h-5 text-yellow-600" />
                 </div>
                 <span className="font-bold text-gray-700 text-lg">順位表</span>
              </div>
              <span className="text-xs text-gray-400 font-mono">REALTIME STANDINGS</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-slate-50 text-xs text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-4 px-4 text-center w-16">Rank</th>
                    <th className="py-4 px-4 text-left">Team</th>
                    <th className="py-4 px-4 text-center">Games</th>
                    <th className="py-4 px-4 text-center">Win</th>
                    <th className="py-4 px-4 text-center">Lose</th>
                    <th className="py-4 px-4 text-center">Draw</th>
                    <th className="py-4 px-4 text-center">PCT</th>
                    <th className="py-4 px-4 text-center">GB</th>
                    <th className="py-4 px-4 text-center text-[10px] text-gray-400">得点</th>
                    <th className="py-4 px-4 text-center text-[10px] text-gray-400">失点</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedTeams.map((team, index) => {
                     const games = team.wins + team.losses + team.draws;
                     const pct = games > 0 ? (team.wins / (team.wins + team.losses)).toFixed(3).slice(1) : '.---';
                     const isTop = index === 0;
                     
                     return (
                      <tr 
                        key={team.id} 
                        className={`group transition-all duration-200 cursor-pointer hover:bg-blue-50/30 ${isTop ? 'bg-yellow-50/30' : ''}`}
                        onClick={() => { setSelectedTeamId(team.id); setView('team'); }}
                      >
                        <td className="py-4 px-4 text-center">
                          <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded-lg font-bold font-mono text-lg ${isTop ? 'bg-yellow-400 text-white shadow-md shadow-yellow-200' : 'text-gray-400 bg-gray-100'}`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 rounded-xl ${team.color} text-white flex items-center justify-center font-bold text-lg shadow-md transform group-hover:scale-110 transition-transform`}>
                              {team.short}
                            </div>
                            <div className="flex flex-col">
                               <span className="font-bold text-gray-800 text-base group-hover:text-blue-600 transition-colors">{team.name}</span>
                               {isTop && <span className="text-[10px] text-yellow-600 font-bold flex items-center"><Award className="w-3 h-3 mr-1" />LEADER</span>}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center font-mono text-gray-500 font-medium">{games}</td>
                        <td className="py-4 px-4 text-center">
                           <span className="inline-block min-w-[2.5rem] py-1 bg-red-50 text-red-600 font-mono font-bold rounded-md border border-red-100">{team.wins}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                           <span className="inline-block min-w-[2.5rem] py-1 bg-blue-50 text-blue-600 font-mono font-bold rounded-md border border-blue-100">{team.losses}</span>
                        </td>
                        <td className="py-4 px-4 text-center font-mono text-gray-400">{team.draws}</td>
                        <td className="py-4 px-4 text-center font-mono font-bold text-lg text-slate-700">{pct}</td>
                        <td className="py-4 px-4 text-center font-mono text-gray-400">{getGameDiff(team)}</td>
                        <td className="py-4 px-4 text-center font-mono text-xs text-gray-400">{team.runsScored}</td>
                        <td className="py-4 px-4 text-center font-mono text-xs text-gray-400">{team.runsAllowed}</td>
                      </tr>
                     );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- SCHEDULE VIEW --- */}
        {view === 'schedule' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Results Feed */}
            <div className="lg:col-span-7 flex flex-col gap-4">
               <div className="flex items-center space-x-2 mb-2">
                 <Activity className="w-5 h-5 text-green-500" />
                 <h3 className="font-bold text-gray-700 text-lg">Games Feed</h3>
               </div>
               
               <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                 {gameHistory.length === 0 ? (
                   <div className="text-center text-gray-400 py-20 bg-white rounded-2xl border border-dashed border-gray-200">まだ試合が行われていません</div>
                 ) : (
                   gameHistory.slice(0, 30).map((game, idx) => {
                      const homeTeam = teams.find(t=>t.id === game.homeId);
                      const awayTeam = teams.find(t=>t.id === game.awayId);
                      
                      return (
                       <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                         <div className="flex items-center justify-between mb-3">
                           <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase bg-gray-50 px-2 py-1 rounded border border-gray-100">GAME {game.day}</span>
                           <span className="text-xs text-gray-300 font-mono">FINAL</span>
                         </div>
                         
                         <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center space-x-3 flex-1">
                               <div className={`w-10 h-10 rounded-xl ${homeTeam?.color} text-white flex items-center justify-center font-bold shadow-sm`}>{homeTeam?.short}</div>
                               <span className="font-bold text-gray-800 text-sm md:text-base hidden sm:block">{homeTeam?.name}</span>
                            </div>
                            
                            <div className="flex items-center px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
                               <span className={`text-2xl font-bold font-mono w-8 text-center ${game.homeScore > game.awayScore ? 'text-red-600' : 'text-slate-400'}`}>{game.homeScore}</span>
                               <span className="text-gray-300 mx-2">-</span>
                               <span className={`text-2xl font-bold font-mono w-8 text-center ${game.awayScore > game.homeScore ? 'text-red-600' : 'text-slate-400'}`}>{game.awayScore}</span>
                            </div>
                            
                            <div className="flex items-center space-x-3 flex-1 justify-end">
                               <span className="font-bold text-gray-800 text-sm md:text-base text-right hidden sm:block">{awayTeam?.name}</span>
                               <div className={`w-10 h-10 rounded-xl ${awayTeam?.color} text-white flex items-center justify-center font-bold shadow-sm`}>{awayTeam?.short}</div>
                            </div>
                         </div>
                       </div>
                      );
                   })
                 )}
               </div>
            </div>

            {/* News & Growth Feed */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden h-full sticky top-24">
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                  <h3 className="font-bold text-blue-900 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                    League News
                  </h3>
                </div>
                
                <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {/* Growth News */}
                  {gameHistory.slice(0, 10).map((game, gIdx) => (
                     game.growthUpdates && game.growthUpdates.length > 0 && (
                       <div key={`growth-${gIdx}`} className="animate-fadeIn">
                         <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] text-gray-400">GAME {game.day}</span>
                            <div className="h-px bg-gray-100 flex-1"></div>
                         </div>
                         <div className="space-y-2">
                           {game.growthUpdates.map((update, uIdx) => (
                              <div key={`u-${uIdx}`} className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 text-green-800 rounded-xl border border-green-100 flex items-start shadow-sm">
                                <div className="p-1 bg-green-200 rounded-full mr-3 mt-0.5">
                                  <ChevronsUp className="w-3 h-3 text-green-700" />
                                </div>
                                <span className="text-sm font-medium">{update}</span>
                              </div>
                           ))}
                         </div>
                       </div>
                     )
                  ))}

                  {/* Static News Examples */}
                  {gameHistory.length > 0 && (
                     <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-900 rounded-xl border border-blue-100 shadow-sm">
                       <div className="flex items-center mb-2 text-blue-500">
                          <Shield className="w-4 h-4 mr-2" />
                          <span className="text-xs font-bold uppercase tracking-wider">Highlight</span>
                       </div>
                       <p className="text-sm font-medium leading-relaxed">{gameHistory[0].details[0]} は白熱した投手戦となりました！</p>
                     </div>
                  )}
                  
                  <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 text-amber-900 rounded-xl border border-amber-100 shadow-sm">
                    <div className="flex items-center mb-2 text-amber-500">
                       <Zap className="w-4 h-4 mr-2" />
                       <span className="text-xs font-bold uppercase tracking-wider">Scout Report</span>
                    </div>
                    <p className="text-sm font-medium leading-relaxed">今年のドラフト候補、地方大会で155km/hを計測。各球団のスカウトが色めき立っています。</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TEAM DATA VIEW --- */}
        {view === 'team' && selectedTeamId && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            {/* Team Selector */}
            <div className="p-4 border-b border-gray-100 bg-slate-50/50 overflow-x-auto">
              <div className="flex space-x-3 min-w-max px-2">
                {teams.map(t => (
                  <button 
                    key={t.id}
                    onClick={() => setSelectedTeamId(t.id)}
                    className={`group flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 border ${
                      selectedTeamId === t.id 
                      ? `${t.softBg} ${t.border} shadow-sm scale-105 ring-1 ring-offset-1 ring-offset-white` 
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-md ${t.color} text-white flex items-center justify-center text-xs font-bold`}>{t.short}</div>
                    <span className={`text-sm font-bold whitespace-nowrap ${selectedTeamId === t.id ? 'text-gray-900' : 'text-gray-500'}`}>{t.name}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                
                {/* Pitchers */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                   <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                     <h3 className="font-bold text-slate-700 flex items-center">
                       <span className="w-1 h-5 bg-blue-500 rounded-full mr-2"></span>
                       投手成績
                     </h3>
                     <span className="text-xs text-slate-400 bg-white px-2 py-1 rounded border">PITCHERS</span>
                   </div>
                   <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead className="bg-white text-xs text-slate-400 font-semibold border-b border-slate-100">
                        <tr>
                          <th className="p-3 w-10">Cond</th>
                          <th className="p-3 w-12">Pos</th>
                          <th className="p-3 text-left">Name / Age</th>
                          <th className="p-3 text-center">Sta</th>
                          <th className="p-3 text-center">Con</th>
                          <th className="p-3 text-right">ERA</th>
                          <th className="p-3 text-right">W-L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teams.find(t => t.id === selectedTeamId)?.players.filter(p => p.position === 'P').map(renderPlayerRow)}
                      </tbody>
                    </table>
                   </div>
                </div>

                {/* Fielders */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                   <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                     <h3 className="font-bold text-slate-700 flex items-center">
                       <span className="w-1 h-5 bg-red-500 rounded-full mr-2"></span>
                       野手成績
                     </h3>
                     <span className="text-xs text-slate-400 bg-white px-2 py-1 rounded border">FIELDERS</span>
                   </div>
                   <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead className="bg-white text-xs text-slate-400 font-semibold border-b border-slate-100">
                        <tr>
                          <th className="p-3 w-10">Cond</th>
                          <th className="p-3 w-12">Pos</th>
                          <th className="p-3 text-left">Name / Age</th>
                          <th className="p-3 text-center hidden md:table-cell">Mee</th>
                          <th className="p-3 text-center hidden md:table-cell">Pow</th>
                          <th className="p-3 text-center hidden md:table-cell">Spd</th>
                          <th className="p-3 text-center md:hidden">Ability</th>
                          <th className="p-3 text-right">AVG</th>
                          <th className="p-3 text-right">HR</th>
                          <th className="p-3 text-right">RBI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teams.find(t => t.id === selectedTeamId)?.players.filter(p => p.position !== 'P').map(renderPlayerRow)}
                      </tbody>
                    </table>
                   </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
