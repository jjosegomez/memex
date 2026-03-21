const competitors = [
  { name: "Memex", highlight: true },
  { name: "Mem0", highlight: false },
  { name: "Pieces", highlight: false },
  { name: "Copilot Memory", highlight: false },
];

type CellValue = true | false | string;

const rows: { label: string; values: CellValue[] }[] = [
  { label: "Cross-agent (MCP)", values: [true, true, false, "GitHub only"] },
  { label: "E2E Encrypted", values: [true, false, false, false] },
  { label: "Local-first", values: [true, "Self-host", true, false] },
  { label: "One-command install", values: [true, false, false, true] },
  { label: "Open source", values: [true, "Partial", false, false] },
  { label: "Free", values: [true, "Freemium", "Freemium", "Paid"] },
];

function CellContent({ value }: { value: CellValue }) {
  if (value === true) {
    return <span className="text-[#22c55e] font-semibold text-lg" aria-label="Yes">&#10003;</span>;
  }
  if (value === false) {
    return <span className="text-[#919191] text-lg" aria-label="No">&#10005;</span>;
  }
  return <span className="text-[#c6c6c6] text-sm">{value}</span>;
}

export function Comparison() {
  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        {/* Section header */}
        <div className="text-center">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-xs font-semibold uppercase tracking-widest text-[#919191]">
            Comparison
          </h2>
          <p className="mt-4 text-3xl font-bold tracking-tight text-[#e5e2e1] sm:text-4xl">
            The only memory layer that checks every box
          </p>
        </div>

        {/* Table container — horizontal scroll on mobile */}
        <div className="mt-16 overflow-x-auto rounded-md bg-[#1c1b1b]">
          <table className="w-full min-w-[540px] text-left">
            <thead>
              <tr className="bg-[#201f1f]">
                <th scope="col" className="py-4 px-6 text-sm font-medium text-[#919191]" />
                {competitors.map((c) => (
                  <th
                    key={c.name}
                    scope="col"
                    className={`py-4 px-6 text-center text-sm font-semibold ${
                      c.highlight
                        ? "text-[#e5e2e1] border-l-2 border-l-[#22c55e] bg-[#22c55e]/[0.03]"
                        : "text-[#c6c6c6]"
                    }`}
                  >
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.label}
                  className={
                    i < rows.length - 1 ? "border-b border-[#2a2a2a]" : ""
                  }
                >
                  <th scope="row" className="py-4 px-6 text-sm font-medium text-[#c6c6c6]">
                    {row.label}
                  </th>
                  {row.values.map((value, j) => (
                    <td
                      key={j}
                      className={`py-4 px-6 text-center ${
                        competitors[j].highlight
                          ? "border-l-2 border-l-[#22c55e] bg-[#22c55e]/[0.03]"
                          : ""
                      }`}
                    >
                      <CellContent value={value} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
