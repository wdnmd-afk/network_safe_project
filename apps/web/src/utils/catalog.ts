import type { Product } from "../data/catalog";

export function filterProducts(items: Product[], keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase();

  if (!normalizedKeyword) {
    return items;
  }

  return items.filter((item) => {
    const searchableText = [
      item.name,
      item.category,
      item.summary,
      item.badge,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedKeyword);
  });
}
