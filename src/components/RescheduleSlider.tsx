"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Plus, Minus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { format, addDays, addMonths, getDay } from "date-fns";

interface RescheduleSliderProps {
  onReschedule: (days: number) => void;
  onCustomDate: (date: Date) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function RescheduleSlider({
  onReschedule,
  onCustomDate,
  disabled,
  isLoading,
}: RescheduleSliderProps) {
  const [days, setDays] = useState(1);
  const [customDate, setCustomDate] = useState("");
  const [showCustomDate, setShowCustomDate] = useState(false);
  const hiddenDateInputRef = useRef<HTMLInputElement>(null);

  const handleReschedule = () => {
    onReschedule(days);
  };

  const handleCustomDateSubmit = () => {
    if (customDate) {
      const targetDate = new Date(customDate);
      if (targetDate > new Date()) {
        onCustomDate(targetDate);
        setShowCustomDate(false);
        setCustomDate("");
      }
    }
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    if (selectedDate) {
      setCustomDate(selectedDate);
      setShowCustomDate(true);
    }
  };

  const incrementDays = () => {
    setDays((prev) => prev + 1);
  };

  const decrementDays = () => {
    setDays((prev) => Math.max(prev - 1, 1));
  };

  const addWeek = () => {
    setDays((prev) => prev + 7);
  };

  const addMonth = () => {
    const currentTargetDate = addDays(new Date(), days);
    const currentDayOfWeek = getDay(currentTargetDate); // 0 = Sunday, 1 = Monday, etc.

    // Find which occurrence of this day of the week it is in the current month
    const currentMonth = currentTargetDate.getMonth();
    const currentYear = currentTargetDate.getFullYear();

    // Count how many times this day of the week has occurred up to the current date
    let occurrence = 0;
    for (let day = 1; day <= currentTargetDate.getDate(); day++) {
      const testDate = new Date(currentYear, currentMonth, day);
      if (getDay(testDate) === currentDayOfWeek) {
        occurrence++;
      }
    }

    // Now find the same occurrence in the next month
    const nextMonth = addMonths(currentTargetDate, 1);
    const nextMonthYear = nextMonth.getFullYear();
    const nextMonthMonth = nextMonth.getMonth();

    // Find the same occurrence of the same day of the week in next month
    let foundOccurrence = 0;
    let targetDate = new Date(nextMonthYear, nextMonthMonth, 1);

    for (let day = 1; day <= 31; day++) {
      // 31 is max days in any month
      const testDate = new Date(nextMonthYear, nextMonthMonth, day);
      if (testDate.getMonth() !== nextMonthMonth) break; // Gone past the month

      if (getDay(testDate) === currentDayOfWeek) {
        foundOccurrence++;
        if (foundOccurrence === occurrence) {
          targetDate = testDate;
          break;
        }
      }
    }

    // If we couldn't find the same occurrence (e.g., 5th Monday doesn't exist in next month),
    // fall back to the last occurrence of that day in the month
    if (foundOccurrence < occurrence) {
      for (let day = 31; day >= 1; day--) {
        const testDate = new Date(nextMonthYear, nextMonthMonth, day);
        if (testDate.getMonth() !== nextMonthMonth) continue; // Skip invalid dates

        if (getDay(testDate) === currentDayOfWeek) {
          targetDate = testDate;
          break;
        }
      }
    }

    const daysFromToday = Math.ceil(
      (targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    setDays(daysFromToday);
  };

  const getTargetDate = () => {
    return addDays(new Date(), days);
  };

  const getDateLabel = () => {
    const targetDate = getTargetDate();

    if (days === 1) return "Tomorrow";
    if (days === 2) return "Day after tomorrow";

    // For dates within a week, show day name
    if (days <= 7) {
      return format(targetDate, "EEEE"); // Monday, Tuesday, etc.
    }

    // For dates within this year, show month and day
    if (targetDate.getFullYear() === new Date().getFullYear()) {
      return format(targetDate, "MMM d"); // Jan 15
    }

    // For dates in other years, show full date
    return format(targetDate, "MMM d, yyyy"); // Jan 15, 2024
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="text-xs px-3 py-1 h-8"
          disabled={disabled || isLoading}
        >
          <Clock className="w-3 h-3 mr-1" />
          Reschedule
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-4" align="start">
        <div className="space-y-4" style={{ minWidth: "20rem" }}>
          <div className="text-sm font-medium">Reschedule reminder</div>

          {!showCustomDate ? (
            <>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-lg font-semibold text-primary min-h-[1.75rem] flex items-center justify-center">
                    {getDateLabel()}
                  </div>
                  <div className="text-xs text-muted-foreground min-h-[1rem] flex items-center justify-center">
                    {format(getTargetDate(), "MMMM d, yyyy")}
                  </div>
                </div>

                {/* Day counter with +/- buttons */}
                <div className="flex items-center justify-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={decrementDays}
                    disabled={days <= 1}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>

                  <div className="text-center min-w-[80px]">
                    <div className="text-lg font-medium">{days}</div>
                    <div className="text-xs text-muted-foreground">
                      {days === 1 ? "day" : "days"}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={incrementDays}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>

                {/* Quick increment buttons */}
                <div className="flex gap-2 justify-center">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs px-4 h-7 min-w-[4rem]"
                    onClick={addWeek}
                  >
                    +1w
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs px-4 h-7 min-w-[4rem]"
                    onClick={addMonth}
                  >
                    +1m
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1 text-sm h-8 min-w-0"
                  onClick={handleReschedule}
                  disabled={isLoading}
                >
                  <span className="truncate">
                    {isLoading ? "..." : `Reschedule to ${getDateLabel()}`}
                  </span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs px-3 h-8 min-w-[2.5rem]"
                  onClick={() => {
                    // Trigger the hidden date input
                    if (hiddenDateInputRef.current) {
                      hiddenDateInputRef.current.value = format(
                        getTargetDate(),
                        "yyyy-MM-dd"
                      );
                      hiddenDateInputRef.current.showPicker();
                    }
                  }}
                >
                  <Calendar className="w-3 h-3" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Selected date: {format(new Date(customDate), "MMMM d, yyyy")}
                </div>
                <div className="text-xs text-muted-foreground">
                  Confirm this date or pick a different one
                </div>
                <Input
                  type="date"
                  className="text-sm h-8"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  min={format(addDays(new Date(), 1), "yyyy-MM-dd")}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-sm h-8 min-w-[4rem]"
                  onClick={() => {
                    setShowCustomDate(false);
                    setCustomDate("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 text-sm h-8"
                  onClick={handleCustomDateSubmit}
                  disabled={!customDate || isLoading}
                >
                  {isLoading ? "..." : "Confirm Date"}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Hidden date input for direct date picker access */}
        <input
          ref={hiddenDateInputRef}
          type="date"
          className="absolute opacity-0 pointer-events-none"
          onChange={handleDateInputChange}
          min={format(addDays(new Date(), 1), "yyyy-MM-dd")}
        />
      </PopoverContent>
    </Popover>
  );
}
