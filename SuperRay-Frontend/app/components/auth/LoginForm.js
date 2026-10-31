'use client'
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getProviders, signIn, useSession } from "next-auth/react";
import { Spinner } from "@nextui-org/react";
import { FaGoogle } from "react-icons/fa";
import Alert from "../UI/Alert";
import PasswordInput from "./PasswordInput";
import { IS_DEMO_MODE } from "../../../utils/config";

const LoginForm = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { status } = useSession();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [googleEnabled, setGoogleEnabled] = useState(false);

    const justRegistered = searchParams.get("registered") === "1";

    useEffect(() => {
        if (status === "authenticated") router.replace("/reports");
    }, [status, router]);

    useEffect(() => {
        if (IS_DEMO_MODE) return;
        getProviders().then((providers) => setGoogleEnabled(Boolean(providers?.google)));
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        setError(null);
        const result = await signIn("credentials", { username, password, redirect: false });
        if (result?.error) {
            setError(result.error === "CredentialsSignin" ? "Incorrect username or password." : result.error);
            setIsSubmitting(false);
        } else {
            router.replace("/reports");
        }
    };

    const disabled = IS_DEMO_MODE || isSubmitting;

    return (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {justRegistered && <Alert variant="success">Your account was created. Sign in to continue.</Alert>}
            {error && <Alert>{error}</Alert>}

            <div>
                <label htmlFor="username" className="label">Username</label>
                <input
                    id="username"
                    className="input"
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                    disabled={disabled}
                />
            </div>
            <div>
                <label htmlFor="password" className="label">Password</label>
                <PasswordInput
                    id="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    disabled={disabled}
                />
            </div>

            <button type="submit" className="btn-primary w-full py-3" disabled={disabled || !username || !password}>
                {isSubmitting && <Spinner size="sm" color="current" />}
                {isSubmitting ? "Signing in..." : "Sign in"}
            </button>

            {googleEnabled && (
                <>
                    <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-slate-500">
                        <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
                    </div>
                    <button type="button" className="btn-secondary w-full py-3" onClick={() => signIn("google", { callbackUrl: "/reports" })}>
                        <FaGoogle aria-hidden="true" /> Continue with Google
                    </button>
                </>
            )}
        </form>
    );
};

export default LoginForm;
