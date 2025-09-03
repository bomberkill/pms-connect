import { RegisterForm } from "@/components/Register-form"
import { Metadata } from "next"
// import { auth } from "@/lib/firebase";
// import { useNotification } from "@/lib/hooks";
// import { getRedirectResult, onAuthStateChanged } from "firebase/auth";
// import { useEffect } from "react";

export const metadata: Metadata = {
  title: "Join Pms-Connect | Network for Healthcare Professionals",
  description: "Create your professional profile on Pms-Connect and connect with healthcare colleagues from around the world.",
}

export default function RegisterPage() {

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center">
      <div className="w-full px-5 md:max-w-9/10">
        <RegisterForm />
      </div>
    </div>
  )
}
