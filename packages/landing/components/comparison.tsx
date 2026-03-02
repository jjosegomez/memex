const competitors = [
  { name: "Memex", highlight: true },
  { name: "Mem0", highlight: false },
  { name: "Pieces", highlight: false },
  { name: "Copilot Memory", highlight: false },
];

type CellValue = true | false | string;

const rows: { label: string; values: CellValue[] }[] = [
  { label: "E2E Encrypted", values: [true, false, false, false] },
  { label: "Cross-agent (MCP)", values: [true, true, false, "GitHub only"] },
  { label: "Local-first", values: [true, "Self-host", true, false] },
  { label: "One-command install", values: [true, false, false, true] },
  { label: "Open source", values: [true, "Partial", false, false] },
  { label: "Free", values: [true, "Freemium", "Freemium", "Paid"] },
];

function CellContent({ value }: { value: CellValue }) {
  if (value === true) {
    return <span className="text-green-400 font-semibold text-lg" aria-label="Yes">&#10003;</span>;
  }
  if (value === false) {
    return <span className="text-gray-600 text-lg" aria-label="No">&#10005;</span>;
  }
  return <span className="text-gray-400 text-sm">{value}</span>;
}

export function Comparison() {
  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        {/* Section header */}
        <div className="text-center">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            Comparison
          </h2>
          <p className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            How Memex compares
          </p>
        </div>

        {/* Table container — horizontal scroll on mobile */}
        <div className="mt-16 overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full min-w-[540px] text-left">
            <thead>
              <tr className="border-b border-white/5">
                <th scope="col" className="py-4 px-6 text-sm font-medium text-gray-500" />
                {competitors.map((c) => (
                  <th
                    key={c.name}
                    scope="col"
                    className={`py-4 px-6 text-center text-sm font-semibold ${
                      c.highlight
                        ? "text-white border-l-2 border-l-blue-500 bg-blue-500/5"
                        : "text-gray-400"
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
                    i < rows.length - 1 ? "border-b border-white/5" : ""
                  }
                >
                  <th scope="row" className="py-4 px-6 text-sm font-medium text-gray-300">
                    {row.label}
                  </th>
                  {row.values.map((value, j) => (
                    <td
                      key={j}
                      className={`py-4 px-6 text-center ${
                        competitors[j].highlight
                          ? "border-l-2 border-l-blue-500 bg-blue-500/5"
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
