import { getCategoryTheme } from "../lib/categoryTheme.js";

export function CategoryTag({ category, className = "" }) {
  const theme = getCategoryTheme(category);

  return (
    <span className={`category-tag category-tag--${theme} ${className}`.trim()}>
      {category}
    </span>
  );
}
