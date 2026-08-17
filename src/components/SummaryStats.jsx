export function SummaryStats({ status, products, latest, drops }) {
  return (
    <section className="stats" aria-label="Pricewatch summary">
      <article className="stat-card">
        <span className="stat-label">Parts tracked</span>
        <strong>{status === "ready" ? products.length : "—"}</strong>
        <small>across GPUs and CPUs</small>
      </article>
      <article className="stat-card">
        <span className="stat-label">Latest sheet date</span>
        <strong>
          {latest?.date
            ? latest.date.toLocaleDateString("en-PH", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "—"}
        </strong>
        <small>most recent recorded update</small>
      </article>
      <article className="stat-card stat-card-accent">
        <span className="stat-label">Prices trending down</span>
        <strong>{status === "ready" ? drops : "—"}</strong>
        <small>since each part&apos;s prior reading</small>
      </article>
    </section>
  );
}
