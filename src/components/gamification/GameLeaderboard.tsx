// Game Leaderboard Component
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import {
  getLeaderboard,
  type GameType,
  type GameLevel,
  type LeaderboardEntry,
  getGameTypeName,
  getLevelName,
} from '@/lib/gameScores';

interface GameLeaderboardProps {
  gameType: GameType;
  defaultLevel?: GameLevel;
  showLevelTabs?: boolean;
  maxEntries?: number;
  className?: string;
}

export function GameLeaderboard({
  gameType,
  defaultLevel = 'medium',
  showLevelTabs = true,
  maxEntries = 10,
  className = '',
}: GameLeaderboardProps) {
  const { userProfile } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<GameLevel>(defaultLevel);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadLeaderboard();
  }, [gameType, selectedLevel]);
  
  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const data = await getLeaderboard(gameType, selectedLevel);
      setLeaderboard(data.slice(0, maxEntries));
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500';
      case 2:
        return 'bg-gray-400/20 border-gray-400/50 text-gray-400';
      case 3:
        return 'bg-orange-500/20 border-orange-500/50 text-orange-500';
      default:
        return 'bg-muted/50 border-border text-muted-foreground';
    }
  };
  
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };
  
  const levels: GameLevel[] = ['easy', 'medium', 'hard'];
  
  const renderLeaderboardList = () => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      );
    }
    
    if (leaderboard.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-4xl mb-2">🏆</div>
          <p>No scores yet!</p>
          <p className="text-sm">Be the first to set a record!</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        {leaderboard.map((entry, index) => {
          const isCurrentUser = entry.userId === userProfile?.id;
          const rank = entry.rank || index + 1;
          
          return (
            <div
              key={entry.userId}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                isCurrentUser
                  ? 'bg-primary/10 border-primary/50 ring-1 ring-primary/30'
                  : getRankStyle(rank)
              }`}
            >
              {/* Rank */}
              <div className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg ${
                rank <= 3 ? '' : 'bg-muted'
              }`}>
                {getRankIcon(rank)}
              </div>
              
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
                {entry.userAvatar ? (
                  <img
                    src={entry.userAvatar}
                    alt={entry.userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">
                    👤
                  </div>
                )}
              </div>
              
              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${isCurrentUser ? 'text-primary' : ''}`}>
                  {entry.userName}
                  {isCurrentUser && <span className="ml-1 text-xs">(You)</span>}
                </p>
              </div>
              
              {/* Score */}
              <div className="text-right">
                <p className="font-bold text-lg">{entry.score.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">pts</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <span>🏆</span>
          <span>Leaderboard</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {getGameTypeName(gameType)}
        </p>
      </CardHeader>
      <CardContent>
        {showLevelTabs ? (
          <Tabs value={selectedLevel} onValueChange={(v) => setSelectedLevel(v as GameLevel)}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              {levels.map((level) => (
                <TabsTrigger key={level} value={level}>
                  {getLevelName(level)}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {levels.map((level) => (
              <TabsContent key={level} value={level}>
                {renderLeaderboardList()}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          renderLeaderboardList()
        )}
      </CardContent>
    </Card>
  );
}
