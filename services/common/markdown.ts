export function renderTable(headers: string[], rows: string[][]): string {
  const headerRow = `| ${headers.join(" | ")} |`;
  const separator = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.join(" | ")} |`).join("\n");
  return [headerRow, separator, body].filter(Boolean).join("\n");
}

export function renderChecklist(items: string[]): string {
  return items.map((item) => `- [ ] ${item}`).join("\n");
}
