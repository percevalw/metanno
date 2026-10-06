import React, { useEffect, useRef } from "react";
import { RowData, TableData, TableMethods } from "../../types";

// Restore row identities after a query replaces the table source and notify linked widgets
export function useRowSelection(
  rowSource: TableData["rowSource"],
  primaryKey: TableData["primaryKey"],
  preserveSelection: boolean,
  selection: TableData["selection"],
  activeSelection: TableData["selection"],
  getRow: (index: number) => RowData,
  setLocalSelection: React.Dispatch<React.SetStateAction<TableData["selection"] | undefined>>,
  onSelectionChange: TableMethods["onSelectionChange"]
) {
  const selectedIds = useRef<React.Key[]>([]);
  const previousSource = useRef(rowSource);
  if (rowSource === previousSource.current && primaryKey) {
    const indices = (activeSelection?.ranges ?? []).map((range) => range.row_idx);
    if (activeSelection?.row_idx != null && activeSelection.row_idx >= 0 && !indices.includes(activeSelection.row_idx))
      indices.unshift(activeSelection.row_idx);
    selectedIds.current = indices.map((idx) => getRow(idx)?.[primaryKey]).filter((id) => id != null);
  }
  // Resolve selected identities in replacement rows before notifying factory subscribers
  useEffect(() => {
    if (!rowSource || rowSource === previousSource.current) return;
    const previous = previousSource.current;
    previousSource.current = rowSource;
    if (!previous || !selectedIds.current.length) return;
    const controller = new AbortController();
    void (async () => {
      const indices =
        preserveSelection && primaryKey && rowSource.findRowIndex
          ? (await Promise.all(selectedIds.current.map((id) => rowSource.findRowIndex!(id, controller.signal)))).filter(
              (idx) => idx >= 0
            )
          : [];
      const rows = await Promise.all(
        indices.map(
          async (idx) => rowSource.getCachedRow?.(idx) ?? (await rowSource.getRows(idx, idx + 1, controller.signal))[0]
        )
      );
      if (!controller.signal.aborted) {
        if (selection === undefined)
          setLocalSelection({
            ...activeSelection,
            row_idx: indices[0] ?? null,
            ranges: indices.map((row_idx) => ({ row_idx })),
          });
        onSelectionChange?.(
          rows[0]?.[primaryKey] ?? null,
          indices[0] ?? null,
          activeSelection?.col,
          activeSelection?.mode ?? "SELECT",
          "snapshot",
          indices.map((row_idx) => ({ row_idx })),
          rows[0] ?? null,
          rows
        );
      }
    })().catch((reason) => {
      if (!controller.signal.aborted) console.error("Table selection failed", reason);
    });
    return () => controller.abort();
  }, [rowSource]);
}
