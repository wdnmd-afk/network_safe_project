import { describe, expect, it } from "vitest";

import { products } from "../src/data/catalog";
import { filterProducts } from "../src/utils/catalog";

describe("商品搜索", () => {
  it("按商品名称和分类关键字筛选商品", () => {
    const keywordResult = filterProducts(products, "secure");
    const categoryResult = filterProducts(products, "account");

    expect(keywordResult.map((product) => product.id)).toEqual(["secure-key"]);
    expect(categoryResult.map((product) => product.id)).toEqual([
      "secure-key",
      "cloud-backup",
    ]);
  });

  it("空关键字返回原始商品列表", () => {
    expect(filterProducts(products, " ")).toEqual(products);
  });
});
