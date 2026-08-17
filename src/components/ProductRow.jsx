import { changeClass, formatChange, peso } from "../lib/pricewatch.js";
import { Sparkline } from "./PriceCharts.jsx";

export function ProductRow({ product, onSelect }) {
  const onRowKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(product);
    }
  };

  return (
    <tr tabIndex={0} onClick={() => onSelect(product)} onKeyDown={onRowKeyDown}>
      <td>
        <span className="part-button">
          {product.name}
          <small>{product.category}</small>
        </span>
      </td>
      <td>
        <span className="category-tag">{product.category}</span>
      </td>
      <td className="price">
        {peso.format(product.current.value)}
        <small>{product.current.display}</small>
      </td>
      <td>
        <span className={`delta ${changeClass(product.change)}`}>
          {product.change !== null && product.change < 0 ? "↓ " : product.change > 0 ? "↑ " : ""}
          {formatChange(product.change)}
        </span>
      </td>
      <td className="range">
        {peso.format(product.low)} – {peso.format(product.high)}
      </td>
      <td>
        <Sparkline product={product} />
      </td>
    </tr>
  );
}
