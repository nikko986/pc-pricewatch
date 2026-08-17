import { useEffect, useRef } from "react";

import { changeClass, formatChange, peso } from "../lib/pricewatch.js";
import { PriceChart } from "./PriceCharts.jsx";

export function PartDialog({ product, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (product && dialog && !dialog.open) dialog.showModal();
    if (!product && dialog?.open) dialog.close();
  }, [product]);

  if (!product) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-header">
        <div>
          <span className="kicker">{product.category}</span>
          <h2 id="dialog-title">{product.name}</h2>
        </div>
        <button className="icon-button" type="button" aria-label="Close details" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="dialog-content">
        <div className="detail-stats">
          <div>
            <span>Latest</span>
            <strong>{peso.format(product.current.value)}</strong>
          </div>
          <div>
            <span>Change</span>
            <strong className={changeClass(product.change)}>{formatChange(product.change)}</strong>
          </div>
          <div>
            <span>Low</span>
            <strong>{peso.format(product.low)}</strong>
          </div>
          <div>
            <span>High</span>
            <strong>{peso.format(product.high)}</strong>
          </div>
        </div>
        <div className="chart-heading">
          <h3>Price history</h3>
          <span>Latest: {product.current.display}</span>
        </div>
        <div
          className="detail-chart"
          role="img"
          aria-label={`${product.name} price history from ${product.history.at(-1).display} to ${product.current.display}`}
        >
          <PriceChart product={product} />
        </div>
        <div className="history-list-wrap">
          <table className="history-list">
            <thead>
              <tr>
                <th scope="col">Recorded</th>
                <th scope="col">Average price</th>
              </tr>
            </thead>
            <tbody>
              {product.history.slice(0, 12).map((point, index) => (
                <tr key={`${point.label}-${index}`}>
                  <td>{point.display}</td>
                  <td>{peso.format(point.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </dialog>
  );
}
