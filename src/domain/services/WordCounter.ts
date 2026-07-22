// Example: "Ask HN: Best tools 2025?" → ["Ask", "HN", "Best", "tools", "2025"] → 5
export function countWords(title: string): number {
  if (!title.trim()) {
    return 0;
  }

  return title
    .trim()
    .split(/\s+/)
    .map(stripSurroundingSymbols)
    .filter((token) => token.length > 0).length;
}

function stripSurroundingSymbols(token: string): string {
  return token.replace(/^[^a-zA-Z0-9_]+|[^a-zA-Z0-9_]+$/g, '');
}
