import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, MOCK, shouldUseMockFallback } from './api';
import Sidebar from './components/Sidebar';
import TodayScreen from './screens/TodayScreen';
import DayStartScreen from './screens/DayStartScreen';
import DayEndScreen from './screens/DayEndScreen';
import CompletedScreen from './screens/CompletedScreen';
import UpcomingScreen from './screens/UpcomingScreen';
import StaleModal from './modals/StaleModal';
import SettingsModal from './modals/SettingsModal';
import { ToastContainer } from './components/Toast';
import { useToasts, toast } from './components/toastStore';
import Spinner from './components/Spinner';

async function apiOrMock(fn, mockData) {
  try { return await fn(); }
  catch (e) {
    if (shouldUseMockFallback(e)) return mockData;
    throw e;
  }
}

export default function App() {
  const toasts = useToasts();
  const queryClient = useQueryClient();
  const [screen, setScreen] = useState('today');
  const [activeNav, setActiveNav] = useState('today');
  const [summary, setSummary] = useState(null);
  const [staleResolved, setStaleResolved] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data: todayData, isLoading } = useQuery({
    queryKey: ['today'],
    queryFn: () => apiOrMock(() => api.getToday(), MOCK.today),
  });

  const carryOverPending = todayData?.carry_over_pending ?? todayData?.carryOverPending ?? [];

  const staleQueue = [
    ...(todayData?.planned || []),
    ...carryOverPending,
  ].filter(t => t.freshness === 'STALE');

  const showStale = staleQueue.length > 0 && !staleResolved;
  const effectiveScreen = screen === 'today' && !showStale && carryOverPending.length > 0 ? 'day-start' : screen;

  const endDayMutation = useMutation({
    mutationFn: async () => {
      await apiOrMock(() => api.endDay(), {});
      return apiOrMock(() => api.getDaySummary(), MOCK.summary);
    },
    onSuccess: (sum) => {
      setSummary(sum);
      setScreen('day-end');
    },
    onError: (e) => toast(e.message || '하루 종료 중 오류', 'error'),
  });

  const winW = typeof window !== 'undefined' ? window.innerWidth : 1440;
  const winH = typeof window !== 'undefined' ? window.innerHeight : 960;
  const compact = winW < 980;

  function handleNav(nextNav) {
    if (nextNav === 'today' || nextNav === 'upcoming' || nextNav === 'logbook') {
      setActiveNav(nextNav);
      setScreen(nextNav === 'logbook' ? 'completed' : nextNav);
      return;
    }
    if (nextNav !== 'today') {
      toast('이 섹션은 아직 준비 중입니다. 오늘 화면에서 바로 관리해 주세요.');
      setActiveNav('today');
      setScreen('today');
      return;
    }
  }

  return (
    <div style={{
      fontFamily: 'var(--font)',
      color: 'var(--c-text)',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: compact ? '100%' : Math.min(winW - 48, 1180),
        height: compact ? `calc(${winH}px - 20px)` : Math.min(winH - 48, 760),
        maxWidth: '100%',
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-shell)',
        display: 'flex',
        position: 'relative',
        background: 'rgba(255,255,255,0.72)',
        border: '1px solid rgba(255,255,255,0.58)',
        backdropFilter: 'blur(18px)',
        animation: 'riseIn 0.35s ease',
        flexDirection: compact ? 'column' : 'row',
      }}>
        <Sidebar
          activeNav={activeNav}
          onNav={handleNav}
          completedCount={todayData?.completed?.length ?? 0}
          pendingCount={(todayData?.planned?.length ?? 0) + (todayData?.blocked?.length ?? 0)}
          onDayEnd={() => endDayMutation.mutate()}
          onSettings={() => setSettingsOpen(true)}
        />

        <div style={{
          flex: 1,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(252,252,252,0.98) 100%)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backdropFilter: 'blur(10px)',
        }}>
          {isLoading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Spinner size={24} color="var(--c-accent)" />
            </div>
          ) : effectiveScreen === 'day-start' ? (
            <DayStartScreen
              carryOverPending={carryOverPending}
              onComplete={() => {
                queryClient.invalidateQueries({ queryKey: ['today'] });
                setScreen('today');
              }}
            />
          ) : effectiveScreen === 'day-end' ? (
            <DayEndScreen
              summary={summary}
              carryOverPending={todayData?.planned || []}
              onDayStart={() => { queryClient.invalidateQueries({ queryKey: ['today'] }); setScreen('today'); }}
              onBack={() => setScreen('today')}
            />
          ) : effectiveScreen === 'completed' ? (
            <CompletedScreen tasks={todayData?.completed || []} />
          ) : effectiveScreen === 'upcoming' ? (
            <UpcomingScreen
              active={todayData?.active}
              planned={todayData?.planned || []}
              blocked={todayData?.blocked || []}
              carryOverPending={carryOverPending}
              onGoToday={() => {
                setActiveNav('today');
                setScreen('today');
              }}
            />
          ) : (
            <TodayScreen onDayEnd={() => endDayMutation.mutate()} onOpenSettings={() => setSettingsOpen(true)} />
          )}
        </div>
      </div>

      {showStale && (
        <StaleModal
          tasks={staleQueue}
          onResolved={() => {
            setStaleResolved(true);
            queryClient.invalidateQueries({ queryKey: ['today'] });
          }}
        />
      )}

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <ToastContainer toasts={toasts} />
    </div>
  );
}
