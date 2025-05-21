import type { DiagnosticMetric } from "./types"

export async function fetchDiagnosticMetrics(): Promise<DiagnosticMetric[]> {
  try {
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/diagnostic_metrics-rDHgGYFWiTgmZg5pOkeU4IparN2ttH.csv",
      { cache: "no-store" }, // Ensure we get fresh data
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch diagnostic metrics: ${response.status} ${response.statusText}`)
    }

    const csvText = await response.text()

    if (!csvText || csvText.trim() === "") {
      throw new Error("Received empty CSV data")
    }

    const metrics = parseCSV(csvText)
    console.log(`Loaded ${metrics.length} diagnostic metrics`)
    return metrics
  } catch (error) {
    console.error("Error fetching diagnostic metrics:", error)
    throw error
  }
}

function parseCSV(csvText: string): DiagnosticMetric[] {
  const lines = csvText.split("\n").filter((line) => line.trim() !== "")

  if (lines.length < 2) {
    throw new Error("CSV data is invalid or empty")
  }

  const headers = lines[0].split(",").map((header) => header.trim())

  return lines
    .slice(1)
    .map((line) => {
      const values = parseCSVLine(line)
      const metric: any = {}

      headers.forEach((header, index) => {
        metric[header] = values[index] || ""
      })

      return metric as DiagnosticMetric
    })
    .filter((metric) => metric.name && metric.oru_sonic_codes) // Filter out rows without essential data
}

function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let currentValue = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      values.push(currentValue)
      currentValue = ""
    } else {
      currentValue += char
    }
  }

  values.push(currentValue)
  return values
}
