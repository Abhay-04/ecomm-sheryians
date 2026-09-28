// Accessibility props for the control inside a FormField: links the input to
// its error or hint text so screen readers announce it.
export function fieldProps(id, error, hasDescription = false) {
  let describedBy;
  if (error) describedBy = `${id}-error`;
  else if (hasDescription) describedBy = `${id}-description`;

  return {
    id,
    name: id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
  };
}

// After a failed submit, moves focus (and scroll) to the first field with an error.
export function focusFirstInvalidField(fieldErrors) {
  const [firstField] = Object.keys(fieldErrors);
  if (firstField) {
    document.getElementById(firstField)?.focus();
  }
}
