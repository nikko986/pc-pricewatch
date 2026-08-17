import { HARDWARE_SUGAR_URL, SHEET_URL } from "../config.js";

export function DataAttribution() {
  return (
    <section className="about-strip" aria-label="About this data">
      <div>
        <span className="kicker">Open data, clearer decisions</span>
        <h2>Price history sourced from Hardware Sugar.</h2>
      </div>
      <p>
        The Google Sheet is maintained by{" "}
        <a href={HARDWARE_SUGAR_URL} target="_blank" rel="noreferrer">
          Hardware Sugar
        </a>
        , a Philippine PC parts shop. Prices are historical records, not store quotes; availability,
        exact models, and final checkout prices can vary.
      </p>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer>
      <div className="shell footer-inner">
        <p>
          PC Pricewatch PH · Google Sheet by{" "}
          <a href={HARDWARE_SUGAR_URL} target="_blank" rel="noreferrer">
            Hardware Sugar
          </a>
        </p>
        <a href={SHEET_URL} target="_blank" rel="noreferrer">
          Source and methodology ↗
        </a>
      </div>
    </footer>
  );
}
