'use client'
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { Spinner } from "@nextui-org/react";
import Alert from "../UI/Alert";
import PasswordInput from "./PasswordInput";
import api from "../../../utils/axios";
import { IS_DEMO_MODE } from "../../../utils/config";
import { describeApiError, fieldErrors } from "../../../utils/errors";

const PHONE_PATTERN = /^\+?1?\d{9,15}$/;

const initialValues = {
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    phone_number: "",
    sex: "",
    password: "",
    password2: "",
};

const validationSchema = Yup.object({
    first_name: Yup.string().trim().required("First name is required"),
    last_name: Yup.string().trim().required("Last name is required"),
    username: Yup.string().trim().required("Username is required"),
    email: Yup.string().email("Enter a valid email address").required("Email is required"),
    phone_number: Yup.string()
        .matches(PHONE_PATTERN, "Use 9–15 digits, optionally starting with +")
        .required("Phone number is required"),
    sex: Yup.string().oneOf(["M", "F", "O"]).required("Please select an option"),
    password: Yup.string().min(8, "Use at least 8 characters").required("Password is required"),
    password2: Yup.string()
        .oneOf([Yup.ref("password")], "Passwords must match")
        .required("Please confirm your password"),
});

const TextField = ({ name, label, type = "text", autoComplete, disabled }) => (
    <div>
        <label htmlFor={name} className="label">{label}</label>
        <Field id={name} name={name} type={type} autoComplete={autoComplete} className="input" disabled={disabled} />
        <ErrorMessage name={name} component="p" className="field-error" />
    </div>
);

const RegisterForm = () => {
    const router = useRouter();
    const { status } = useSession();

    useEffect(() => {
        if (status === "authenticated") router.replace("/");
    }, [status, router]);

    const handleSubmit = async (values, { setErrors, setStatus }) => {
        setStatus(null);
        try {
            await api.post("register/", values);
            router.push("/login?registered=1");
        } catch (error) {
            const errors = fieldErrors(error);
            const known = Object.keys(initialValues).filter((field) => errors[field]);
            if (error.response?.status === 400 && known.length) {
                setErrors(errors);
            } else {
                setStatus(describeApiError(error, "Registration failed. Please try again."));
            }
        }
    };

    return (
        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
            {({ isSubmitting, status: formError, values, setFieldValue }) => {
                const disabled = IS_DEMO_MODE || isSubmitting;
                return (
                    <Form className="space-y-5" noValidate>
                        {formError && <Alert>{formError}</Alert>}
                        <div className="grid gap-5 sm:grid-cols-2">
                            <TextField name="first_name" label="First name" autoComplete="given-name" disabled={disabled} />
                            <TextField name="last_name" label="Last name" autoComplete="family-name" disabled={disabled} />
                            <TextField name="username" label="Username" autoComplete="username" disabled={disabled} />
                            <TextField name="email" label="Email" type="email" autoComplete="email" disabled={disabled} />
                            <TextField name="phone_number" label="Phone number" type="tel" autoComplete="tel" disabled={disabled} />
                            <fieldset>
                                <legend className="label">Sex</legend>
                                <div className="flex gap-2">
                                    {[["M", "Male"], ["F", "Female"], ["O", "Other"]].map(([value, label]) => (
                                        <label
                                            key={value}
                                            className={`flex flex-1 cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40 ${values.sex === value ? "border-brand bg-brand/10 text-white" : "border-white/15 text-slate-300 hover:bg-white/5"
                                                } ${disabled ? "pointer-events-none opacity-60" : ""}`}
                                        >
                                            <input
                                                type="radio"
                                                name="sex"
                                                value={value}
                                                checked={values.sex === value}
                                                onChange={() => setFieldValue("sex", value)}
                                                className="sr-only"
                                                disabled={disabled}
                                            />
                                            {label}
                                        </label>
                                    ))}
                                </div>
                                <ErrorMessage name="sex" component="p" className="field-error" />
                            </fieldset>
                            <div>
                                <label htmlFor="password" className="label">Password</label>
                                <Field name="password">
                                    {({ field }) => <PasswordInput id="password" autoComplete="new-password" disabled={disabled} {...field} />}
                                </Field>
                                <ErrorMessage name="password" component="p" className="field-error" />
                            </div>
                            <div>
                                <label htmlFor="password2" className="label">Confirm password</label>
                                <Field name="password2">
                                    {({ field }) => <PasswordInput id="password2" autoComplete="new-password" disabled={disabled} {...field} />}
                                </Field>
                                <ErrorMessage name="password2" component="p" className="field-error" />
                            </div>
                        </div>
                        <button type="submit" className="btn-primary w-full py-3" disabled={disabled}>
                            {isSubmitting && <Spinner size="sm" color="current" />}
                            {isSubmitting ? "Creating account..." : "Create account"}
                        </button>
                    </Form>
                );
            }}
        </Formik>
    );
};

export default RegisterForm;
