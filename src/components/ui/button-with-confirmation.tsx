import { useState } from "react";
import { ConfirmationDialog } from "./confirmation-dialog";
import { Button, buttonVariants } from "./button";
import { VariantProps } from "class-variance-authority";
import { ComponentProps } from "react";

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
}

export function ButtonWithConfirmation({
  onConfirm,
  dialogTitle,
  dialogDescription,
  confirmText,
  cancelText,
  children,
  ...buttonProps
}: ButtonWithConfirmationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button {...buttonProps} onClick={() => setIsOpen(true)}>
        {children}
      </Button>

      <ConfirmationDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title={dialogTitle}
        description={dialogDescription}
        confirmText={confirmText}
        cancelText={cancelText}
        onConfirm={handleConfirm}
        isLoading={isLoading}
      />
    </>
  );
}
