"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, FileWarning, FileText, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { PatientResults } from "./patient-results"
import { parseORUFile } from "@/lib/oru-parser"
import { fetchDiagnosticMetrics } from "@/lib/data-service"
import type { ORUResult, DiagnosticMetric, AbnormalResult } from "@/lib/types"

export function ORUUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<AbnormalResult[] | null>(null)
  const [patientInfo, setPatientInfo] = useState<any>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setResults(null)
      setDebugInfo(null)

      // Reset the input value to ensure the same file can be selected again
      e.target.value = ""
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select an ORU file to analyze.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setDebugInfo(null)

    try {
      // Read the file
      const fileContent = await file.text()

      if (!fileContent || fileContent.trim() === "") {
        throw new Error("The file appears to be empty")
      }

      // Check if file content looks like an ORU file
      if (!fileContent.includes("MSH|")) {
        throw new Error("The file does not appear to be a valid ORU format (missing MSH segment)")
      }

      // Parse the ORU file
      const { results: oruResults, patientInfo } = parseORUFile(fileContent)

      // Log for debugging
      console.log("Parsed ORU file:", { oruResults, patientInfo })
      setDebugInfo(`Found ${oruResults.length} test results in the ORU file`)

      if (!oruResults || oruResults.length === 0) {
        throw new Error(
          "No results could be extracted from the file. The file may not contain any numeric test results.",
        )
      }

      // Fetch diagnostic metrics
      const diagnosticMetrics = await fetchDiagnosticMetrics()

      if (!diagnosticMetrics || diagnosticMetrics.length === 0) {
        throw new Error("Failed to load diagnostic metrics data")
      }

      // Find abnormal results
      const abnormalResults = findAbnormalResults(oruResults, diagnosticMetrics, patientInfo)

      setPatientInfo(patientInfo)
      setResults(abnormalResults)

      if (abnormalResults.length === 0) {
        setDebugInfo(`Found ${oruResults.length} test results, but none were abnormal or matched diagnostic metrics`)
      }

      toast({
        title: "Analysis complete",
        description: `Found ${abnormalResults.length} abnormal results out of ${oruResults.length} total results.`,
      })
    } catch (error) {
      console.error("Error processing file:", error)
      toast({
        title: "Error processing file",
        description:
          error instanceof Error ? error.message : "There was an error analyzing the ORU file. Please try again.",
        variant: "destructive",
      })
      setResults(null)
    } finally {
      setIsLoading(false)
    }
  }

  const findAbnormalResults = (
    oruResults: ORUResult[],
    diagnosticMetrics: DiagnosticMetric[],
    patientInfo: any,
  ): AbnormalResult[] => {
    const abnormalResults: AbnormalResult[] = []
    let matchCount = 0

    for (const result of oruResults) {
      // Skip results without numeric values
      if (typeof result.value !== "number") continue

      // Find matching diagnostic metric
      const matchingMetrics = diagnosticMetrics.filter((metric) => {
        // Check if the ORU code matches any in the semicolon-delimited list
        const oruCodes = metric.oru_sonic_codes.split(";").map((code) => code.trim())
        const oruUnits = metric.oru_sonic_units.split(";").map((unit) => unit.trim())

        const codeMatch = oruCodes.some(
          (code) =>
            code &&
            result.code &&
            (result.code.includes(code) || result.name.includes(code) || code.includes(result.code)),
        )

        const unitMatch = oruUnits.some(
          (unit) =>
            unit &&
            result.units &&
            (result.units.toLowerCase() === unit.toLowerCase() ||
              result.units.toLowerCase().includes(unit.toLowerCase()) ||
              unit.toLowerCase().includes(result.units.toLowerCase())),
        )

        return codeMatch && unitMatch
      })

      if (matchingMetrics.length === 0) continue

      matchCount++

      // Find the most specific metric based on age and gender
      const patientAge = calculateAge(patientInfo.dateOfBirth)
      const patientGender = patientInfo.gender

      let bestMatch = matchingMetrics[0]

      for (const metric of matchingMetrics) {
        const minAge = Number.parseInt(metric.min_age) || 0
        const maxAge = Number.parseInt(metric.max_age) || 150

        if (patientAge >= minAge && patientAge <= maxAge && (!metric.gender || metric.gender === patientGender)) {
          bestMatch = metric
          break
        }
      }

      // Check if the result is outside the reference range
      const everlabLower =
        Number.parseFloat(bestMatch.everlab_lower) || Number.parseFloat(bestMatch.standard_lower) || 0
      const everlabHigher =
        Number.parseFloat(bestMatch.everlab_higher) || Number.parseFloat(bestMatch.standard_higher) || 0

      // Skip if we don't have valid reference ranges
      if (everlabLower === 0 && everlabHigher === 0) continue

      if (result.value < everlabLower || result.value > everlabHigher) {
        abnormalResults.push({
          ...result,
          metric: bestMatch,
          isLow: result.value < everlabLower,
          isHigh: result.value > everlabHigher,
          referenceRange: `${everlabLower} - ${everlabHigher}`,
        })
      }
    }

    // Update debug info with match count
    setDebugInfo(
      (prev) =>
        `${prev || ""}\nMatched ${matchCount} results with diagnostic metrics, found ${abnormalResults.length} abnormal values`,
    )

    // Sort by severity (how far outside the range)
    return abnormalResults.sort((a, b) => {
      const aMetric = a.metric
      const bMetric = b.metric

      const aLower = Number.parseFloat(aMetric.everlab_lower) || Number.parseFloat(aMetric.standard_lower) || 0
      const aHigher = Number.parseFloat(aMetric.everlab_higher) || Number.parseFloat(aMetric.standard_higher) || 0
      const bLower = Number.parseFloat(bMetric.everlab_lower) || Number.parseFloat(bMetric.standard_lower) || 0
      const bHigher = Number.parseFloat(bMetric.everlab_higher) || Number.parseFloat(bMetric.standard_higher) || 0

      // Calculate deviation as a percentage of the reference range
      const aDeviation = a.value < aLower ? (aLower - a.value) / (aLower || 1) : (a.value - aHigher) / (aHigher || 1)

      const bDeviation = b.value < bLower ? (bLower - b.value) / (bLower || 1) : (b.value - bHigher) / (bHigher || 1)

      return bDeviation - aDeviation
    })
  }

  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <Card className="shadow-lg border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 pulse">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-primary">Upload ORU File</h2>
            <p className="text-sm text-muted-foreground mb-6 text-center">
              Upload a pathology report in ORU format to analyze test results
            </p>

            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".oru,.txt"
              onChange={handleFileChange}
              ref={fileInputRef}
            />

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="outline"
                className="cursor-pointer border-primary/50 hover:bg-primary/10 hover:text-primary"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.click()
                  }
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Select File
              </Button>

              {file && (
                <Button onClick={handleUpload} disabled={isLoading} className="bg-primary hover:bg-primary/90">
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Activity className="mr-2 h-4 w-4" />
                      Analyze Report
                    </>
                  )}
                </Button>
              )}
            </div>

            {file && (
              <div className="mt-6 p-3 bg-background rounded-md border border-border flex items-center">
                <FileText className="h-5 w-5 text-primary mr-2" />
                <div className="text-sm">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
            )}
          </div>

          {isLoading && (
            <div className="mt-6 p-4 border border-primary/20 rounded-md bg-primary/5 animate-pulse">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-3"></div>
                <p className="text-primary">Processing file and analyzing results...</p>
              </div>
            </div>
          )}

          {debugInfo && (
            <div className="mt-6 p-4 border border-border rounded-md bg-background/50 text-sm font-mono animate-fade-in">
              <p className="text-muted-foreground whitespace-pre-line">{debugInfo}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {results && results.length > 0 && <PatientResults results={results} patientInfo={patientInfo} />}

      {results && results.length === 0 && (
        <Card className="shadow-lg border-success/20 animate-fade-in">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                <FileWarning className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-success">No Abnormal Results</h3>
              <p className="text-muted-foreground">
                All test results are within normal ranges. No high-risk metrics were identified.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
