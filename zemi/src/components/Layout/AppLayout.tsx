import NetworkMap from '../NetworkMap/NetworkMap';
import EventLog from '../EventLog/EventLog';
import Timeline from '../Timeline/Timeline';
import StatsPanel from '../StatsPanel/StatsPanel';
import WelcomeOverlay from '../Onboarding/WelcomeOverlay';

export default function AppLayout() {
  return (
    <div className="h-screen w-screen bg-cyberbg overflow-hidden text-slate-200 flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        <div className="relative flex-1 overflow-hidden">
          <NetworkMap />
          <div className="absolute bottom-4 right-4">
            <StatsPanel />
          </div>
        </div>
        <div className="w-80 xl:w-96 shrink-0 border-l border-slate-800 overflow-hidden">
          <EventLog />
        </div>
      </div>
      <div className="h-32 md:h-40 w-full shrink-0 border-t border-slate-800 overflow-hidden">
        <Timeline />
      </div>
      <WelcomeOverlay />
    </div>
  );
}
