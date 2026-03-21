const links = [
  { label: "GitHub", href: "https://github.com/jjosegomez/memex" },
  { label: "npm", href: "https://www.npmjs.com/package/memex-mcp" },
  { label: "Documentation", href: "https://github.com/jjosegomez/memex#readme" },
];

export function Footer() {
  return (
    <footer className="bg-[#0e0e0e] px-6 py-12">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
        {/* Left — branding */}
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-[#e5e2e1]">memex</span>
          <span className="font-[family-name:var(--font-space-grotesk)] text-xs text-[#919191]">MIT License</span>
        </div>

        {/* Center — links */}
        <nav className="flex gap-6">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={
                link.href.startsWith("http")
                  ? "noopener noreferrer"
                  : undefined
              }
              className="text-sm text-[#c6c6c6] transition hover:text-[#e5e2e1]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right — credit */}
        <p className="text-xs text-[#919191]">
          Built by{" "}
          <a
            href="https://github.com/jjosegomez"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#c6c6c6] transition hover:text-[#e5e2e1]"
          >
            Juan J. Gomez
          </a>
        </p>
      </div>
    </footer>
  );
}
