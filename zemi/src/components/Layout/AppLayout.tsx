import { useRef, useState, type KeyboardEvent } from 'react';
import NetworkMap from '../NetworkMap/NetworkMap';
import EventLog from '../EventLog/EventLog';
import Timeline from '../Timeline/Timeline';
import WelcomeOverlay, { WelcomeOverlayLauncher } from '../Onboarding/WelcomeOverlay';
import { useSimulationStore } from '../../store/simulationStore';
import { useMediaQuery, DESKTOP_MEDIA_QUERY } from '../../hooks/useMediaQuery';

type MobileTab = 'map' | 'log' | 'timeline';

/** タブ/対応ペインを結ぶ`id`のペアを生成する(role="tab"のid/aria-controlsと
 * role="tabpanel"のid/aria-labelledbyを一致させるための共通ヘルパー)。 */
function tabId(tab: MobileTab): string {
  return `mobile-tab-${tab}`;
}
function panelId(tab: MobileTab): string {
  return `mobile-tabpanel-${tab}`;
}

/**
 * ペインラッパに付与するARIA属性を返す。`role="tabpanel"`はlg未満(モバイルのタブUI)でのみ
 * 意味を持つ。lg以上はタブバー自体が`lg:hidden`でDOM上も非表示(display:none)になり
 * 対応する`role="tab"`が存在しなくなるため、lg以上ではtabpanelロールを一切付与しない
 * (デスクトップ3ペインレイアウトのセマンティクスに`role="tabpanel"`を混入させないため)。
 */
function mobilePanelAttrs(tab: MobileTab, isDesktop: boolean) {
  if (isDesktop) return {};
  return {
    id: panelId(tab),
    role: 'tabpanel' as const,
    'aria-labelledby': tabId(tab),
  };
}

/**
 * lg未満(1024px未満)で非選択ペインを隠すためのクラス文字列を返す。
 * `hidden`(display:none)ではなく`invisible`(visibility:hidden)を使う理由:
 * NetworkMapは自身のResizeObserverでコンテナ実寸を測り、その値がuseNetworkLayoutの
 * d3-force再構築トリガーになっている。display:noneだと非表示中に実寸が0×0になり、
 * 再表示時にwidth/height変化を検知してシミュレーションが再構築され、ノード配置が
 * 起点座標まで飛んでしまう。visibility:hiddenはレイアウトボックスの寸法を保持したまま
 * 視覚的にもポインタ操作的にも隠せるため、この問題を回避できる。
 * lg以上では常にvisible/pointer-events-auto(タブ状態に関係なく3ペイン表示)。
 */
function paneVisibilityClass(tab: MobileTab, activeTab: MobileTab): string {
  return activeTab === tab
    ? 'visible z-10 pointer-events-auto lg:visible lg:z-auto lg:pointer-events-auto'
    : 'invisible z-0 pointer-events-none lg:visible lg:z-auto lg:pointer-events-auto';
}

/**
 * lg未満でのみ表示するタブバー本体。イベントログ/タイムラインの件数バッジ表示のために
 * store を購読するが、AppLayout本体からは分離しているため、ログ/タイムライン追加のたびに
 * NetworkMap 等まで再レンダーされることはない(このコンポーネントのみ再レンダーされる)。
 * ARIAのtabパターンを実装: 各tabに`id`/`aria-controls`(対応するtabpanelを指す)、
 * ロービングフォーカス(選択中のみtabIndex=0、他は-1)、左右矢印キーでのタブ移動(端で折り返し、
 * 移動先を選択状態にしてフォーカスも移す)。
 */
