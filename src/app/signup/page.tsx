import SignUp from "../auth/sign-up";
import { Suspense } from "react";

export default function SignUpPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <Suspense>
          <SignUp />
        </Suspense>
      </div>
    </main>
  );
}
