import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Video, ExternalLink, FolderOpen } from "lucide-react"

export default async function MateriaisPage() {
  const { user } = await getSession()

  if (!user) {
    redirect("/login")
  }

  const tutorials = [
    {
      title: "Tutoriais Shopify",
      description: "Aprenda a manusear sua operação na Shopify",
      link: "https://drive.google.com/drive/folders/12CoLjhu7Nf0LWNWBZohJ2GjMddNPmd3d",
    },
    {
      title: "Como Mapear o Produto com Fornecedor",
      description: "Aprenda a mapear seus produtos assim que vender e realizar o envio diretamente para seus clientes",
      link: "https://drive.google.com/drive/folders/1z_MOAy4fkuxQI9U6T-MaN_9uLvsjD3HB",
    },
  ]

  return (
    <DashboardLayout userRoles={user.role}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Materiais</h1>
          <p className="text-muted-foreground">Acesse seus arquivos e documentos</p>
        </div>

        {/* Videos Section */}
        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardContent className="p-6">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Vídeos</h2>
                <p className="text-sm text-muted-foreground">Tutoriais e materiais de apoio em vídeo</p>
              </div>
            </div>

            {/* Welcome Video */}
            <div className="flex justify-center mb-8">
              <div className="w-full max-w-2xl rounded-xl overflow-hidden border border-border bg-black/20">
                <div className="relative" style={{ paddingTop: "56.25%" }}>
                  <iframe
                    title="Video de Boas Vindas"
                    src="https://player.vimeo.com/video/1170383497?h=ce7013180f"
                    className="absolute top-0 left-0 w-full h-full"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>

            {/* Tutorial Items */}
            <div className="space-y-3">
              {tutorials.map((tutorial, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border hover:bg-secondary/70 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Video className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{tutorial.title}</h3>
                      <p className="text-sm text-muted-foreground">{tutorial.description}</p>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm" className="shrink-0">
                    <a href={tutorial.link} target="_blank" rel="noopener noreferrer">
                      Clique aqui
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>

            {/* Info Notice */}
            <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-3">
              <FolderOpen className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm text-muted-foreground">
                Os vídeos estarão disponíveis em breve. Enquanto isso, acesse o Google Drive para ver todos os materiais disponíveis.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Google Drive Section */}
        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <FolderOpen className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Google Drive</h2>
                <p className="text-sm text-muted-foreground">Acesse sua pasta compartilhada com todos os materiais</p>
              </div>
            </div>

            <Button asChild className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 text-base font-medium">
              <a
                href="https://drive.google.com/drive/folders/12CoLjhu7Nf0LWNWBZohJ2GjMddNPmd3d"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-5 w-5" />
                Abrir Google Drive
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
