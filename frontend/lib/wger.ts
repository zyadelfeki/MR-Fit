export type ExerciseResult = {
    id: number;
    name: string;
    description: string;
    category: string;
    muscles: string[];
    musclesSecondary: string[];
    equipment: string[];
};

type WgerValue = {
    id?: number;
    name?: string;
};

type WgerSearchItem = {
    id?: number;
    name?: string;
    description?: string;
    category?: WgerValue;
    muscles?: WgerValue[];
    muscles_secondary?: WgerValue[];
    equipment?: WgerValue[];
};

type WgerSearchResponse = {
    results?: WgerSearchItem[];
};

type WgerExerciseInfoResponse = {
    results?: WgerSearchItem[];
};

export function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "").trim();
}

function mapExercise(item: WgerSearchItem): ExerciseResult | null {
    const id = item.id;
    const name = item.name?.trim();

    if (!id || !name) {
        return null;
    }

    return {
        id,
        name,
        description: stripHtml(item.description ?? ""),
        category: item.category?.name?.trim() || "General",
        muscles: (item.muscles ?? [])
            .map((muscle) => muscle.name?.trim())
            .filter((muscle): muscle is string => Boolean(muscle)),
        musclesSecondary: (item.muscles_secondary ?? [])
            .map((muscle) => muscle.name?.trim())
            .filter((muscle): muscle is string => Boolean(muscle)),
        equipment: (item.equipment ?? [])
            .map((equipment) => equipment.name?.trim())
            .filter((equipment): equipment is string => Boolean(equipment)),
    };
}

export async function searchExercises(
    query: string,
    muscle?: string
): Promise<ExerciseResult[]> {
    const trimmedQuery = query.trim();
    const muscleFilter = muscle?.trim();

    let url: URL;

    if (trimmedQuery) {
        url = new URL("https://wger.de/api/v2/exercise/search/");
        url.searchParams.set("term", trimmedQuery);
        url.searchParams.set("language", "english");
        url.searchParams.set("format", "json");
    } else {
        url = new URL("https://wger.de/api/v2/exerciseinfo/");
        url.searchParams.set("format", "json");
        url.searchParams.set("language", "2");
        url.searchParams.set("limit", "20");
        url.searchParams.set("offset", "0");
    }

    const response = await fetch(url.toString(), {
        method: "GET",
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error("wger request failed");
    }

    const data = (await response.json()) as WgerSearchResponse | WgerExerciseInfoResponse;
    const mapped = (data.results ?? [])
        .map(mapExercise)
        .filter((item): item is ExerciseResult => item !== null);

    if (!muscleFilter || muscleFilter.toLowerCase() === "all") {
        return mapped.slice(0, 20);
    }

    const normalizedMuscle = muscleFilter.toLowerCase();

    const filtered = mapped.filter((exercise) =>
        exercise.muscles.some((muscleName) =>
            muscleName.toLowerCase().includes(normalizedMuscle)
        )
    );

    return filtered.slice(0, 20);
}
