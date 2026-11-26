import React, { useState } from "react";

// The text of an error with its links clickable, eg the login link of a Trino error, for the tab toolbar and the
// sidebar
export function errorText(text: string) {
  return text.split(/(https?:\/\/[^\s"')]+)/).map((part, index) =>
    index % 2 ? (
      <a key={index} href={part} target="_blank" rel="noreferrer">
        {part}
      </a>
    ) : (
      part
    )
  );
}

// State of a Metanno tab, shown as plain text (eg the path of an Annotation) or as a pill like the StatusBadge of
// the view statuses, with a spinner for a work in progress (`kind` busy) or in red for an error. `title` shows on
// hover and defaults to the text
export type TabStatus = { text: string; kind?: "busy" | "error"; title?: string };

/**
 * Toolbar of the Metanno tabs (Annotations, notebook previews and tables opened from the explorer), with the state
 * of the tab on the left, then the tray where StatusTray (widget_data.py) puts the statuses shared by several
 * widgets of the view, then the `children` controls of the tab and the fullscreen button on the right. A long error
 * is cut and shows over several lines after a click
 */
export function ViewToolbar({
  status,
  fullscreenButton,
  children,
}: {
  status: TabStatus;
  fullscreenButton: HTMLButtonElement;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const error = status.kind === "error";
  return (
    <div className="metanno-viewer__status">
      <span
        className={[
          "metanno-viewer__status-text",
          status.kind && `metanno-viewer__badge metanno-viewer__badge--${status.kind}`,
          error && expanded === status.text && "metanno-viewer__badge--expanded",
        ]
          .filter(Boolean)
          .join(" ")}
        role={error ? "alert" : undefined}
        title={status.title ?? status.text}
        onClick={error ? () => setExpanded(expanded === status.text ? null : status.text) : undefined}
      >
        {error ? errorText(status.text) : status.text}
      </span>
      <div className="metanno-viewer__tray" />
      {children}
      <span className="metanno-viewer__fullscreen-button" ref={(node) => node?.append(fullscreenButton)} />
    </div>
  );
}
