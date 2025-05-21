import type { ORUResult } from "./types"

export function parseORUFile(content: string): { results: ORUResult[]; patientInfo: any } {
  const lines = content.split("\r").filter((line) => line.trim() !== "")
  const segments: Record<string, string[]> = {}

  // Group lines by segment type
  lines.forEach((line) => {
    const segmentType = line.substring(0, 3)
    if (!segments[segmentType]) {
      segments[segmentType] = []
    }
    segments[segmentType].push(line)
  })

  // Extract patient info from PID segment
  const patientInfo = extractPatientInfo(segments["PID"] ? segments["PID"][0] : "")

  // Extract results from OBX segments
  const results = extractResults(segments["OBX"] || [])

  console.log(`Extracted ${results.length} results from ${segments["OBX"]?.length || 0} OBX segments`)

  return { results, patientInfo }
}

function extractPatientInfo(pidSegment: string): any {
  if (!pidSegment) return { id: "Unknown", name: "Unknown Patient", dateOfBirth: "1970-01-01", gender: "U" }

  const fields = pidSegment.split("|")

  // PID|1||394255555^^^NATA&2133&N||SMITH^JOHN^^^DR||19700101|M|||
  const id = fields[3]?.split("^")[0] || "Unknown"

  const nameField = fields[5] || ""
  const nameParts = nameField.split("^")
  const lastName = nameParts[0] || ""
  const firstName = nameParts[1] || ""
  const name = `${firstName} ${lastName}`.trim() || "Unknown Patient"

  const dobField = fields[7] || ""
  // Format: YYYYMMDD
  const dateOfBirth = dobField
    ? `${dobField.substring(0, 4)}-${dobField.substring(4, 6)}-${dobField.substring(6, 8)}`
    : "1970-01-01"

  const gender = fields[8] || "U"

  return { id, name, dateOfBirth, gender }
}

function extractResults(obxSegments: string[]): ORUResult[] {
  const results: ORUResult[] = []

  obxSegments.forEach((segment) => {
    try {
      const fields = segment.split("|")

      // OBX|1|NM|14798-3^S Iron:^LN||8|umol/L^umol/L|5-30||||F|||202306101318

      // Get the observation type (field 2)
      const obsType = fields[2] || ""

      // Get the observation value (field 5)
      const valueField = fields[5] || ""

      // Skip segments without values or non-numeric types that we can't process
      // But allow NM (numeric) and SN (structured numeric) types
      if (
        valueField.trim() === "" ||
        (obsType !== "NM" && obsType !== "SN" && !valueField.match(/^[<>]?\d+(\.\d+)?$/))
      ) {
        return
      }

      // Get the observation identifier (field 3)
      const codeField = fields[3] || ""
      const codeParts = codeField.split("^")
      const code = codeParts[0] || ""
      const name = codeParts[1] || codeParts[0] || "Unknown Test"

      // Parse the value
      let value: number | string = valueField

      // Handle structured numeric values like "<3" or ">90"
      if (typeof valueField === "string" && (valueField.startsWith("<") || valueField.startsWith(">"))) {
        // Extract the numeric part
        const numericPart = valueField.substring(1)
        const parsedValue = Number.parseFloat(numericPart)

        // If we can parse it as a number, use that value (slightly adjusted)
        // For "<3", use 2.9, for ">90", use 90.1
        if (!isNaN(parsedValue)) {
          value = valueField.startsWith("<") ? parsedValue - 0.1 : parsedValue + 0.1
        }
      } else {
        // Try to parse as a regular number
        const parsedValue = Number.parseFloat(valueField)
        value = isNaN(parsedValue) ? valueField : parsedValue
      }

      // Get the units (field 6)
      const unitsField = fields[6] || ""
      const unitsParts = unitsField.split("^")
      const units = unitsParts[0] || ""

      // Get the reference range (field 7)
      const referenceRangeField = fields[7] || ""

      // Extract date from field 14 (format: YYYYMMDDhhmm)
      let date = ""
      if (fields.length > 14 && fields[14] && fields[14].length >= 8) {
        date = `${fields[14].substring(0, 4)}-${fields[14].substring(4, 6)}-${fields[14].substring(6, 8)}`
      }

      results.push({
        code,
        name,
        value,
        units,
        referenceRange: referenceRangeField,
        date,
      })
    } catch (error) {
      console.error("Error parsing OBX segment:", error, segment)
      // Continue with the next segment
    }
  })

  return results
}
