'use client';

export const dynamic = 'force-dynamic';

import LiveSessionsPage from '../live-sessions/page';

export default function WebinarsPage() {
    return <LiveSessionsPage sessionType="webinar" />;
}
