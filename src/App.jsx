import { useState, useEffect } from "react";

const PHASES = [
  {
    id: "basic",
    name: "🌙 基礎期",
    subtitle: "12:30前熟睡・7:30前起",
    sleepTarget: "00:30",
    wakeTarget: "07:30",
    color: "#7C6FCD",
    bg: "rgba(124,111,205,0.1)",
    rewards: [
      { days: 3, label: "香氛蠟燭或擴香", type: "居家氛圍" },
      { days: 6, label: "高質感馬克杯或保溫瓶", type: "日常質感" },
      { days: 9, label: "好用的床組枕套", type: "睡眠升級" },
      { days: 12, label: "收納整理好物", type: "環境優化" },
      { days: 15, label: "護膚保養品套組", type: "自我照顧" },
      { days: 21, label: "🎉 晉級進階期！", type: "晉級" },
    ],
  },
  {
    id: "intermediate",
    name: "🌛 進階期",
    subtitle: "12:00前熟睡・7:00前起",
    sleepTarget: "00:00",
    wakeTarget: "07:00",
    color: "#4A90D9",
    bg: "rgba(74,144,217,0.1)",
    rewards: [
      { days: 3, label: "精裝書一本", type: "知識投資" },
      { days: 6, label: "高質感文具或桌面小物", type: "工作環境" },
      { days: 9, label: "舒適家居服或睡衣", type: "生活品質" },
      { days: 12, label: "體驗課程（陶藝・花藝・烹飪）", type: "生活豐富度" },
      { days: 15, label: "高質感耳機或藍牙喇叭", type: "科技升級" },
      { days: 21, label: "🎉 晉級達標期！", type: "晉級" },
    ],
  },
  {
    id: "master",
    name: "⭐ 達標期",
    subtitle: "10:00前熟睡・6:00前起",
    sleepTarget: "22:00",
    wakeTarget: "06:00",
    color: "#E8A838",
    bg: "rgba(232,168,56,0.1)",
    rewards: [
      { days: 3, label: "高質感文具組或皮革小物", type: "日常精緻" },
      { days: 7, label: "想要已久的衣服或包包", type: "穿搭升級" },
      { days: 14, label: "🏆 Apple Watch！", type: "終極獎勵" },
    ],
  },
];

function timeToMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function checkPass(phase, sleepTime, wakeTime) {
  if (!sleepTime || !wakeTime) return false;
  const sleepMins = timeToMinutes(sleepTime);
  const wakeMins = timeToMinutes(wakeTime);
  const targetS = timeToMinutes(phase.sleepTarget);
  const targetWakeMins = timeToMinutes(phase.wakeTarget);
  const sleepPass = sleepMins <= targetS || sleepMins >= 20 * 60;
  const wakePass = wakeMins <= targetWakeMins;
  return sleepPass && wakePass;
}

function getStreakInPhase(logs, phaseId) {
  const phaseLogs = logs.filter((l) => l.phase === phaseId).sort((a, b) => new Date(b.date) - new Date(a.date));
  let streak = 0;
  for (const log of phaseLogs) {
    if (log.pass) streak++;
    else break;
  }
  return streak;
}

function getTotalPassInPhase(logs, phaseId) {
  return logs.filter((l) => l.phase === phaseId && l.pass).length;
}

