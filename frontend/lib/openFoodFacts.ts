export type FoodResult = {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    servingSize: string;
};

type OpenFoodFactsProduct = {
    product_name?: string;
    serving_size?: string;
    nutriments?: Record<string, number | string | undefined>;
};

type OpenFoodFactsResponse = {
    products?: OpenFoodFactsProduct[];
};

function toNumber(value: number | string | undefined): number {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
}

export async function searchFoods(query: string): Promise<FoodResult[]> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
        return [];
    }

    const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
    url.searchParams.set("search_terms", trimmedQuery);
    url.searchParams.set("json", "1");
    url.searchParams.set("page_size", "10");
    url.searchParams.set(
        "fields",
        "product_name,nutriments,serving_size"
    );

    const response = await fetch(url.toString(), {
        method: "GET",
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error("Open Food Facts request failed");
    }

    const data = (await response.json()) as OpenFoodFactsResponse;
    const products = data.products ?? [];

    return products
        .filter((item) => Boolean(item.product_name?.trim()))
        .slice(0, 10)
        .map((item) => {
            const nutriments = item.nutriments ?? {};

            return {
                name: item.product_name?.trim() ?? "",
                calories: toNumber(nutriments["energy-kcal_100g"]),
                protein: toNumber(nutriments["proteins_100g"]),
                carbs: toNumber(nutriments["carbohydrates_100g"]),
                fat: toNumber(nutriments["fat_100g"]),
                servingSize: item.serving_size?.trim() || "100g",
            };
        });
}
