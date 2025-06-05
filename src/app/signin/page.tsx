import SignIn from "../auth/sign-in";
import { Suspense } from "react";

export default function SignInPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <Suspense>
          <SignIn />
        </Suspense>
      </div>
    </main>
  );
}
