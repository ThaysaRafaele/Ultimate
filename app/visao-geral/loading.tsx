// Skeleton shown while the overview queries run; mirrors the page layout
// (header bar, red nav, title, the six summary cards and the tabs).
export default function Loading() {
  return (
    <div className="flex-1 flex flex-col" role="status" aria-busy="true" aria-label="Carregando visão geral">
      <div className="h-[72px] bg-ink-deep flex-shrink-0" />
      <div className="h-[50px] bg-brand-red max-md:hidden flex-shrink-0" />
      <main className="flex-1 px-10 max-md:px-4 py-8 max-md:py-5">
        <div className="max-w-275 mx-auto animate-pulse">
          <div className="h-3.5 w-48 bg-zinc-200 rounded mb-3" />
          <div className="h-9 w-72 max-md:w-52 bg-zinc-200 rounded mb-6" />
          <div className="grid grid-cols-3 max-md:grid-cols-2 gap-3.5 max-md:gap-2.5">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="bg-white border border-border-light rounded-xl h-[118px]" />
            ))}
          </div>
          <div className="flex gap-4 mt-8 max-md:mt-6 border-b border-border-light pb-3">
            <div className="h-6 w-28 bg-zinc-200 rounded" />
            <div className="h-6 w-32 bg-zinc-200 rounded" />
          </div>
          <div className="bg-white border border-border-light rounded-xl h-64 mt-5" />
        </div>
      </main>
    </div>
  );
}
