'use client';
import { useState } from 'react';
import { Spinner } from "@nextui-org/react";
import Alert from "../components/UI/Alert";
import { sendContactForm } from "./sendContactForm";
import { isContactFormConfigured } from "./fireBaseConfig";

const emptyForm = { name: '', email: '', message: '' };

const Contact = () => {
    const [formData, setFormData] = useState(emptyForm);
    const [state, setState] = useState('idle');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setState('sending');
        const res = await sendContactForm(formData);
        if (res === 0) {
            setFormData(emptyForm);
            setState('sent');
        } else {
            setState('error');
        }
    };

    return (
        <div className="page flex justify-center py-12 lg:py-16">
            <div className="w-full max-w-xl">
                <h1 className="text-3xl font-bold tracking-tight">Contact us</h1>
                <p className="mt-2 text-slate-400">Questions or feedback about SuperRay? Send the team a message.</p>

                <form onSubmit={handleSubmit} className="card mt-8 space-y-5 p-6 sm:p-8">
                    {state === 'sent' && <Alert variant="success">Thanks, your message has been sent.</Alert>}
                    {state === 'error' && <Alert>Your message could not be sent. Please try again later.</Alert>}
                    {!isContactFormConfigured && <Alert variant="warning">The contact form is not configured in this deployment.</Alert>}
                    <fieldset disabled={!isContactFormConfigured} className="space-y-5">
                        <div>
                            <label className="label" htmlFor="name">Name</label>
                            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="input" autoComplete="name" required />
                        </div>
                        <div>
                            <label className="label" htmlFor="email">Email</label>
                            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="input" autoComplete="email" required />
                        </div>
                        <div>
                            <label className="label" htmlFor="message">Message</label>
                            <textarea name="message" id="message" value={formData.message} onChange={handleChange} className="input" rows={6} maxLength={5000} required />
                        </div>
                        <button type="submit" className="btn-primary w-full py-3" disabled={state === 'sending'}>
                            {state === 'sending' && <Spinner size="sm" color="current" />}
                            {state === 'sending' ? 'Sending...' : 'Send message'}
                        </button>
                    </fieldset>
                </form>
            </div>
        </div>
    );
}

export default Contact;
