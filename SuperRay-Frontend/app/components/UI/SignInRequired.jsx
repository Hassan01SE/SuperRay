import Link from "next/link";
import { MdLockOutline } from "react-icons/md";
import StatusMessage from "./StatusMessage";

const SignInRequired = ({ what = "this page" }) => (
    <StatusMessage
        icon={MdLockOutline}
        title="Sign in required"
        action={
            <>
                <Link href="/login" className="btn-primary">Sign in</Link>
                <Link href="/register" className="btn-secondary">Create an account</Link>
            </>
        }
    >
        You need a SuperRay account to view {what}.
    </StatusMessage>
);

export default SignInRequired;
