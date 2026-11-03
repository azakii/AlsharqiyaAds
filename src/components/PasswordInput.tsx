"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/** حقل كلمة مرور مع زر إظهار/إخفاء. يجب وضعه داخل عنصر `relative`. */
export function PasswordInput({ className = "", ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [show, setShow] = useState(false);
  return (
    <>
      <input {...props} type={show ? "text" : "password"} className={`${className} pl-10`} />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 transition-colors hover:text-gold"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </>
  );
}
