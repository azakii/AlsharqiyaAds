export default function Stepper({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
      {steps.map((label, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs transition ${
                active
                  ? "border-gold bg-gold-gradient font-semibold text-black"
                  : done
                  ? "border-gold/40 text-gold"
                  : "border-line text-white/50"
              }`}
            >
              <span>{label}</span>
              <span
                className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${
                  active ? "bg-black/20 text-black" : "bg-white/10 text-white/60"
                }`}
              >
                {i + 1}
              </span>
            </div>
            {i < steps.length - 1 && <span className="h-px w-5 bg-line" />}
          </div>
        );
      })}
    </div>
  );
}
