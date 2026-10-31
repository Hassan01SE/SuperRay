'use client';
import { addDoc, collection, Timestamp } from "firebase/firestore/lite";
import { getContactFirestore } from "./fireBaseConfig";

export const sendContactForm = async ({ name, email, message }) => {
    try {
        const ref = collection(getContactFirestore(), "contact");
        await addDoc(ref, {
            name,
            email,
            message,
            sentAt: Timestamp.now().toDate(),
        });
        return 0;
    } catch (err) {
        console.error("Contact form submission failed:", err);
        return -1;
    }
};
