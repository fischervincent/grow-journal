"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Bell,
  Mail,
  Clock,
  Smartphone,
  Globe,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { usePushNotifications } from "@/lib/notification/push/use-notification";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "@/app/server-functions/notification-settings";

interface NotificationSettings {
  enabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  notificationTime: string;
  timezone: string;
}

// Common timezone options
const timezoneOptions = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (New York)" },
  { value: "America/Chicago", label: "Central Time (Chicago)" },
  { value: "America/Denver", label: "Mountain Time (Denver)" },
  { value: "America/Los_Angeles", label: "Pacific Time (Los Angeles)" },
  { value: "Europe/London", label: "Greenwich Mean Time (London)" },
  { value: "Europe/Paris", label: "Central European Time (Paris)" },
  { value: "Europe/Berlin", label: "Central European Time (Berlin)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (Tokyo)" },
  { value: "Asia/Shanghai", label: "China Standard Time (Shanghai)" },
  { value: "Asia/Kolkata", label: "India Standard Time (Mumbai)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (Sydney)" },
];

export default function NotificationSettingsPage() {
  const push = usePushNotifications();
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    pushEnabled: false,
    emailEnabled: false,
    notificationTime: "09:00",
    timezone: "UTC",
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [browserTimezone, setBrowserTimezone] = useState<string>("");
  const [showTimezoneDialog, setShowTimezoneDialog] = useState(false);

  // Get browser timezone
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setBrowserTimezone(detected);
  }, []);

  // Load settings from database on mount
  useEffect(() => {
    const loadSettings = async () => {
      setInitialLoading(true);
      const [result, error] = await getNotificationSettings();

      if (error) {
        toast.error("Failed to load notification settings");
        console.error(error);
      } else if (result) {
        setSettings({
          enabled: result.enabled,
          pushEnabled: result.pushEnabled && push.isSubscribed,
          emailEnabled: result.emailEnabled,
          notificationTime: result.notificationTime,
          timezone: result.timezone,
        });
      }

      setInitialLoading(false);
    };

    loadSettings();
  }, [push.isSubscribed]);

  // Save settings to database
  const saveSettings = async (updates: Partial<NotificationSettings>) => {
    const [, error] = await updateNotificationSettings(updates);

    if (error) {
      toast.error("Failed to save settings");
      console.error(error);
      return false;
    }

    return true;
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    setLoading(true);

    if (!enabled) {
      // Disable all notifications
      if (push.isSubscribed) {
        await push.unsubscribeFromPush();
      }

      const updates = {
        enabled: false,
        pushEnabled: false,
        emailEnabled: false,
      };

      if (await saveSettings(updates)) {
        setSettings((prev) => ({ ...prev, ...updates }));
        toast.success("All notifications disabled");
      }
    } else {
      // Enable notifications
      const updates = { enabled: true };

      if (await saveSettings(updates)) {
        setSettings((prev) => ({ ...prev, ...updates }));
        toast.success("Notifications enabled");
      }
    }

    setLoading(false);
  };

  const handleTogglePush = async (enabled: boolean) => {
    setLoading(true);

    if (enabled) {
      // Try to subscribe to push notifications
      try {
        await push.subscribeToPush();
        if (push.isSubscribed) {
          const updates = { pushEnabled: true };
          if (await saveSettings(updates)) {
            setSettings((prev) => ({ ...prev, ...updates }));
            toast.success("Push notifications enabled");
          }
        } else {
          toast.error(
            "Failed to enable push notifications. Please check your browser settings."
          );
        }
      } catch (error) {
        toast.error("Failed to enable push notifications");
        console.error("Push subscription error:", error);
      }
    } else {
      // Unsubscribe from push notifications
      await push.unsubscribeFromPush();
      const updates = { pushEnabled: false };
      if (await saveSettings(updates)) {
        setSettings((prev) => ({ ...prev, ...updates }));
        toast.success("Push notifications disabled");
      }
    }

    setLoading(false);
  };

  const handleToggleEmail = async (enabled: boolean) => {
    const updates = { emailEnabled: enabled };
    if (await saveSettings(updates)) {
      setSettings((prev) => ({ ...prev, ...updates }));
      toast.success(
        enabled ? "Email notifications enabled" : "Email notifications disabled"
      );
    }
  };

  const handleTimeChange = async (time: string) => {
    const updates = { notificationTime: time };
    if (await saveSettings(updates)) {
      setSettings((prev) => ({ ...prev, ...updates }));
      toast.success(`Notification time set to ${time}`);
    }
  };

  const handleTimezoneChange = async (timezone: string) => {
    const updates = { timezone };
    if (await saveSettings(updates)) {
      setSettings((prev) => ({ ...prev, ...updates }));
      toast.success(`Timezone updated to ${timezone}`);
      setShowTimezoneDialog(false);
    }
  };

  const handleUseBrowserTimezone = async () => {
    if (browserTimezone) {
      await handleTimezoneChange(browserTimezone);
    }
  };

  const timeOptions = [
    { value: "06:00", label: "6:00 AM" },
    { value: "07:00", label: "7:00 AM" },
    { value: "08:00", label: "8:00 AM" },
    { value: "09:00", label: "9:00 AM" },
    { value: "10:00", label: "10:00 AM" },
    { value: "11:00", label: "11:00 AM" },
    { value: "12:00", label: "12:00 PM" },
    { value: "13:00", label: "1:00 PM" },
    { value: "14:00", label: "2:00 PM" },
    { value: "15:00", label: "3:00 PM" },
    { value: "16:00", label: "4:00 PM" },
    { value: "17:00", label: "5:00 PM" },
    { value: "18:00", label: "6:00 PM" },
    { value: "19:00", label: "7:00 PM" },
    { value: "20:00", label: "8:00 PM" },
  ];

  const isTimezoneOutOfSync =
    browserTimezone && settings.timezone !== browserTimezone;

  if (initialLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/account"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Account
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Notification Settings</h1>
        <p className="text-muted-foreground">
          Manage how and when you receive plant care reminders
        </p>
      </div>

      <div className="space-y-6">
        {/* Timezone Warning */}
        {settings.enabled && isTimezoneOutOfSync && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Your timezone is set to <strong>{settings.timezone}</strong>, but
              your browser detected <strong>{browserTimezone}</strong>.
              <Button
                variant="link"
                className="p-0 h-auto text-amber-800 underline ml-1"
                onClick={handleUseBrowserTimezone}
              >
                Update to browser timezone
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Master Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label
                  htmlFor="notifications-enabled"
                  className="text-base font-medium"
                >
                  Enable Notifications
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Receive reminders for your plant care tasks
                </p>
              </div>
              <Switch
                id="notifications-enabled"
                checked={settings.enabled}
                onCheckedChange={handleToggleNotifications}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Methods */}
        {settings.enabled && (
          <Card>
            <CardHeader>
              <CardTitle>Notification Methods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Push Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-blue-600" />
                  <div>
                    <Label
                      htmlFor="push-enabled"
                      className="text-base font-medium"
                    >
                      Push Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get instant notifications on this device
                    </p>
                    {push.isSubscribed && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Browser permissions granted
                      </p>
                    )}
                  </div>
                </div>
                <Switch
                  id="push-enabled"
                  checked={settings.pushEnabled}
                  onCheckedChange={handleTogglePush}
                  disabled={loading}
                />
              </div>

              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-green-600" />
                  <div>
                    <Label
                      htmlFor="email-enabled"
                      className="text-base font-medium"
                    >
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive reminders via email
                    </p>
                  </div>
                </div>
                <Switch
                  id="email-enabled"
                  checked={settings.emailEnabled}
                  onCheckedChange={handleToggleEmail}
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timing Settings */}
        {settings.enabled &&
          (settings.pushEnabled || settings.emailEnabled) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Notification Time */}
                  <div>
                    <Label
                      htmlFor="notification-time"
                      className="text-base font-medium"
                    >
                      Daily Notification Time
                    </Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Choose when you&apos;d like to receive your daily plant
                      care reminders
                    </p>
                    <Select
                      value={settings.notificationTime}
                      onValueChange={handleTimeChange}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Timezone */}
                  <div>
                    <Label className="text-base font-medium">Timezone</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Your current timezone:{" "}
                      <strong>{settings.timezone}</strong>
                    </p>
                    <Dialog
                      open={showTimezoneDialog}
                      onOpenChange={setShowTimezoneDialog}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Globe className="h-4 w-4" />
                          Change Timezone
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Select Timezone</DialogTitle>
                          <DialogDescription>
                            Choose your timezone to receive notifications at the
                            correct local time.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          {browserTimezone &&
                            browserTimezone !== settings.timezone && (
                              <Alert className="border-blue-200 bg-blue-50">
                                <Globe className="h-4 w-4 text-blue-600" />
                                <AlertDescription className="text-blue-800">
                                  Browser detected:{" "}
                                  <strong>{browserTimezone}</strong>{" "}
                                  <Button
                                    variant="link"
                                    className="p-0 h-auto text-blue-800 underline"
                                    onClick={handleUseBrowserTimezone}
                                  >
                                    Use this timezone
                                  </Button>
                                </AlertDescription>
                              </Alert>
                            )}
                          <Select
                            value={settings.timezone}
                            onValueChange={handleTimezoneChange}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {timezoneOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setShowTimezoneDialog(false)}
                          >
                            Cancel
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        {/* Information Card */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Bell className="h-5 w-5 text-blue-600" />
              How notifications work
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-blue-800 text-sm space-y-1.5">
              <li>
                • You&apos;ll receive one daily summary of all plants that need
                attention
              </li>
              <li>
                • Notifications are sent at your chosen time in your timezone
              </li>
              <li>• Only plants with scheduled reminders will be included</li>
              <li>• You can disable notifications anytime from this page</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
