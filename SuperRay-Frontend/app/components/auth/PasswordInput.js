'use client'
import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const PasswordInput = ({ id, ...props }) => {
    const [visible, setVisible] = useState(false);
    return (
        <div className="relative">
            <input id={id} type={visible ? "text" : "password"} className="input pr-11" {...props} />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-slate-400 hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                aria-label={visible ? "Hide password" : "Show password"}
                aria-controls={id}
            >
                {visible ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
            </button>
        </div>
    );
};

export default PasswordInput;