function MobileTabBar({
  activeTab,
  onSelect,
}: {
  activeTab: MobileTab;
  onSelect: (tab: MobileTab) => void;
}) {
  const logsCount = useSimulationStore((state) => state.logs.length);
  const timelineCount = useSimulationStore((state) => state.timeline.length);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const tabs: { key: MobileTab; label: string; count?: number }[] = [
    { key: 'map', label: 'マップ' },
    { key: 'log', label: 'イベントログ', count: logsCount },
    { key: 'timeline', label: 'タイムライン', count: timelineCount },
  ];

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (index + delta + tabs.length) % tabs.length;
    const nextTab = tabs[nextIndex];
    onSelect(nextTab.key);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div role="tablist" className="flex shrink-0 border-t border-slate-800 bg-slate-900/60 lg:hidden">
      {tabs.map((tab, index) => {
        const selected = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={tabId(tab.key)}
            aria-controls={panelId(tab.key)}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(tab.key)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-xs font-medium transition-colors ${
              selected ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="flex items-center gap-1.5">
              {tab.label}
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function AppLayout() {
  // WelcomeOverlay の開閉はここで持ち上げて controlled 化する。
  // 起動ボタン(マップ領域ラッパ内)とモーダル本体(ルート直下)を構造的に分離するため。
  const [welcomeOpen, setWelcomeOpen] = useState(true);
  // Phase2: lg未満での下部タブ切替状態。lg以上ではこの状態は使われず3ペイン常時表示。
  const [activeTab, setActiveTab] = useState<MobileTab>('map');
  // CSSの`lg`ブレークポイントと完全に一致させたデスクトップ判定。tabpanelロールの出し分けと
  // NetworkMapへの`active`(ParticleCanvasの描画継続)propの両方に使う。
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  // lg以上は常にtrue(デスクトップでは絶対にParticleCanvasの描画を止めない)。
  // lg未満はmapタブが選択されている間のみtrue。
  const isMapActive = isDesktop || activeTab === 'map';

  return (
    <div className="h-[100dvh] lg:h-screen w-screen bg-cyberbg overflow-hidden text-slate-200 flex flex-col">
      {/* ステージ領域: lg以上は「マップ+サイドバー行」と「タイムライン行」の2段(現行のまま)。
          lg未満はマップ/イベントログ/タイムラインの3ペインを同一矩形に絶対配置で重ね、
          タブで表示切替する(いずれも常にマウントしたまま、visibilityのみ切り替える)。 */}
      <div className="relative flex-1 min-h-0 lg:flex lg:flex-col">
        <div className="relative h-full w-full overflow-hidden lg:flex lg:flex-1 lg:min-h-0">
          {/* isolate: マップ内の z-index をこのスコープに閉じ込め、外側(サイドバー等)と競合させない */}
          <div
            {...mobilePanelAttrs('map', isDesktop)}
            className={`absolute inset-0 isolate overflow-hidden lg:relative lg:flex-1 ${paneVisibilityClass('map', activeTab)}`}
          >
            <NetworkMap active={isMapActive} />
            {!welcomeOpen && <WelcomeOverlayLauncher onOpen={() => setWelcomeOpen(true)} />}
          </div>
          <div
            {...mobilePanelAttrs('log', isDesktop)}
            className={`absolute inset-0 overflow-hidden lg:static lg:w-80 xl:w-96 lg:shrink-0 lg:border-l lg:border-slate-800 ${paneVisibilityClass('log', activeTab)}`}
          >
            <EventLog />
          </div>
        </div>
        <div
          {...mobilePanelAttrs('timeline', isDesktop)}
          className={`absolute inset-0 overflow-hidden lg:static lg:h-40 lg:w-full lg:shrink-0 lg:border-t lg:border-slate-800 ${paneVisibilityClass('timeline', activeTab)}`}
        >
          <Timeline />
        </div>
      </div>
      <MobileTabBar activeTab={activeTab} onSelect={setActiveTab} />
      {/* モーダル本体は isolate スコープの外(ルート直下)に置く。中に入れるとスタッキングコンテキストが
          閉じてサイドバーの下に潜ってしまうため */}
      <WelcomeOverlay open={welcomeOpen} onClose={() => setWelcomeOpen(false)} />
    </div>
  );
}
