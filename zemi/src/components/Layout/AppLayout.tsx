import { useState } from 'react';
import NetworkMap from '../NetworkMap/NetworkMap';
import EventLog from '../EventLog/EventLog';
import Timeline from '../Timeline/Timeline';
import WelcomeOverlay, { WelcomeOverlayLauncher } from '../Onboarding/WelcomeOverlay';

export default function AppLayout() {
  // WelcomeOverlay の開閉はここで持ち上げて controlled 化する。
  // 起動ボタン(マップ領域ラッパ内)とモーダル本体(ルート直下)を構造的に分離するため。
  const [welcomeOpen, setWelcomeOpen] = useState(true);

  return (
    <div className="h-screen w-screen bg-cyberbg overflow-hidden text-slate-200 flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* isolate: マップ内の z-index をこのスコープに閉じ込め、外側(サイドバー等)と競合させない */}
        <div className="relative isolate flex-1 overflow-hidden">
          <NetworkMap />
          {!welcomeOpen && <WelcomeOverlayLauncher onOpen={() => setWelcomeOpen(true)} />}
        </div>
        <div className="w-80 xl:w-96 shrink-0 border-l border-slate-800 overflow-hidden">
          <EventLog />
        </div>
      </div>
      <div className="h-32 md:h-40 w-full shrink-0 border-t border-slate-800 overflow-hidden">
        <Timeline />
      </div>
      {/* モーダル本体は isolate スコープの外(ルート直下)に置く。中に入れるとスタッキングコンテキストが
          閉じてサイドバーの下に潜ってしまうため */}
      <WelcomeOverlay open={welcomeOpen} onClose={() => setWelcomeOpen(false)} />
    </div>
  );
}
