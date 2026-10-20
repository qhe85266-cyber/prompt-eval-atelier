import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

export function Modal({
  title,
  titleId,
  onClose,
  wide,
  children,
}: {
  title: string;
  titleId: string;
  onClose: () => void;
  wide?: boolean;
  children: ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="backdrop" onClick={onClose}>
      <div
        className={wide ? "modal modal-wide" : "modal"}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-head">
          <h2 id={titleId}>{title}</h2>
          <button ref={closeRef} className="btn-ghost" type="button" onClick={onClose}>
            关闭
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
