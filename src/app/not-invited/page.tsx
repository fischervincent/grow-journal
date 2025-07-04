import { getSessionNoInviteCheck } from "@/app/server-functions/auth-helper";
import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";

export default async function NotInvitedPage() {
  const session = await getSessionNoInviteCheck();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Restricted
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            Thank you for your interest in our application! This app is
            currently invite-only.
            {session?.user?.email && (
              <span className="block mt-2 text-sm">
                Your email <strong>{session.user.email}</strong> is not on our
                invited users list.
              </span>
            )}
          </p>

          {/* Contact Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Need access?
            </h3>
            <p className="text-sm text-gray-600">
              Please contact an administrator to request an invitation. They can
              add your email to the allowed users list.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {session ? (
              <SignOutButton
                variant="secondary"
                className="w-full"
                redirectTo="/"
              >
                Sign Out
              </SignOutButton>
            ) : (
              <Link
                href="/signin"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors inline-block"
              >
                Try Different Account
              </Link>
            )}

            <Link
              href="/"
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors inline-block"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
