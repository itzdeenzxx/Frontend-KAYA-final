// Game History Component
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import {
  getGameHistory,
  type GameType,
  type GameScore,
  getGameTypeName,
  getLevelName,
  formatDuration,
} from '@/lib/gameScores';

interface GameHistoryProps {
  gameType?: GameType;
  maxEntries?: number;
  showGameTypeTabs?: boolean;
  className?: string;
}

export function GameHistory({
  gameType,
  maxEntries = 20,
  showGameTypeTabs = false,
  className = '',
}: GameHistoryProps) {
  const { userProfile } = useAuth();
  const [selectedGameType, setSelectedGameType] = useState<GameType | 'all'>(
    gameType || 'all'
  );
  const [history, setHistory] = useState<GameScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadHistory();
  }, [userProfile?.id, selectedGameType]);
  
  const loadHistory = async () => {
    if (!userProfile?.id) return;
    
    setIsLoading(true);
    try {
      const gameTypeFilter = selectedGameType === 'all' ? undefined : selectedGameType;
      const data = await getGameHistory(userProfile.id, gameTypeFilter, maxEntries);
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
    });
  };
  
  const getGameIcon = (type: GameType) => {
    const icons: Record<GameType, string> = {
      fishing: '🎣',
      mouseRunning: '🐭',
      whackAMole: '🔨',
    };
    return icons[type];
  };
  
  const renderHistoryList = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      );
    }
    
    if (history.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-4xl mb-2">📜</div>
          <p>No games played yet!</p>
          <p className="text-sm">Start playing to see your history</p>
        </div>
      );
    }
    
    return (
      <ScrollArea className="h-[400px]">
        <div className="space-y-3 pr-4">
          {history.map((score) => (
            <div
              key={score.id}
              className={`p-4 rounded-lg border transition-all ${
                score.isPersonalBest
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-card border-border'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                {/* Left side - Game info */}
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{getGameIcon(score.gameType)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {getGameTypeName(score.gameType).replace(/^[^\s]+\s/, '')}
                      </span>
                      {score.isPersonalBest && (
                        <Badge variant="outline" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">
                          🏆 Best!
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{getLevelName(score.level)}</span>
                      <span>•</span>
                      <span>{formatDuration(score.duration)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Right side - Score & Time */}
                <div className="text-right">
                  <p className="font-bold text-xl">{score.score.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(score.timestamp)}
                  </p>
                </div>
              </div>
              
              {/* Game specific data */}
              {score.gameData && (
                <div className="mt-2 pt-2 border-t border-border/50 flex gap-4 text-xs text-muted-foreground">
                  {score.gameType === 'fishing' && (
                    <>
                      {score.gameData.fishCaught !== undefined && (
                        <span>🐟 {score.gameData.fishCaught} caught</span>
                      )}
                      {score.gameData.perfectCatches !== undefined && (
                        <span>⭐ {score.gameData.perfectCatches} perfect</span>
                      )}
                    </>
                  )}
                  {score.gameType === 'mouseRunning' && (
                    <>
                      {score.gameData.steps !== undefined && (
                        <span>👣 {score.gameData.steps} steps</span>
                      )}
                      {score.gameData.hitCount !== undefined && (
                        <span>💥 {score.gameData.hitCount} hits</span>
                      )}
                    </>
                  )}
                  {score.gameType === 'whackAMole' && (
                    <>
                      {score.gameData.molesHit !== undefined && (
                        <span>🎯 {score.gameData.molesHit} moles</span>
                      )}
                      {score.gameData.accuracy !== undefined && (
                        <span>📊 {score.gameData.accuracy}% acc</span>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  };
  
  const gameTypes: GameType[] = ['fishing', 'mouseRunning', 'whackAMole'];
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <span>📜</span>
          <span>Game History</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showGameTypeTabs ? (
          <Tabs
            value={selectedGameType}
            onValueChange={(v) => setSelectedGameType(v as GameType | 'all')}
          >
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              {gameTypes.map((type) => (
                <TabsTrigger key={type} value={type}>
                  {getGameIcon(type)}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value={selectedGameType}>
              {renderHistoryList()}
            </TabsContent>
          </Tabs>
        ) : (
          renderHistoryList()
        )}
      </CardContent>
    </Card>
  );
}
