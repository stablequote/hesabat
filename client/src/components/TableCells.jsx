import { IconTrash } from "@tabler/icons-react";
import moment from "moment";

// pen with an underline, as in the design (Feather "edit-3" shape)
const IconPenLine = ({ size = 18, stroke = 1.75 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

// Icon-only row actions. Pass only the handlers a page needs.
// Clicks never reach the row, so they don't trigger onRowClick.
export function RowActions({ onEdit, onDelete, editLabel = "Edit", deleteLabel = "Delete" }) {
  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn?.();
  };
  return (
    <div className="ra" onClick={(e) => e.stopPropagation()}>
      {onEdit && (
        <button type="button" className="ra__btn ra__btn--edit" aria-label={editLabel} title={editLabel} onClick={stop(onEdit)}>
          <IconPenLine />
        </button>
      )}
      {onDelete && (
        <button type="button" className="ra__btn ra__btn--del" aria-label={deleteLabel} title={deleteLabel} onClick={stop(onDelete)}>
          <IconTrash size={18} stroke={1.75} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

// Date on the first line, time under it. Each line is isolated left-to-right so
// "7 Nov 2026" never gets scrambled inside a right-to-left page.
export function DateTimeCell({ value }) {
  if (!value) return <span className="tc-muted">—</span>;
  const m = moment(value);
  return (
    <div>
      <div>
        <bdi dir="ltr" className="tc-date">{m.format("D MMM YYYY")}</bdi>
      </div>
      <div>
        <bdi dir="ltr" className="tc-time">{m.format("hh:mm a")}</bdi>
      </div>
    </div>
  );
}