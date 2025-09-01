import { LabelHTMLAttributes } from "react";

export default function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  const { className = "", ...rest } = props;
  return (
    <label
      className={[
        "block text-sm font-medium text-neutral-600 dark:text-neutral-300",
        className,
      ].join(" ")}
      {...rest}
    />
  );
}

