type Props = {
  fleet: Record<string, number>;
};

const order = [4, 3, 2, 1] as const;

export function EnemyFleetStatus({ fleet }: Props) {
  return (
    <section className="rounded-2xl border border-cyan-200 bg-white/85 p-4 shadow-lg">
      <h3 className="mb-3 font-heading text-lg text-ocean-900">Осталось у врага</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {order.map((size) => {
          const count = Number(fleet[String(size)] ?? 0);
          return (
            <div key={size} className="rounded-xl border border-cyan-100 bg-cyan-50/80 p-2">
              <p className="text-xs text-slate-600">Корабль {size}-палубный</p>
              <p className="font-heading text-xl text-ocean-900">{count}</p>
              <p className="mt-1 text-xs tracking-wider text-slate-500">{'■'.repeat(size)}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
