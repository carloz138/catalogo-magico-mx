import { useState, useEffect, useCallback } from "react";
import stringSimilarity from "string-similarity";

export interface BulkProduct {
  id: string;
  name: string;
  price: number;
  sku?: string;
  description?: string;
  category?: string;
  tags?: string[]; // 👈 CAMPO AGREGADO
  originalData: any;
}

export interface BulkImage {
  id: string;
  file: File;
  preview: string;
  name: string;
}

export interface MatchItem {
  productId: string;
  product: BulkProduct;
  imageId?: string;
  image?: BulkImage;
  isDefaultImage?: boolean;
  status: "matched" | "unmatched" | "default";
  matchMethod: "auto" | "manual" | "none";
}

export const useBulkMatching = (products: BulkProduct[], images: BulkImage[]) => {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [manualOverrides, setManualOverrides] = useState<Record<string, string | "default">>({});

  const calculateMatches = useCallback(() => {
    const newMatches: MatchItem[] = products.map((product) => {
      // 1. Revisar manual
      if (manualOverrides[product.id]) {
        const overrideId = manualOverrides[product.id];

        if (overrideId === "default") {
          return {
            productId: product.id,
            product,
            isDefaultImage: true,
            status: "default",
            matchMethod: "manual",
          };
        }

        const img = images.find((i) => i.id === overrideId);
        if (img) {
          return {
            productId: product.id,
            product,
            imageId: img.id,
            image: img,
            status: "matched",
            matchMethod: "manual",
          };
        }
      }

      // 2. Auto-Match
      let bestMatch: BulkImage | null = null;
      let bestScore = 0;

      const targetStrings = [product.sku, product.name].filter(Boolean) as string[];

      if (images.length > 0 && targetStrings.length > 0) {
        const imageNames = images.map((img) => img.name.split(".")[0]);

        targetStrings.forEach((target) => {
          const match = stringSimilarity.findBestMatch(target, imageNames);
          if (match.bestMatch.rating > bestScore) {
            bestScore = match.bestMatch.rating;
            bestMatch = images[match.bestMatchIndex];
          }
        });
      }

      if (bestMatch && bestScore > 0.4) {
        return {
          productId: product.id,
          product,
          imageId: bestMatch.id,
          image: bestMatch,
          status: "matched",
          matchMethod: "auto",
        };
      }

      // 3. Unmatched
      return {
        productId: product.id,
        product,
        status: "unmatched",
        matchMethod: "none",
      };
    });

    setMatches(newMatches);
  }, [products, images, manualOverrides]);

  useEffect(() => {
    calculateMatches();
  }, [calculateMatches]);

  const setManualMatch = (productId: string, imageId: string) => {
    setManualOverrides((prev) => ({ ...prev, [productId]: imageId }));
  };

  const useDefaultImage = (productId: string) => {
    setManualOverrides((prev) => ({ ...prev, [productId]: "default" }));
  };

  const applyDefaultToAllUnmatched = () => {
    const newOverrides = { ...manualOverrides };
    matches.forEach((m) => {
      if (m.status === "unmatched") {
        newOverrides[m.productId] = "default";
      }
    });
    setManualOverrides(newOverrides);
  };

  return {
    matches,
    setManualMatch,
    useDefaultImage,
    applyDefaultToAllUnmatched,
    stats: {
      total: matches.length,
      matched: matches.filter((m) => m.status === "matched").length,
      default: matches.filter((m) => m.status === "default").length,
      unmatched: matches.filter((m) => m.status === "unmatched").length,
    },
  };
};
