import Link from "next/link";
import AuthCard from "../../components/auth/AuthCard";
import RegisterForm from "../../components/auth/RegisterForm";

export const metadata = { title: "Create account" };

const Register = () => (
    <AuthCard
        wide
        title="Create your account"
        subtitle="Save analysed images and their reports, and discuss them with the AI radiologist."
        footer={
            <>
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-brand-light hover:underline">Sign in</Link>
            </>
        }
    >
        <RegisterForm />
    </AuthCard>
);

export default Register;
