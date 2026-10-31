'use client'
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Spinner } from "@nextui-org/react";
import { FaUserCircle } from "react-icons/fa";
import { MdErrorOutline, MdPersonOff } from "react-icons/md";
import Loading from "../../loading";
import Alert from "../../components/UI/Alert";
import StatusMessage from "../../components/UI/StatusMessage";
import SignInRequired from "../../components/UI/SignInRequired";
import useAxiosAuth from "../../../utils/hooks/useAxiosAuth";
import { IS_DEMO_MODE } from "../../../utils/config";
import { describeApiError, fieldErrors } from "../../../utils/errors";
import { formatDate, formatSex } from "../../../utils/format";

const EDITABLE_FIELDS = ["first_name", "last_name", "phone_number", "sex"];

const Detail = ({ label, children }) => (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm text-slate-400">{label}</dt>
        <dd className="mt-1 text-sm text-slate-100 sm:col-span-2 sm:mt-0">{children}</dd>
    </div>
);

const EditProfileForm = ({ profile, onSaved, onCancel }) => {
    const axiosAuth = useAxiosAuth();
    const [values, setValues] = useState(() =>
        Object.fromEntries(EDITABLE_FIELDS.map((field) => [field, profile[field] ?? ""]))
    );
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const update = (event) => setValues({ ...values, [event.target.name]: event.target.value });

    const submit = async (event) => {
        event.preventDefault();
        if (!values.first_name.trim() || !values.last_name.trim()) {
            setErrors({ first_name: !values.first_name.trim() && "Required", last_name: !values.last_name.trim() && "Required" });
            return;
        }
        setIsSaving(true);
        setErrors({});
        setFormError(null);
        try {
            const { data } = await axiosAuth.put("profile/update/", values);
            onSaved(data);
        } catch (error) {
            const fields = fieldErrors(error);
            if (error.response?.status === 400 && EDITABLE_FIELDS.some((field) => fields[field])) setErrors(fields);
            else setFormError(describeApiError(error, "Your profile could not be updated."));
            setIsSaving(false);
        }
    };

    const input = (name, label, props = {}) => (
        <div>
            <label htmlFor={name} className="label">{label}</label>
            <input id={name} name={name} value={values[name]} onChange={update} className="input" {...props} />
            {errors[name] && <p className="field-error">{errors[name]}</p>}
        </div>
    );

    return (
        <form onSubmit={submit} className="space-y-5">
            {formError && <Alert>{formError}</Alert>}
            <div className="grid gap-5 sm:grid-cols-2">
                {input("first_name", "First name", { autoComplete: "given-name" })}
                {input("last_name", "Last name", { autoComplete: "family-name" })}
                {input("phone_number", "Phone number", { type: "tel", autoComplete: "tel" })}
                <div>
                    <label htmlFor="sex" className="label">Sex</label>
                    <select id="sex" name="sex" value={values.sex} onChange={update} className="input">
                        <option value="">Not specified</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="O">Other</option>
                    </select>
                    {errors.sex && <p className="field-error">{errors.sex}</p>}
                </div>
            </div>
            <div className="flex gap-3">
                <button type="submit" className="btn-primary" disabled={isSaving}>
                    {isSaving && <Spinner size="sm" color="current" />}
                    {isSaving ? "Saving..." : "Save changes"}
                </button>
                <button type="button" className="btn-secondary" onClick={onCancel} disabled={isSaving}>Cancel</button>
            </div>
        </form>
    );
};

const LiveProfile = () => {
    const { status } = useSession();
    const axiosAuth = useAxiosAuth();
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saved, setSaved] = useState(false);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (status !== "authenticated") return;
        let cancelled = false;
        setError(null);
        axiosAuth
            .get("profile/")
            .then(({ data }) => !cancelled && setProfile(data))
            .catch((err) => !cancelled && setError(describeApiError(err, "Your profile could not be loaded.")));
        return () => {
            cancelled = true;
        };
    }, [status, attempt, axiosAuth]);

    if (status === "loading") return <Loading />;
    if (status === "unauthenticated") return <SignInRequired what="your profile" />;
    if (error) {
        return (
            <StatusMessage
                icon={MdErrorOutline}
                tone="error"
                title="Profile unavailable"
                action={<button type="button" className="btn-secondary" onClick={() => setAttempt((n) => n + 1)}>Try again</button>}
            >
                {error}
            </StatusMessage>
        );
    }
    if (!profile) return <Loading />;

    return (
        <>
            <header className="flex flex-wrap items-center gap-4">
                <FaUserCircle className="text-6xl text-brand" aria-hidden="true" />
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{profile.first_name} {profile.last_name}</h1>
                    <p className="text-sm text-slate-400">@{profile.username}</p>
                </div>
            </header>

            {saved && !isEditing && <Alert variant="success" className="mt-6">Your profile was updated.</Alert>}

            <section className="card mt-6 p-6" aria-labelledby="details-heading">
                <div className="flex items-center justify-between">
                    <h2 id="details-heading" className="font-semibold">{isEditing ? "Edit details" : "Account details"}</h2>
                    {!isEditing && (
                        <button type="button" className="btn-secondary" onClick={() => { setSaved(false); setIsEditing(true); }}>
                            Edit
                        </button>
                    )}
                </div>
                <div className="mt-4">
                    {isEditing ? (
                        <EditProfileForm
                            profile={profile}
                            onCancel={() => setIsEditing(false)}
                            onSaved={(data) => {
                                setProfile(data);
                                setIsEditing(false);
                                setSaved(true);
                            }}
                        />
                    ) : (
                        <dl className="divide-y divide-white/5">
                            <Detail label="Username">{profile.username}</Detail>
                            <Detail label="Email">{profile.email}</Detail>
                            <Detail label="Phone number">{profile.phone_number || "Not provided"}</Detail>
                            <Detail label="Sex">{formatSex(profile.sex)}</Detail>
                            <Detail label="Member since">{formatDate(profile.date_joined)}</Detail>
                            <Detail label="Saved reports">
                                <Link href="/reports" className="text-brand-light hover:underline">{profile.reports.length}</Link>
                            </Detail>
                        </dl>
                    )}
                </div>
            </section>
        </>
    );
};

const Profile = () => (
    <div className="page max-w-3xl py-10 lg:py-14">
        {IS_DEMO_MODE ? (
            <StatusMessage
                icon={MdPersonOff}
                title="Profiles are unavailable in demonstration mode"
                action={<Link href="/reports" className="btn-secondary">Browse sample reports</Link>}
            >
                User accounts are stored by the SuperRay backend, which is currently offline.
            </StatusMessage>
        ) : (
            <LiveProfile />
        )}
    </div>
);

export default Profile;
