import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const { user } = await getSession()

  if (user) {
    // User is logged in, redirect based on role
    const role = user.role?.toLowerCase() || ""
    
    if (role === "admin") {
      redirect("/dashboard")
    } else if (role === "comercial") {
      redirect("/reunioes")
    } else {
      redirect("/zona-de-execucao")
    }
  }

  // User is not logged in, redirect to login
  redirect("/login")
}
