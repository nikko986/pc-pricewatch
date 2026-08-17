export function getCategoryTheme(category) {
  const normalizedCategory = category.toLowerCase();

  if (normalizedCategory.includes("nvidia")) return "nvidia";
  if (normalizedCategory.includes("intel")) return "intel";
  if (normalizedCategory.includes("amd")) return "amd";

  return "default";
}
