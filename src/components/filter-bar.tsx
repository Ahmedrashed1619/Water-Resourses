"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/context";
import { SelectBox } from "./select-box";

export type FilterField =
  | { kind: "text"; name: string; label: string; placeholder?: string }
  | { kind: "select"; name: string; label: string; options: { value: string; label: string }[] };

export function FilterBar({
  action,
  fields,
  values,
}: {
  action: string;
  fields: FilterField[];
  values: Record<string, string | undefined>;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const hasActive = fields.some((field) => Boolean(values[field.name]));

  return (
    <form className="filters" action={action}>
      {fields.map((field) =>
        field.kind === "text" ? (
          <label key={field.name} className="field">
            <span>{field.label}</span>
            <input className="input" name={field.name} defaultValue={values[field.name] ?? ""} placeholder={field.placeholder} />
          </label>
        ) : (
          <label key={field.name} className="field">
            <span>{field.label}</span>
            <SelectBox name={field.name} defaultValue={values[field.name] ?? ""} options={field.options} />
          </label>
        ),
      )}
      <button className="btn btn-primary" type="submit">
        {t("تصفية", "Filter")}
      </button>
      {hasActive ? (
        <button className="btn btn-ghost" type="button" onClick={() => router.push(action)}>
          {t("مسح الفلاتر", "Clear filters")}
        </button>
      ) : null}
    </form>
  );
}
