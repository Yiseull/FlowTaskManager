import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, MOCK } from './api';
import Sidebar from './components/Sidebar';
import TodayScreen from './screens/TodayScreen';
import DayStartScreen from './screens/DayStartScreen';
import DayEndScreen from './screens/DayEndScreen';
import StaleModal from './modals/StaleModal';
import { useToasts, ToastContainer, toast } from './components/Toast';
import Spinner from './components/Spinner';

async function apiOrMock(fn, mockData) {
  try { return await fn(); }
  catch (e) {
    if (e instanceof TypeError) return mockData;
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

  const { data: todayData, isLoading } = useQuery({
    queryKey: ['today'],
    queryFn: () => apiOrMock(() => api.getToday(), MOCK.today),
  });

  useEffect(() => {
    if (todayData?.carry_over_pending?.length > 0) setScreen('day-start');
  }, [todayData?.carry_over_pending?.length]);

  const staleQueue = [
    ...(todayData?.planned || []),
    ...(todayData?.carry_over_pending || []),
  ].filter(t => t.freshness === 'STALE');

  const showStale = staleQueue.length > 0 && !staleResolved && screen === 'today';

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

  const winW = Math.min(typeof window !== 'undefined' ? window.innerWidth - 48 : 960, 960);
  const winH = Math.min(typeof window !== 'undefined' ? window.innerHeight - 48 : 640, 640);

  return (
    <div style={{ fontFamily: 'var(--font)', color: 'var(--c-text)' }}>
      <div style={{
        width: winW, height: winH, borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 0 0 0.5px rgba(0,0,0,0.25), 0 20px 60px rgba(0,0,0,0.4)',
        display: 'flex', position: 'relative',
      }}>
        <Sidebar
          activeNav={activeNav}
          onNav={setActiveNav}
          completedCount={todayData?.completed?.length ?? 0}
          pendingCount={(todayData?.planned?.length ?? 0) + (todayData?.blocked?.length ?? 0)}
          onDayEnd={() => endDayMutation.mutate()}
        />

        <div style={{ flex: 1, background: 'var(--c-surface)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Spinner size={24} color="var(--c-accent)" />
            </div>
          ) : screen === 'day-start' ? (
            <DayStartScreen
              carryOverPending={todayData?.carry_over_pending || []}
              onComplete={() => {
                queryClient.invalidateQueries({ queryKey: ['today'] });
                setScreen('today');
              }}
            />
          ) : screen === 'day-end' ? (
            <DayEndScreen
              summary={summary}
              carryOverPending={todayData?.planned || []}
              onDayStart={() => { queryClient.invalidateQueries({ queryKey: ['today'] }); setScreen('today'); }}
              onBack={() => setScreen('today')}
            />
          ) : (
            <TodayScreen onDayEnd={() => endDayMutation.mutate()} />
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

      <ToastContainer toasts={toasts} />
    </div>
  );
}
