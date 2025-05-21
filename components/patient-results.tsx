"use client"

import { useState } from "react"
import { AlertTriangle, ChevronDown, Info, User, Calendar, FingerprintIcon as FingerPrint, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { AbnormalResult } from "@/lib/types"

interface PatientResultsProps {
  results: AbnormalResult[]
  patientInfo: any
}

export function PatientResults({ results, patientInfo }: PatientResultsProps) {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})
  const [expandAll, setExpandAll] = useState(false)

  const toggleItem = (id: string) => {
    console.log(`Toggling item ${id}, current state:`, openItems[id])
    setOpenItems((prev) => {
      const newState = { ...prev, [id]: !prev[id] }
      console.log("New state:", newState)
      return newState
    })
  }

  const toggleExpandAll = () => {
    const newExpandState = !expandAll
    setExpandAll(newExpandState)

    // Create a new state object with all items set to the new expand state
    const newOpenItems: Record<string, boolean> = {}
    results.forEach((_, index) => {
      newOpenItems[`high-${index}`] = newExpandState
      newOpenItems[`moderate-${index}`] = newExpandState
    })

    setOpenItems(newOpenItems)
  }

  const highRiskResults = results.filter(
    (r) =>
      (r.isLow && r.value < Number.parseFloat(r.metric.standard_lower)) ||
      (r.isHigh && r.value > Number.parseFloat(r.metric.standard_higher)),
  )

  const moderateRiskResults = results.filter((r) => !highRiskResults.includes(r))

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="shadow-lg border-primary/20 overflow-hidden">
        <CardHeader className="pb-3 bg-primary/5 border-b border-primary/10">
          <CardTitle className="text-primary flex items-center">
            <User className="h-5 w-5 mr-2" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <User className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="font-medium">{patientInfo.name}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <FingerPrint className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">ID</p>
                <p className="font-medium">{patientInfo.id}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                <p className="font-medium">{new Date(patientInfo.dateOfBirth).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Users className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gender</p>
                <p className="font-medium">
                  {patientInfo.gender === "M" ? "Male" : patientInfo.gender === "F" ? "Female" : "Other"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary">Test Results</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleExpandAll}
          className="border-primary/50 hover:bg-primary/10 hover:text-primary"
        >
          {expandAll ? "Collapse All" : "Expand All"}
        </Button>
      </div>

      <Tabs defaultValue="high-risk" className="animate-fade-in">
        <TabsList className="w-full p-1 bg-background border border-border rounded-xl shadow-sm mb-6">
          <TabsTrigger
            value="high-risk"
            className="relative rounded-lg py-3 transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-destructive/80 data-[state=active]:to-destructive data-[state=active]:text-white data-[state=active]:shadow-md"
          >
            <div className="flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span>High Risk</span>
              {highRiskResults.length > 0 && (
                <Badge variant="outline" className="ml-2 bg-white/20 text-white border-white/20">
                  {highRiskResults.length}
                </Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="moderate-risk"
            className="relative rounded-lg py-3 transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/80 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md"
          >
            <div className="flex items-center justify-center">
              <Info className="h-4 w-4 mr-2" />
              <span>Moderate Risk</span>
              {moderateRiskResults.length > 0 && (
                <Badge
                  variant="outline"
                  className="ml-2 bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-100 dark:border-blue-800/30"
                >
                  {moderateRiskResults.length}
                </Badge>
              )}
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="high-risk" className="mt-0 animate-fade-in">
          {highRiskResults.length > 0 ? (
            <div className="space-y-4">
              {highRiskResults.map((result, index) => (
                <ResultCard
                  key={`high-${index}`}
                  result={result}
                  id={`high-${index}`}
                  isOpen={!!openItems[`high-${index}`]}
                  onToggle={() => toggleItem(`high-${index}`)}
                  isHighRisk
                />
              ))}
            </div>
          ) : (
            <Card className="shadow-lg border-muted">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center p-6 text-center">
                  <p className="text-muted-foreground">No high-risk results found</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="moderate-risk" className="mt-0 animate-fade-in">
          {moderateRiskResults.length > 0 ? (
            <div className="space-y-4">
              {moderateRiskResults.map((result, index) => (
                <ResultCard
                  key={`moderate-${index}`}
                  result={result}
                  id={`moderate-${index}`}
                  isOpen={!!openItems[`moderate-${index}`]}
                  onToggle={() => toggleItem(`moderate-${index}`)}
                  isHighRisk={false}
                />
              ))}
            </div>
          ) : (
            <Card className="shadow-lg border-muted">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center p-6 text-center">
                  <p className="text-muted-foreground">No moderate-risk results found</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface ResultCardProps {
  result: AbnormalResult
  id: string
  isOpen: boolean
  onToggle: () => void
  isHighRisk: boolean
}

function ResultCard({ result, id, isOpen, onToggle, isHighRisk }: ResultCardProps) {
  return (
    <Card
      className={`result-card shadow-md transition-all ${
        isHighRisk ? "border-destructive/20 hover:border-destructive/40" : "border-blue-500/20 hover:border-blue-500/40"
      }`}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {isHighRisk ? (
              <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Info className="h-5 w-5 text-blue-500" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-lg">{result.metric.name}</h3>
              <p className="text-sm text-muted-foreground">{result.metric.diagnostic}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="flex items-center justify-end">
                <span
                  className={`font-bold text-lg ${result.isHigh ? "text-destructive" : result.isLow ? "text-blue-500" : ""}`}
                >
                  {result.value} {result.units}
                </span>
                {result.isHigh && <span className="text-destructive ml-1">↑</span>}
                {result.isLow && <span className="text-blue-500 ml-1">↓</span>}
              </div>
              <p className="text-xs text-muted-foreground">
                Range: {result.referenceRange} {result.units}
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 flex-shrink-0 rounded-full ${
                isHighRisk
                  ? "hover:bg-destructive/10 hover:text-destructive"
                  : "hover:bg-blue-500/10 hover:text-blue-500"
              }`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onToggle()
              }}
              aria-expanded={isOpen}
              aria-controls={`content-${id}`}
            >
              <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
              <span className="sr-only">Toggle details</span>
            </Button>
          </div>
        </div>

        <div
          id={`content-${id}`}
          className={`details-content ${isOpen ? "open" : ""} overflow-hidden`}
          style={{ maxHeight: isOpen ? "500px" : "0px" }}
        >
          <div className="mt-4 pt-4 border-t animate-slide-down">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-primary/5 rounded-md">
                <p className="text-sm font-medium text-primary mb-1">Test Name</p>
                <p>{result.name}</p>
              </div>
              <div className="p-3 bg-primary/5 rounded-md">
                <p className="text-sm font-medium text-primary mb-1">Test Code</p>
                <p>{result.code}</p>
              </div>
              <div className="p-3 bg-primary/5 rounded-md">
                <p className="text-sm font-medium text-primary mb-1">Diagnostic Group</p>
                <p>{result.metric.diagnostic_groups || "Not specified"}</p>
              </div>
              <div className="p-3 bg-primary/5 rounded-md">
                <p className="text-sm font-medium text-primary mb-1">Test Date</p>
                <p>{result.date ? new Date(result.date).toLocaleDateString() : "Not specified"}</p>
              </div>
              <div className="md:col-span-2 p-3 bg-primary/5 rounded-md">
                <p className="text-sm font-medium text-primary mb-1">Interpretation</p>
                <p>
                  {result.isHigh
                    ? `${result.metric.name} is elevated above the reference range.`
                    : `${result.metric.name} is below the reference range.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
