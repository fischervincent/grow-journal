import { useState, useCallback } from "react";

interface FormError {
  field?: string;
  message: string;
}

export function useFormError() {
  const [errors, setErrors] = useState<FormError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setError = useCallback((message: string, field?: string) => {
    setErrors([{ message, field }]);
  }, []);

  const setFieldError = useCallback((field: string, message: string) => {
    setErrors(prev => {
      const filtered = prev.filter(err => err.field !== field);
      return [...filtered, { field, message }];
    });
  }, []);

  const clearError = useCallback((field?: string) => {
    if (field) {
      setErrors(prev => prev.filter(err => err.field !== field));
    } else {
      setErrors([]);
    }
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const getFieldError = useCallback((field: string) => {
    return errors.find(err => err.field === field)?.message;
  }, [errors]);

  const getGeneralErrors = useCallback(() => {
    return errors.filter(err => !err.field);
  }, [errors]);

  const hasErrors = errors.length > 0;
  const hasFieldErrors = errors.some(err => !!err.field);
  const hasGeneralErrors = errors.some(err => !err.field);

  const withSubmission = useCallback(async <T>(
    asyncFn: () => Promise<T>
  ): Promise<T | null> => {
    setIsSubmitting(true);
    clearAllErrors();

    try {
      const result = await asyncFn();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred");
      }
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [setError, clearAllErrors]);

  return {
    errors,
    isSubmitting,
    hasErrors,
    hasFieldErrors,
    hasGeneralErrors,
    setError,
    setFieldError,
    clearError,
    clearAllErrors,
    getFieldError,
    getGeneralErrors,
    withSubmission,
  };
} 