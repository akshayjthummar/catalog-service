export function mapToObject<T>(
    map: Map<string, T>,
): Record<string, T | Record<string, unknown>> {
    const obj: Record<string, T | Record<string, unknown>> = {};
    for (const [key, value] of map.entries()) {
        if (value instanceof Map) {
            obj[key] = mapToObject(value as Map<string, unknown>);
        } else {
            obj[key] = value;
        }
    }
    return obj;
}

export function toMapFromUnknown(value: unknown): Map<string, unknown> {
    if (value instanceof Map) {
        // already a Map<string, unknown>
        return value as Map<string, unknown>;
    }

    if (typeof value === "object" && value !== null) {
        return new Map(
            Object.entries(value as Record<string, unknown>).map(
                ([k, v]): [string, unknown] => [k, v],
            ),
        );
    }

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value) as unknown;
            if (typeof parsed === "object" && parsed !== null) {
                return new Map(
                    Object.entries(parsed as Record<string, unknown>).map(
                        ([k, v]): [string, unknown] => [k, v],
                    ),
                );
            }
        } catch {
            // invalid JSON string
        }
    }

    return new Map<string, unknown>();
}
