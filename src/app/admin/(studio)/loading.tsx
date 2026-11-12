export default function StudioLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse">
      <div className="mb-10 flex flex-col gap-3">
        <div className="h-3 w-24 rounded-full bg-charcoal/[0.08]" />
        <div className="h-10 w-80 max-w-full rounded-[8px] bg-charcoal/[0.08]" />
        <div className="h-4 w-96 max-w-full rounded-full bg-charcoal/[0.06]" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-[10px] bg-white ring-1 ring-black/[0.06]"
          />
        ))}
      </div>
      <div className="mt-6 h-72 rounded-[10px] bg-white ring-1 ring-black/[0.06]" />
    </div>
  );
}
