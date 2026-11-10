import { Link } from 'react-router-dom';
import { ChevronDown, Crown, MessageSquareText, PanelLeft, RotateCcw, Search, User } from 'lucide-react';
import { useStore } from '../../store';
import { fmtUsdt } from '../../lib/format';
import { Wordmark } from '../icons';
import { Popover } from '../Popover';
import { UsdtIcon } from '../UsdtIcon';
import { DemoButton, Switch } from '../DemoPanel';

const iconBtn =
  'relative size-10 items-center justify-center rounded-lg border border-line2 bg-s2 text-tx transition-colors hover:bg-s3 lg:size-12';

/** Housebets top bar: menu toggle, logo, balance + wallet, rewards, prize, search, chat, account. */
export function TopBar() {
  const balance = useStore((s) => s.balance);
  const set = useStore((s) => s.set);
  const toast = useStore((s) => s.toast);
  const collapsed = useStore((s) => s.navCollapsed);

  return (
    <header className="sticky top-0 z-[1350] h-14 border-b border-line bg-bg/95 backdrop-blur lg:h-16">
      <div className="flex h-full items-center gap-2 px-3 sm:px-4">
        <button type="button" onClick={() => set({ navCollapsed: !collapsed })} aria-label="Toggle menu" aria-pressed={!collapsed} className={`${iconBtn} hidden lg:inline-flex`}>
          <PanelLeft size={19} />
        </button>
        <Link to="/sports" aria-label="Housebets sports home" className="shrink-0 rounded-md lg:ml-2">
          <Wordmark />
        </Link>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 lg:justify-center">
          <div className="flex items-center rounded-lg border border-line2 bg-s2 p-[3px] lg:p-0 lg:border-0 lg:bg-transparent lg:gap-2">
            <Popover
              label="Balance"
              align="center"
              width={280}
              trigger={({ toggle, open }) => (
                <button type="button" onClick={toggle} aria-expanded={open} aria-label={`Balance ${fmtUsdt(balance)} USDT`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-tx transition-colors hover:bg-s3 lg:h-12 lg:rounded-lg lg:border lg:border-line2 lg:bg-s2 lg:pl-4 lg:pr-3">
                  <UsdtIcon />
                  <span className="num text-[14px] font-bold lg:text-[15px]">{fmtUsdt(balance)}</span>
                  <ChevronDown size={16} className={`text-tx2 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
              )}
            >
              {(close) => (
                <div className="p-4">
                  <p className="eyebrow">Demo balance</p>
                  <p className="num mt-1 flex items-center gap-2 text-[24px] font-extrabold text-tx"><UsdtIcon size={20} />{fmtUsdt(balance)} <span className="text-[13px] font-bold text-tx2">USDT</span></p>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-tx2">Stakes in this prototype use demo USDT. No real money and no real account.</p>
                  <button type="button" onClick={() => { useStore.getState().demoReset(); close(); }} className="btn-ghost mt-3 h-9 w-full text-[13px]"><RotateCcw size={14} /> Reset demo</button>
                </div>
              )}
            </Popover>
            <button type="button" onClick={() => toast({ tone: 'info', title: 'Wallet isn’t part of this prototype', body: 'Deposits and withdrawals live in the main Housebets wallet. This demo uses a 250 USDT demo balance.' })}
              className="btn-primary hidden h-12 px-4 text-[15px] lg:inline-flex">Wallet</button>
          </div>

          <RewardsButton />

          <button type="button" onClick={() => toast({ tone: 'info', title: 'Leaderboard', body: 'Sports wagers would count towards the weekly and monthly leaderboards. Not part of this prototype.' })}
            className="hidden h-12 items-center gap-2 rounded-lg border border-line2 bg-s2 pl-2 pr-3 transition-colors hover:bg-s3 xl:inline-flex">
            <span className="flex size-8 items-center justify-center rounded-md bg-gold/12 text-gold"><Crown size={17} /></span>
            <span className="flex flex-col items-start leading-tight">
              <span className="text-[11px] text-tx2">Weekly Prize</span>
              <span className="num text-[14px] font-bold text-gold">$50,000.<span className="text-[11px]">00</span></span>
            </span>
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <DemoButton />
          <button type="button" onClick={() => set({ searchOpen: true })} aria-label="Search" className={`${iconBtn} hidden lg:inline-flex`}>
            <Search size={19} />
          </button>
          <button type="button" onClick={() => toast({ tone: 'info', title: 'Chat isn’t part of this prototype', body: 'In production the side panel would switch between chat and your bet slip.' })} aria-label="Chat" className={`${iconBtn} hidden lg:inline-flex`}>
            <MessageSquareText size={19} />
          </button>
          <AccountButton />
        </div>
      </div>
    </header>
  );
}

function RewardsButton() {
  const rakeback = useStore((s) => s.rakeback);
  const claim = useStore((s) => s.claimRakeback);
  return (
    <Popover
      label="Rewards"
      width={300}
      trigger={({ toggle, open }) => (
        <button type="button" onClick={toggle} aria-expanded={open} aria-label="Rewards" className={`${iconBtn} inline-flex`}>
          <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden><path d="M2.5 14.167h15M4.167 14.167l-1.667-8.334 4.167 3.334L10 5l3.333 4.167 4.167-3.334-1.667 8.334H4.167Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          {rakeback >= 0.01 && <span className="absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-bg bg-accent" />}
        </button>
      )}
    >
      {(close) => (
        <div className="p-4">
          <div className="flex items-center justify-between">
            <p className="font-display text-[15px] font-bold text-tx">Rewards</p>
            <span className="rounded-md border border-line2 bg-s3 px-2 py-0.5 text-[11px] font-semibold text-tx">Rookie</span>
          </div>
          <div className="mt-3 rounded-xl border border-line bg-s1 p-3">
            <p className="eyebrow">Instant rakeback</p>
            <p className="num mt-1 text-[22px] font-extrabold text-accent">{fmtUsdt(rakeback)} <span className="text-[12px] text-tx2">USDT</span></p>
            <p className="mt-1 text-[12px] leading-relaxed text-tx2">10% of the house edge on every sports bet comes straight back. The slip shows what each bet earns before you place it.</p>
            <button type="button" disabled={rakeback < 0.01} onClick={() => { claim(); close(); }} className="btn-primary mt-3 h-9 w-full text-[13px]">Claim</button>
          </div>
        </div>
      )}
    </Popover>
  );
}

function AccountButton() {
  const openBook = useStore((s) => s.openBook);
  const setOpenBook = useStore((s) => s.setOpenBook);
  const toast = useStore((s) => s.toast);
  return (
    <Popover
      label="Account"
      width={260}
      trigger={({ toggle, open }) => (
        <button type="button" onClick={toggle} aria-expanded={open} aria-label="Account" className={`${iconBtn} inline-flex`}>
          <User size={19} />
        </button>
      )}
    >
      {(close) => (
        <div className="py-2">
          <div className="border-b border-line px-4 pb-3 pt-1">
            <p className="text-[14px] font-bold text-tx">Demo player</p>
            <p className="text-[12px] text-tx3">Sample account · Rookie</p>
          </div>
          <Link to="/sports/bets?tab=open" onClick={close} className="flex h-10 items-center px-4 text-[13.5px] text-tx hover:bg-s3">My bets</Link>
          <div className="flex h-11 items-center justify-between px-4 text-[13.5px] text-tx">
            Open Book
            <Switch label="Open Book" on={openBook} onClick={() => setOpenBook(!openBook)} />
          </div>
          <button type="button" onClick={() => { close(); toast({ tone: 'info', title: 'Responsible gambling', body: 'Deposit limits, cool-off and self-exclusion stay in Settings on Housebets. Not part of this prototype.' }); }} className="flex h-10 w-full items-center px-4 text-left text-[13.5px] text-tx hover:bg-s3">Responsible gambling</button>
        </div>
      )}
    </Popover>
  );
}
