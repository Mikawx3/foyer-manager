import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { useFormat } from "../../hooks/useFormat.ts";
import { useKeyboardInset } from "../../hooks/useKeyboardInset.ts";
import {
  evaluateAmountExpression,
  formatAmountForInput,
  hasAmountExpression,
} from "../../lib/evaluate-amount-expression.ts";
import { AmountKeyboardToolbar } from "./AmountKeyboardToolbar.tsx";
import { inputClassName } from "./FormField.tsx";

export interface CalculableAmountInputHandle {
  /** Evaluates any pending expression and returns the committed amount (NaN when empty). */
  commit: () => number;
}

interface CalculableAmountInputProps {
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  id?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  showHint?: boolean;
}

function parsePlainAmount(input: string): number | null {
  const compact = input.trim().replace(/\s+/g, "");
  if (!compact || hasAmountExpression(compact)) {
    return null;
  }
  return evaluateAmountExpression(compact);
}

function appendOperator(current: string, operator: string): string {
  return current + operator;
}

export const CalculableAmountInput = forwardRef<
  CalculableAmountInputHandle,
  CalculableAmountInputProps
>(function CalculableAmountInput(
  {
    value,
    onChange,
    onBlur,
    id,
    placeholder,
    className,
    disabled = false,
    "aria-invalid": ariaInvalid = false,
    showHint = true,
  },
  ref,
) {
  const { t } = useTranslation("common");
  const { formatCurrency } = useFormat();
  const { keyboardInset } = useKeyboardInset();
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const hintId = `${inputId}-hint`;
  const previewId = `${inputId}-preview`;
  const inputRef = useRef<HTMLInputElement>(null);

  const [displayValue, setDisplayValue] = useState(() => formatAmountForInput(value));
  const [focused, setFocused] = useState(false);
  const [invalid, setInvalid] = useState(false);

  const toolbarVisible = focused && keyboardInset > 0;

  useEffect(() => {
    if (!focused) {
      setDisplayValue(formatAmountForInput(value));
    }
  }, [focused, value]);

  const commitValue = (raw: string, revertOnInvalid: boolean): number | null => {
    if (raw.trim() === "") {
      onChange(Number.NaN);
      setDisplayValue("");
      setInvalid(false);
      return null;
    }

    const evaluated = evaluateAmountExpression(raw);
    if (evaluated !== null) {
      onChange(evaluated);
      setDisplayValue(formatAmountForInput(evaluated));
      setInvalid(false);
      return evaluated;
    }

    setInvalid(true);
    if (revertOnInvalid) {
      setDisplayValue(formatAmountForInput(value));
    }
    return null;
  };

  useImperativeHandle(ref, () => ({
    commit: (): number => {
      const committed = commitValue(displayValue, false);
      if (committed !== null) {
        return committed;
      }
      if (hasAmountExpression(displayValue)) {
        return Number.NaN;
      }
      return Number.isFinite(value) ? value : Number.NaN;
    },
  }));

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) {
      return;
    }

    const commitBeforeSubmit = () => {
      commitValue(displayValue, false);
    };

    form.addEventListener("submit", commitBeforeSubmit, true);
    return () => form.removeEventListener("submit", commitBeforeSubmit, true);
  }, [displayValue, value]);

  const expressionPreview = (() => {
    if (!focused || !hasAmountExpression(displayValue)) {
      return null;
    }
    const evaluated = evaluateAmountExpression(displayValue);
    if (evaluated === null) {
      return null;
    }
    const formatted = formatAmountForInput(evaluated);
    if (displayValue.trim().replace(/\s+/g, "") === formatted) {
      return null;
    }
    return evaluated;
  })();

  const insertOperator = (operator: string) => {
    const nextValue = appendOperator(displayValue, operator);
    setDisplayValue(nextValue);
    setInvalid(false);

    const input = inputRef.current;
    if (!input) {
      return;
    }

    input.focus();
    const cursor = nextValue.length;
    input.setSelectionRange(cursor, cursor);
  };

  const handleChange = (raw: string) => {
    setDisplayValue(raw);
    setInvalid(false);

    if (raw.trim() === "") {
      onChange(Number.NaN);
      return;
    }

    const plainAmount = parsePlainAmount(raw);
    if (plainAmount !== null) {
      onChange(plainAmount);
    }
  };

  const handleFocus = () => {
    setFocused(true);
    inputRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  const handleBlur = () => {
    setFocused(false);
    commitValue(displayValue, true);
    onBlur?.();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitValue(displayValue, true);
      event.currentTarget.blur();
    }
  };

  const handleConfirm = () => {
    commitValue(displayValue, true);
    inputRef.current?.blur();
  };

  const showHelper = showHint && focused && !toolbarVisible;
  const showInlinePreview = expressionPreview !== null && !toolbarVisible;
  const toolbarPreviewLabel =
    expressionPreview !== null
      ? t("amountEquals", { value: formatCurrency(expressionPreview) })
      : null;

  return (
    <div className="space-y-1">
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="done"
        className={`${className ?? inputClassName} tabular-nums ${
          invalid || ariaInvalid ? "border-negative focus:border-negative focus:ring-negative/30" : ""
        }`}
        value={displayValue}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={invalid || ariaInvalid}
        aria-describedby={
          [showHelper ? hintId : null, showInlinePreview ? previewId : null]
            .filter(Boolean)
            .join(" ") || undefined
        }
        onFocus={handleFocus}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
      {showInlinePreview && (
        <p id={previewId} className="text-xs font-medium text-primary tabular-nums">
          {t("amountEquals", { value: formatCurrency(expressionPreview) })}
        </p>
      )}
      {showHelper && (
        <p id={hintId} className="text-xs text-stone-500">
          {t("amountCalculationHint")}
        </p>
      )}
      <AmountKeyboardToolbar
        visible={toolbarVisible}
        keyboardInset={keyboardInset}
        previewLabel={toolbarPreviewLabel}
        onAdd={() => insertOperator("+")}
        onSubtract={() => insertOperator("-")}
        onSplit={() => insertOperator("/")}
        onConfirm={handleConfirm}
      />
    </div>
  );
});
