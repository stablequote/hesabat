import { IconPlus } from "@tabler/icons-react";
import "../assets/css/PageHeader.css";

// Page title + count on one side, the primary action on the other.
function PageHeader({ title, subtitle, actionLabel, onAction, actionIcon: Icon = IconPlus, actionDisabled }) {
  return (
    <div className="ph">
      <div>
        <h1 className="ph__title">{title}</h1>
        {subtitle && <p className="ph__sub">{subtitle}</p>}
      </div>

      {actionLabel && (
        <button type="button" className="ph__btn" onClick={onAction} disabled={actionDisabled}>
          <Icon size={18} stroke={2} aria-hidden="true" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default PageHeader;