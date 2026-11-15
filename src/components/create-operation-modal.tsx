"use client";

import { useState } from "react";
import { CreateOperationForm } from "./create-operation-form";
import { Modal } from "./modal";
import { useI18n } from "@/i18n/context";
import type { StageRule } from "@/lib/rules";

type TypeOption = { id: string; code: string; nameAr: string; nameEn: string; stages: (StageRule & { nameAr: string; nameEn: string })[] };
type Dept = { id: string; code: string; nameAr: string; nameEn: string };

export function CreateOperationModal({
  types,
  departments,
  startOpen = false,
}: {
  types: TypeOption[];
  departments: Dept[];
  startOpen?: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(startOpen);
  return (
    <>
      <button className="btn btn-primary" type="button" onClick={() => setOpen(true)}>
        {t("عملية جديدة", "New operation")}
      </button>
      <Modal
        open={open}
        wide
        title={t("عملية جديدة", "New operation")}
        subtitle={t("اختر النوع وتاريخ الموافقة والإدارات. المراحل المرجعية تُحسب تلقائيًا.", "Choose the type, approval date, and departments. Reference stages are calculated automatically.")}
        onClose={() => setOpen(false)}
      >
        <CreateOperationForm types={types} departments={departments} />
      </Modal>
    </>
  );
}
