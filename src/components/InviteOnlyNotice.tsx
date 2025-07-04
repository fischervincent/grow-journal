import { Info } from "lucide-react";

export function InviteOnlyNotice() {
  return (
    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs">
          <p className="font-medium text-blue-800">Invite-Only App</p>
          <p className="text-blue-700 mt-1">
            This application requires an invitation. Only users with invited
            email addresses can access the app.
          </p>
        </div>
      </div>
    </div>
  );
}
