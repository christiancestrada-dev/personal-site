export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-12">
      <h1
        className="text-3xl font-bold tracking-tight"
        style={{ color: "var(--site-text-bright)" }}
      >
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-sm" style={{ color: "var(--site-text-muted)" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
