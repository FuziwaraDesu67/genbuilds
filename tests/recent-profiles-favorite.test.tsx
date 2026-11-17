import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/',
}));

import RecentProfilesBar from '@/components/profile/RecentProfilesBar';
import Navbar from '@/components/navbar/Navbar';

describe('Recent Profiles History & GitHub Links', () => {
  it('renders RecentProfilesBar with seeded profiles including Sancho, DianaLegend, Addy, and ZENNY', () => {
    const html = ReactDOMServer.renderToString(
      <RecentProfilesBar
        currentUid="1818407519"
        currentNickname="Sancho"
      />
    );

    expect(html).toContain('Sancho');
    expect(html).toContain('DianaLegend');
    expect(html).toContain('Addy');
    expect(html).toContain('ZENNY');
    expect(html).toContain('Aether_Rathod');
    expect(html).toContain('Goofy');
    expect(html).toContain('AnirudhArcade');
    // Active tab border
    expect(html).toContain('border-b-cyan-400');
  });

  it('renders developer GitHub profile link to https://github.com/FuziwaraDesu67 in Navbar', () => {
    const html = ReactDOMServer.renderToString(<Navbar />);
    expect(html).toContain('https://github.com/FuziwaraDesu67');
    expect(html).toContain('GitHub');
  });
});
