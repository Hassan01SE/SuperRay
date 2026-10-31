import Image from "next/image";
import Link from "next/link";
import { FaGithub } from "react-icons/fa";
import Logo from "../../../public/logo.png";
import { SOURCE_CODE_URL } from "../../../utils/config";

const footerLinks = [
    { name: "About", href: "/about" },
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Licensing", href: "/licensing" },
    { name: "Contact", href: "/contact" },
];

export const Footer = () => (
    <footer className="border-t border-white/10 bg-ink-950">
        <div className="page flex flex-col gap-6 py-10 md:flex-row md:items-start md:justify-between">
            <div className="max-w-sm">
                <Image src={Logo} alt="SuperRay" className="-ml-3 h-12 w-auto" />
                <p className="mt-3 text-sm text-slate-400">
                    Final Year Design Project, NED University of Engineering and Technology. A research prototype, not
                    intended for clinical use.
                </p>
            </div>
            <nav aria-label="Footer">
                <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    {footerLinks.map(({ name, href }) => (
                        <li key={href}>
                            <Link href={href} className="text-slate-300 hover:text-white">{name}</Link>
                        </li>
                    ))}
                    <li>
                        <a
                            href={SOURCE_CODE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white"
                        >
                            <FaGithub aria-hidden="true" /> Source code
                        </a>
                    </li>
                </ul>
            </nav>
        </div>
        <div className="border-t border-white/5">
            <p className="page py-4 text-xs text-slate-500">© 2024 SuperRay. All rights reserved.</p>
        </div>
    </footer>
);
