const links = [
  { label: "GitHub", href: "https://github.com/jjosegomez/memex" },
  { label: "npm", href: "https://www.npmjs.com/package/memex-mcp" },
  { label: "Documentation", href: "#" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 py-12">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
        {/* Left — branding */}
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-white">memex</span>
          <span className="text-xs text-gray-600">MIT License</span>
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
              className="text-sm text-gray-500 transition hover:text-gray-300"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right — credit */}
        <p className="text-xs text-gray-600">
          Built by{" "}
          <a
            href="https://github.com/jjosegomez"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 transition hover:text-gray-300"
          >
            Juan Gomez
          </a>
        </p>
      </div>
    </footer>
  );
}
