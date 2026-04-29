function formatCompletedTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function completedAt(task) {
  return task.completed_at ?? task.completedAt ?? null;
}

export default function CompletedScreen({ tasks = [] }) {
  const compact = typeof window !== 'undefined' && window.innerWidth < 980;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: compact ? '24px 18px 24px' : '30px 34px 34px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: compact ? 28 : 34, lineHeight: 1.04, fontWeight: 780, letterSpacing: '-0.04em' }}>
            완료됨
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--c-muted)', maxWidth: 560 }}>
            오늘 마친 작업을 한곳에서 확인합니다. 현재 화면은 기록만 보여주고, 작업 전환과 집중 흐름은 오늘 화면에서 계속 관리합니다.
          </div>
        </section>

        <section style={{
          padding: compact ? '22px 20px' : '26px 28px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(251,251,249,0.92) 100%)',
          borderRadius: 30,
          border: '1px solid var(--c-border)',
          boxShadow: 'var(--shadow-card)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: 20, lineHeight: 1.2, fontWeight: 800, letterSpacing: '-0.04em' }}>오늘 완료한 작업</h2>
              <span style={{
                minWidth: 30,
                height: 30,
                padding: '0 10px',
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(123, 137, 112, 0.08)',
                color: 'var(--c-muted)',
                fontSize: 15,
                fontWeight: 700,
              }}>
                {tasks.length}
              </span>
            </div>
            <span style={{ fontSize: 14, color: 'var(--c-muted)', fontWeight: 600 }}>
              완료 시각 기준
            </span>
          </div>

          {tasks.length === 0 ? (
            <div style={{
              padding: '14px 0 6px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              color: 'var(--c-muted)',
            }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>아직 완료한 작업이 없습니다.</div>
              <div style={{ fontSize: 15, lineHeight: 1.55 }}>
                오늘 화면에서 진행 중인 작업을 마치면 이곳에 기록됩니다.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {tasks.map((task, index) => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: compact ? '15px 0' : '18px 0',
                    borderBottom: index === tasks.length - 1 ? 'none' : '1px solid rgba(123, 137, 112, 0.12)',
                  }}
                >
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: 'var(--c-success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 11 11" fill="none">
                      <path d="M2.5 5.5l2.5 2.5 3.5-4" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: 16, lineHeight: 1.4, fontWeight: 700, wordBreak: 'break-word' }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--c-muted)' }}>
                      작업 완료
                    </div>
                  </div>

                  <div style={{
                    flexShrink: 0,
                    padding: '8px 12px',
                    borderRadius: 999,
                    background: 'rgba(127,160,111,0.12)',
                    color: 'var(--c-success)',
                    fontSize: 13,
                    fontWeight: 800,
                  }}>
                    {formatCompletedTime(completedAt(task)) || '시각 없음'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
