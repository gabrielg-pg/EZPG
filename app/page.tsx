import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-primary/5 blur-[100px] rounded-full" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-primary/5 blur-[80px] rounded-full" />
      </div>
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />
      
      <div className="w-full max-w-md relative z-10">
        <LoginForm />
        <p className="text-center text-muted-foreground text-xs mt-6">
          Sistema interno PRO GROWTH
        </p>
      </div>
    </main>
  )
}
