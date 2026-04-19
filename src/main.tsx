import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PixelOfficeCanvas } from './components/PixelOfficeCanvas';

const DEMO_COMPANY = {
  employees: [
    { id: 'e1', role: 'CEO',        status: 'working'  as const, activityDetail: 'Reviewing Q2 plan',  alertIcon: null },
    { id: 'e2', role: 'CTO',        status: 'working'  as const, activityDetail: 'Arch review',        alertIcon: null },
    { id: 'e3', role: 'PM',         status: 'meeting'  as const, activityDetail: 'Sprint planning',    alertIcon: null },
    { id: 'e4', role: 'Designer',   status: 'working'  as const, activityDetail: 'Wireframes',         alertIcon: '?' as const },
    { id: 'e5', role: 'Frontend',   status: 'working'  as const, activityDetail: 'Building UI',        alertIcon: null },
    { id: 'e6', role: 'Backend',    status: 'break'    as const,                                        alertIcon: null },
    { id: 'e7', role: 'DevOps',     status: 'working'  as const, activityDetail: 'Deploying v2.1',    alertIcon: '!' as const },
    { id: 'e8', role: 'QA',         status: 'working'  as const, activityDetail: 'Bug hunt',           alertIcon: null },
    { id: 'e9', role: 'Researcher', status: 'idle'     as const,                                        alertIcon: null },
  ],
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div style={{ width: '100vw', height: '100vh', background: '#05080f' }}>
      <PixelOfficeCanvas company={DEMO_COMPANY} />
    </div>
  </StrictMode>
);
