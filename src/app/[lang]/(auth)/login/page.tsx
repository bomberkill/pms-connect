
import { LoginForm } from "@/components/Login-form"
import Image from "next/image"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login | Pms-Connect for Healthcare Professionals",
  description: "Access your secure account on Pms-Connect, the professional network for healthcare providers.",
}

export default async function LoginPage() {
  
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-1 items-center justify-center px-6 py-10 md:p-10">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
          src="/cover.png"
          fill
          priority
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}