export default function SleepTracker() {
  const [activePhase, setActivePhase] = useState(0);
  const [phases, setPhases] = useState(PHASES);
  const [logs, setLogs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sleepLogs") || "[]"); } catch { return []; }
  });
  const [todaySleep, setTodaySleep] = useState("");
  const [todayWake, setTodayWake] = useState("");
  const [note, setNote] = useState("");
  const [editingReward, setEditingReward] = useState(null);
  const [editText, setEditText] = useState("");
  const [tab, setTab] = useState("checkin");
  const [showSuccess, setShowSuccess] = useState(false);
  const [usedRescue, setUsedRescue] = useState(() => {
    try { return JSON.parse(localStorage.getItem("usedRescue") || "{}"); } catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem("sleepLogs", JSON.stringify(logs));
  }, [logs]);
  useEffect(() => {
    localStorage.setItem("usedRescue", JSON.stringify(usedRescue));
  }, [usedRescue]);

  const today = new Date().toISOString().split("T")[0];
  const phase = phases[activePhase];
  const todayLog = logs.find((l) => l.date === today && l.phase === phase.id);
  const streak = getStreakInPhase(logs, phase.id);
  const totalPass = getTotalPassInPhase(logs, phase.id);
  const nextReward = phase.rewards.find((r) => r.days > streak);
  const daysToNext = nextReward ? nextReward.days - streak : 0;

  function handleCheckin() {
    if (!todaySleep || !todayWake) return;
    const pass = checkPass(phase, todaySleep, todayWake);
    const newLog = { date: today, phase: phase.id, sleepTime: todaySleep, wakeTime: todayWake, note, pass };
    setLogs((prev) => {
      const filtered = prev.filter((l) => !(l.date === today && l.phase === phase.id));
      return [newLog, ...filtered];
    });
    if (pass) setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    setNote("");
  }

  function handleEditReward(phaseIdx, rewardIdx) {
    setEditingReward({ phaseIdx, rewardIdx });
    setEditText(phases[phaseIdx].rewards[rewardIdx].label);
  }

  function saveReward() {
    if (!editingReward) return;
    setPhases((prev) => {
      const next = prev.map((p, pi) => {
        if (pi !== editingReward.phaseIdx) return p;
        const rewards = p.rewards.map((r, ri) =>
          ri === editingReward.rewardIdx ? { ...r, label: editText } : r
        );
        return { ...p, rewards };
      });
      return next;
    });
    setEditingReward(null);
  }


  
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0d0d1a 0%, #111827 50%, #0d1a2a 100%)",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      color: "#e8e0d0",
      padding: "0",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+3:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0d0d1a; }
        .tracker { font-family: 'Source Sans 3', sans-serif; max-width: 480px; margin: 0 auto; padding: 0 0 80px; }
        .header { padding: 32px 24px 20px; text-align: center; }
        .header h1 { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 700; color: #f0e8d8; }
        .header p { font-size: 13px; color: #8a8070; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }
        .moon { font-size: 40px; display: block; margin-bottom: 8px; }
        .phase-tabs { display: flex; gap: 8px; padding: 0 24px 16px; overflow-x: auto; scrollbar-width: none; }
        .phase-tabs::-webkit-scrollbar { display: none; }
        .phase-tab { padding: 8px 16px; border-radius: 20px; font-size: 12px; border: 1.5px solid transparent; cursor: pointer; white-space: nowrap; transition: all 0.2s; background: rgba(255,255,255,0.04); color: #8a8070; }
        .phase-tab.active { color: white; border-color: currentColor; }
        .card { margin: 0 24px 16px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px; }
        .streak-display { text-align: center; padding: 24px 20px; }
        .streak-num { font-family: 'Playfair Display', serif; font-size: 72px; font-weight: 700; line-height: 1; }
        .streak-label { font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #8a8070; margin-top: 4px; }
        .next-reward-bar { margin-top: 16px; }
        .bar-track { height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 2px; transition: width 0.6s ease; }
        .bar-label { display: flex; justify-content: space-between; font-size: 11px; color: #6a6060; margin-top: 6px; }
        .section-title { font-family: 'Playfair Display', serif; font-size: 14px; color: #c0b090; letter-spacing: 0.5px; margin-bottom: 14px; }
        .time-row { display: flex; gap: 12px; margin-bottom: 12px; }
        .time-group { flex: 1; }
        .time-group label { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #6a6060; display: block; margin-bottom: 6px; }
        .time-input { width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 10px 12px; color: #e8e0d0; font-size: 18px; text-align: center; outline: none; }
        .note-input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 10px 14px; color: #c0b090; font-size: 13px; outline: none; resize: none; margin-bottom: 14px; }
        .checkin-btn { width: 100%; padding: 14px; border-radius: 12px; border: none; font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .tab-bar { display: flex; background: rgba(255,255,255,0.04); border-radius: 12px; padding: 4px; margin: 0 24px 16px; }
        .tab-btn { flex: 1; padding: 8px; border: none; background: transparent; color: #6a6060; font-size: 12px; cursor: pointer; border-radius: 8px; transition: all 0.2s; }
        .tab-btn.active { background: rgba(255,255,255,0.08); color: #e8e0d0; }
        .reward-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .reward-item:last-child { border-bottom: none; }
        .reward-day-badge { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 700; flex-shrink: 0; }
        .reward-info { flex: 1; }
        .reward-label { font-size: 13px; color: #d0c8b8; line-height: 1.4; }
        .reward-type { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #6a6060; margin-top: 2px; }
        .edit-btn { background: none; border: none; color: #5a5a6a; cursor: pointer; font-size: 14px; padding: 4px; }
        .reward-earned .reward-day-badge { background: rgba(74,222,128,0.1); color: #4ade80; }
        .log-item { padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 12px; }
        .log-item:last-child { border-bottom: none; }
        .log-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .log-date { font-size: 12px; color: #6a6060; min-width: 80px; }
        .log-times { font-size: 13px; color: #c0b090; }
        .log-note { font-size: 11px; color: #5a5050; margin-top: 2px; }
        .pass-tag { font-size: 10px; letter-spacing: 1px; padding: 2px 7px; border-radius: 4px; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 24px; }
        .modal { background: #1a1a2e; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; width: 100%; max-width: 360px; }
        .modal h3 { font-family: 'Playfair Display', serif; font-size: 18px; margin-bottom: 16px; color: #f0e8d8; }
        .modal-input { width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 12px 14px; color: #e8e0d0; font-size: 14px; outline: none; margin-bottom: 16px; }
        .modal-btns { display: flex; gap: 10px; }
        .modal-btns button { flex: 1; padding: 10px; border-radius: 10px; border: none; font-size: 14px; cursor: pointer; }
        .success-toast { position: fixed; top: 24px; left: 50%; transform: translateX(-50%); background: rgba(74,222,128,0.15); border: 1px solid rgba(74,222,128,0.3); color: #4ade80; padding: 12px 24px; border-radius: 20px; font-size: 14px; z-index: 200; animation: fadeInOut 3s forwards; white-space: nowrap; }
        @keyframes fadeInOut { 0%{opacity:0;transform:translateX(-50%) translateY(-10px)} 10%{opacity:1;transform:translateX(-50%) translateY(0)} 80%{opacity:1} 100%{opacity:0} }
        .target-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.05); border-radius: 8px; padding: 6px 12px; font-size: 12px; color: #8a8070; }
        .checked-today { display: flex; align-items: center; gap: 8px; background: rgba(74,222,128,0.08); border: 1px solid rgba(74,222,128,0.2); border-radius: 10px; padding: 12px 14px; font-size: 13px; color: #4ade80; }
      `}</style>


            <div className="tracker">
        {showSuccess && <div className="success-toast">✨ 打卡成功！繼續保持</div>}
        <div className="header">
          <span className="moon">🌙</span>
          <h1>早安計劃</h1>
          <p>Sleep Better · Rise Earlier</p>
        </div>
        <div className="phase-tabs">
          {phases.map((p, i) => (
            <button key={p.id} className={`phase-tab${activePhase === i ? " active" : ""}`}
              style={activePhase === i ? { borderColor: p.color, color: p.color, background: p.bg } : {}}
              onClick={() => setActivePhase(i)}>{p.name}</button>
          ))}
        </div>
        <div className="card">
          <div className="streak-display">
            <div className="streak-num" style={{ color: phase.color }}>{streak}</div>
            <div className="streak-label">連續達標天數</div>
            <div style={{ marginTop: 8, fontSize: 12, color: "#6a6060" }}>累計 {totalPass} 天・{phase.subtitle}</div>
          </div>
          {nextReward && (
            <div className="next-reward-bar">
              <div style={{ fontSize: 12, color: "#8a8070", marginBottom: 6 }}>
                再 <span style={{ color: phase.color, fontWeight: 600 }}>{daysToNext}</span> 天 → {nextReward.label}
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${Math.min(100, (streak / nextReward.days) * 100)}%`, background: `linear-gradient(90deg, ${phase.color}88, ${phase.color})` }} />
              </div>
              <div className="bar-label"><span>{streak} 天</span><span>{nextReward.days} 天</span></div>
            </div>
          )}
        </div>
        <div className="tab-bar">
          {[["checkin", "📝 今日打卡"], ["rewards", "🎁 獎勵列表"], ["history", "📅 歷史記錄"]].map(([id, label]) => (
            <button key={id} className={`tab-btn${tab === id ? " active" : ""}`} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>
        {tab === "checkin" && (
          <div className="card">
            <div className="section-title">今日打卡</div>
            {todayLog && (
              <div>
                <div className="checked-today">
                  <span>{todayLog.pass ? "✅" : "❌"}</span>
                  <span>今天已打卡：{todayLog.sleepTime} 睡・{todayLog.wakeTime} 醒</span>
                </div>
                <div style={{ marginTop: 12, fontSize: 12, color: "#6a6060", textAlign: "center" }}>重新填寫將覆蓋今日記錄</div>
              </div>
            )}
            <div style={{ marginTop: todayLog ? 16 : 0 }}>
              <div className="time-row">
                <div className="time-group">
                  <label>熟睡時間</label>
                  <input type="time" className="time-input" value={todaySleep} onChange={(e) => setTodaySleep(e.target.value)} />
                </div>
                <div className="time-group">
                  <label>起床時間</label>
                  <input type="time" className="time-input" value={todayWake} onChange={(e) => setTodayWake(e.target.value)} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <div className="target-badge">💤 目標入睡 {phase.sleepTarget}</div>
                <div className="target-badge">⏰ 目標起床 {phase.wakeTarget}</div>
              </div>
              <textarea className="note-input" rows={2} placeholder="備註（睡眠品質、特別狀況…）" value={note} onChange={(e) => setNote(e.target.value)} />
              <button className="checkin-btn"
                style={{ background: (!todaySleep || !todayWake) ? "rgba(255,255,255,0.06)" : `linear-gradient(135deg, ${phase.color}cc, ${phase.color})`, color: (!todaySleep || !todayWake) ? "#4a4a5a" : "white", cursor: (!todaySleep || !todayWake) ? "not-allowed" : "pointer" }}
                onClick={handleCheckin} disabled={!todaySleep || !todayWake}>確認打卡</button>
            </div>
            <div style={{ marginTop: 14, padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8, fontSize: 11, color: "#5a5a6a", lineHeight: 1.6 }}>
              💡 <b style={{ color: "#7a7080" }}>補救機制</b>：每階段允許一次——失敗隔天提早30分鐘可不算中斷
              {!usedRescue[phase.id] && <span style={{ color: phase.color, marginLeft: 6 }}>（補救券未使用）</span>}
              {usedRescue[phase.id] && <span style={{ color: "#5a4040", marginLeft: 6 }}>（補救券已使用）</span>}
            </div>
            {!usedRescue[phase.id] && logs.filter(l => l.phase === phase.id && !l.pass).length > 0 && (
              <button style={{ marginTop: 8, width: "100%", background: "none", border: `1px solid ${phase.color}44`, borderRadius: 8, color: phase.color, padding: "8px", fontSize: 12, cursor: "pointer" }}
                onClick={() => setUsedRescue(prev => ({ ...prev, [phase.id]: true }))}>使用補救券</button>
            )}
          </div>
        )}
        {tab === "rewards" && (
          <div className="card">
            <div className="section-title">獎勵列表 <span style={{ fontSize: 11, color: "#5a5a6a", fontWeight: 400 }}>點擊✏️可編輯</span></div>
            {phase.rewards.map((r, ri) => {
              const earned = totalPass >= r.days;
              return (
                <div key={ri} className={`reward-item${earned ? " reward-earned" : ""}`}>
                  <div className="reward-day-badge" style={!earned ? { background: "rgba(255,255,255,0.05)", color: "#5a5070" } : {}}>{r.days}</div>
                  <div className="reward-info">
                    <div className="reward-label">{r.label}</div>
                    <div className="reward-type">{r.type}{earned ? " · 已達成 ✓" : ` · 還需 ${r.days - totalPass} 天`}</div>
                  </div>
                  <button className="edit-btn" onClick={() => handleEditReward(activePhase, ri)}>✏️</button>
                </div>
              );
            })}
          </div>
        )}
        {tab === "history" && (
          <div className="card">
            <div className="section-title">歷史記錄</div>
            {logs.filter(l => l.phase === phase.id).length === 0 && (
              <div style={{ textAlign: "center", color: "#4a4a5a", fontSize: 13, padding: "20px 0" }}>尚無記錄</div>
            )}
            {logs.filter(l => l.phase === phase.id).sort((a, b) => new Date(b.date) - new Date(a.date)).map((log, i) => (
              <div key={i} className="log-item">
                <div className="log-dot" style={{ background: log.pass ? "#4ade80" : "#f87171" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="log-date">{log.date}</span>
                    <span className="pass-tag" style={log.pass ? { background: "rgba(74,222,128,0.1)", color: "#4ade80" } : { background: "rgba(248,113,113,0.1)", color: "#f87171" }}>
                      {log.pass ? "達標" : "未達標"}
                    </span>
                  </div>
                  <div className="log-times">🌙 {log.sleepTime} &nbsp;☀️ {log.wakeTime}</div>
                  {log.note && <div className="log-note">{log.note}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {editingReward && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditingReward(null)}>
          <div className="modal">
            <h3>編輯獎勵內容</h3>
            <input className="modal-input" value={editText} onChange={(e) => setEditText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveReward()} autoFocus />
            <div className="modal-btns">
              <button style={{ background: "rgba(255,255,255,0.06)", color: "#8a8070" }} onClick={() => setEditingReward(null)}>取消</button>
              <button style={{ background: phase.color, color: "white", fontWeight: 600 }} onClick={saveReward}>儲存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
