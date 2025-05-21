import { ORUUploader } from "@/components/oru-uploader"
import { Toaster } from "@/components/ui/toaster"

export default function Home() {
  return (
    <div className="medical-pattern min-h-screen pb-12">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center animate-fade-in">
            <h1 className="text-4xl font-bold mb-2 text-primary">Pathology Report Analyzer</h1>
            <p className="text-muted-foreground">
              Upload an ORU file to analyze pathology results and identify high-risk metrics
            </p>
          </div>

          <ORUUploader />
        </div>
      </div>
      <Toaster />
    </div>
  )
}
