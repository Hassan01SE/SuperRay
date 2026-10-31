'use client'
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Dropdown, DropdownItem, DropdownMenu, DropdownSection, DropdownTrigger } from "@nextui-org/react";
import { FaBars, FaTimes, FaUserCircle } from "react-icons/fa";
import Logo from "../../../public/logo.png";

const links = [
    { name: "Home", href: "/" },
    { name: "Analyze image", href: "/upload" },
    { name: "Reports", href: "/reports" },
    { name: "About", href: "/about" },
];

function isActive(pathname, href) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export const Navbar = () => {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => setMenuOpen(false), [pathname]);

    const user = session?.user;
    const displayName = user?.name || user?.username;

    return (
        <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/90 backdrop-blur">
            <nav className="page flex h-16 items-center justify-between gap-4" aria-label="Main">
                <Link href="/" className="shrink-0 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">
                    <Image src={Logo} alt="SuperRay home" className="h-14 w-auto" priority />
                </Link>

                <ul className="hidden items-center gap-1 md:flex">
                    {links.map(({ name, href }) => (
                        <li key={href}>
                            <Link
                                href={href}
                                aria-current={isActive(pathname, href) ? "page" : undefined}
                                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive(pathname, href)
                                    ? "bg-white/10 text-white"
                                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                                    }`}
                            >
                                {name}
                            </Link>
                        </li>
                    ))}
                </ul>

                <div className="hidden items-center md:flex">
                    {status === "loading" && <div className="h-9 w-24 animate-pulse rounded-lg bg-white/5" aria-hidden="true" />}
                    {status === "unauthenticated" && (
                        <Link href="/login" className="btn-secondary">Sign in</Link>
                    )}
                    {status === "authenticated" && (
                        <Dropdown placement="bottom-end" className="dark">
                            <DropdownTrigger>
                                <button type="button" className="btn-ghost">
                                    <FaUserCircle className="text-xl text-brand" aria-hidden="true" />
                                    <span className="max-w-[10rem] truncate">{displayName}</span>
                                </button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Account" variant="flat">
                                <DropdownSection showDivider>
                                    <DropdownItem key="identity" isReadOnly className="cursor-default opacity-100" textValue="Signed in as">
                                        <p className="text-xs text-slate-400">Signed in as</p>
                                        <p className="truncate text-sm font-medium text-white">{user?.email || `@${user?.username}`}</p>
                                    </DropdownItem>
                                </DropdownSection>
                                <DropdownSection showDivider>
                                    <DropdownItem key="profile" href="/profile" as={Link}>Profile</DropdownItem>
                                    <DropdownItem key="reports" href="/reports" as={Link}>My reports</DropdownItem>
                                </DropdownSection>
                                <DropdownSection>
                                    <DropdownItem key="logout" color="danger" className="text-danger" onPress={() => signOut({ callbackUrl: "/" })}>
                                        Sign out
                                    </DropdownItem>
                                </DropdownSection>
                            </DropdownMenu>
                        </Dropdown>
                    )}
                </div>

                <button
                    type="button"
                    className="btn-ghost px-2 md:hidden"
                    aria-expanded={menuOpen}
                    aria-controls="mobile-menu"
                    aria-label={menuOpen ? "Close menu" : "Open menu"}
                    onClick={() => setMenuOpen((open) => !open)}
                >
                    {menuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
                </button>
            </nav>

            {menuOpen && (
                <div id="mobile-menu" className="border-t border-white/10 bg-ink-950 md:hidden">
                    <ul className="page flex flex-col gap-1 py-3">
                        {links.map(({ name, href }) => (
                            <li key={href}>
                                <Link
                                    href={href}
                                    aria-current={isActive(pathname, href) ? "page" : undefined}
                                    className={`block rounded-md px-3 py-2.5 text-base font-medium ${isActive(pathname, href) ? "bg-white/10 text-white" : "text-slate-300"
                                        }`}
                                >
                                    {name}
                                </Link>
                            </li>
                        ))}
                        <li className="mt-2 border-t border-white/10 pt-3">
                            {status === "authenticated" ? (
                                <div className="flex flex-col gap-1">
                                    <p className="px-3 pb-1 text-sm text-slate-400">Signed in as {displayName}</p>
                                    <Link href="/profile" className="block rounded-md px-3 py-2.5 text-base font-medium text-slate-300">Profile</Link>
                                    <button
                                        type="button"
                                        onClick={() => signOut({ callbackUrl: "/" })}
                                        className="rounded-md px-3 py-2.5 text-left text-base font-medium text-rose-300"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            ) : (
                                <Link href="/login" className="btn-secondary w-full">Sign in</Link>
                            )}
                        </li>
                    </ul>
                </div>
            )}
        </header>
    );
};
