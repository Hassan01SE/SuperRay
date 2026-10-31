import { Suspense } from "react";
import Link from "next/link";
import AuthCard from "../../components/auth/AuthCard";
import LoginForm from "../../components/auth/LoginForm";

export const metadata = { title: "Sign in" };

const Login = () => (
    <AuthCard
        title="Welcome back"
        subtitle="Sign in to save reports and chat with the AI radiologist."
        footer={
            <>
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-semibold text-brand-light hover:underline">Create one</Link>
            </>
        }
    >
        <Suspense>
            <LoginForm />
        </Suspense>
    </AuthCard>
);

export default Login;
