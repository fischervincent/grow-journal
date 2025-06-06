import { useState, useEffect, useRef } from "react";
import { ConfirmationDialog } from "./confirmation-dialog";
import { Button, buttonVariants } from "./button";
import { VariantProps } from "class-variance-authority";
import { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

interface ButtonWithConfirmationProps extends Omit<ButtonProps, "onClick"> {
  onConfirm: () => Promise<void> | void;
  dialogTitle: string;
  dialogDescription: string;
  confirmText?: string;
  cancelText?: string;
  children: React.ReactNode;
  longPressEnabled?: boolean;
  progressColor?: string;
}

const LONG_PRESS_DURATION = 800; // 800ms for long press

export function ButtonWithConfirmation({
  onConfirm,
  dialogTitle,
  dialogDescription,
  confirmText,
  cancelText,
  children,
  className,
  longPressEnabled = true,
  progressColor = "#22c55e", // default green-500
  style,
  ...buttonProps
}: ButtonWithConfirmationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [longPressProgress, setLongPressProgress] = useState(0);
  const longPressTimerRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const longPressCompletedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
      }
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const startLongPress = () => {
    if (!longPressEnabled) return;

    longPressCompletedRef.current = false;
    startTimeRef.current = Date.now();

    // Update progress every 16ms (roughly 60fps)
    progressIntervalRef.current = window.setInterval(() => {
      const elapsedTime = Date.now() - startTimeRef.current;
      const progress = Math.min((elapsedTime / LONG_PRESS_DURATION) * 100, 100);
      setLongPressProgress(progress);
    }, 16);

    longPressTimerRef.current = window.setTimeout(async () => {
      clearInterval(progressIntervalRef.current!);
      setLongPressProgress(0);
      longPressCompletedRef.current = true;
      await handleConfirm();
    }, LONG_PRESS_DURATION);
  };

  const endLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setLongPressProgress(0);
  };

  const handleClick = () => {
    // Only show dialog if it wasn't a completed long press
    if (!longPressCompletedRef.current) {
      setIsOpen(true);
    }
    // Reset the flag for next interaction
    longPressCompletedRef.current = false;
  };

  return (
    <>
      <div className="relative">
        <Button
          {...buttonProps}
          style={style}
          onClick={handleClick}
          onMouseDown={startLongPress}
          onMouseUp={endLongPress}
          onMouseLeave={endLongPress}
          onTouchStart={startLongPress}
          onTouchEnd={endLongPress}
          className={cn(className, "relative")}
          disabled={isLoading}
        >
          {children}
        </Button>
        {longPressProgress > 0 && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-75 ease-out"
              style={{
                width: `${longPressProgress}%`,
                backgroundColor: progressColor,
              }}
            />
          </div>
        )}
      </div>

      <ConfirmationDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title={dialogTitle}
        description={
          <>
            {dialogDescription}
            {longPressEnabled && (
              <p className="mt-2 text-sm text-muted-foreground">
                Pro tip: You can long-press the button to skip this confirmation
                next time.
              </p>
            )}
          </>
        }
        confirmText={confirmText}
        cancelText={cancelText}
        onConfirm={handleConfirm}
        isLoading={isLoading}
      />
    </>
  );
}
