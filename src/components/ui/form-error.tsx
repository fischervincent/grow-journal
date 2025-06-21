import { AlertCircle, X } from "lucide-react";
import { Button } from "./button";

interface FormErrorProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function FormError({
  message,
  onDismiss,
  className = "",
}: FormErrorProps) {
  return (
    <div
      className={`flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md ${className}`}
    >
      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
      <p className="text-sm text-red-600 flex-1">{message}</p>
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="h-auto p-0 text-red-500 hover:text-red-600 hover:bg-transparent"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

interface FieldErrorProps {
  message?: string;
  className?: string;
}

export function FieldError({ message, className = "" }: FieldErrorProps) {
  if (!message) return null;

  return (
    <div className={`flex items-center gap-1 mt-1 ${className}`}>
      <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
      <p className="text-xs text-red-600">{message}</p>
    </div>
  );
}

interface FormErrorListProps {
  errors: Array<{ message: string; field?: string }>;
  onDismiss?: () => void;
  className?: string;
}

export function FormErrorList({
  errors,
  onDismiss,
  className = "",
}: FormErrorListProps) {
  const generalErrors = errors.filter((err) => !err.field);

  if (generalErrors.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {generalErrors.map((error, index) => (
        <FormError
          key={index}
          message={error.message}
          onDismiss={generalErrors.length === 1 ? onDismiss : undefined}
        />
      ))}
    </div>
  );
}
