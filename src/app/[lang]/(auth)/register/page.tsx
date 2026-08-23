import { RegisterForm } from "@/components/Register-form"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Join Pms-Connect | Network for Healthcare Professionals",
  description: "Create your professional profile on Pms-Connect and connect with healthcare colleagues from around the world.",
}

export default function RegisterPage() {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center px-6 py-10">
      <RegisterForm />
    </div>
  )
}
