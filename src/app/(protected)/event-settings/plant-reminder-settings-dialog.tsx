"use client";

import { Suspense } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import type { PlantEventTypeReminderConfig } from "@/core/repositories/plant-reminder-repository";
import { PlantReminderSettingsContent } from "./plant-reminder-settings-content";

interface PlantReminderSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventTypeName: string;
  eventTypeId: string;
  defaultConfig: PlantEventTypeReminderConfig | null;
  onSave: () => Promise<void>;
  mode: "create" | "edit";
}

export function PlantReminderSettingsDialog({
  open,
  onOpenChange,
  eventTypeName,
  eventTypeId,
  defaultConfig,
  onSave,
  mode,
}: PlantReminderSettingsDialogProps) {
  if (!defaultConfig) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
          <DialogTitle>
            {mode === "create"
              ? "Set Up Plant Reminders"
              : "Edit Plant Reminders"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? `Configure which plants should get "${eventTypeName}" reminders and when. You must enable at least one plant to create the reminder configuration.`
              : `Set up reminder preferences for "${eventTypeName}" across your plants. You can enable/disable reminders per plant and customize intervals.`}
          </DialogDescription>
        </DialogHeader>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-8 flex-1">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Calculating plant reminder settings...
            </div>
          }
        >
          <PlantReminderSettingsContent
            eventTypeId={eventTypeId}
            defaultConfig={defaultConfig}
            mode={mode}
            onSave={onSave}
            onClose={() => onOpenChange(false)}
          />
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}
