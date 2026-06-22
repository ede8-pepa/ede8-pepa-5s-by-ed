export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-4 flex min-w-0 flex-col gap-3 sm:mb-6 sm:gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0f4c81]">
          {eyebrow}
        </p>
        <h1 className="mt-1.5 break-words text-3xl font-black text-slate-950 sm:mt-2 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:mt-3">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
