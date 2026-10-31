type Messages = { readonly [key: string]: string | Messages };

// Dotted paths of every leaf key, e.g. "home.database".
export function keyPaths(messages: Messages, prefix = ""): string[] {
  return Object.entries(messages).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? [path] : keyPaths(value, path);
  });
}

// Keys present in `source` but absent from `target`.
export function missingKeys(source: Messages, target: Messages): string[] {
  const targetKeys = new Set(keyPaths(target));
  return keyPaths(source).filter((key) => !targetKeys.has(key));
}
