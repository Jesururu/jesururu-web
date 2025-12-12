import React from 'react';
import { PaystackButton } from 'react-paystack';
import axios from 'axios';

// 1. CONFIGURATION
// Replace with your actual Test Public Key
const PAYSTACK_KEY = "pk_test_0dd738f655890a626f0130f5d22184e9043ba365";
const STRAPI_URL = "http://localhost:1337"; 

const PaystackTrigger = ({ amount, email, name, bookTitle, onSuccess }) => {
    
    // 2. BACKEND SAVE FUNCTION
    const saveToBackend = async (refId) => {
        console.log("🔥 STEP 2: Attempting to save to Strapi...");
        try {
            await axios.post(`${STRAPI_URL}/api/book-sales`, {
                data: {
                    customerName: name,
                    customerEmail: email,
                    amountPaid: amount,
                    reference: refId,
                    bookTitle: bookTitle,
                    paymentStatus: 'success', // Ensure Strapi field matches this!
                    publishedAt: new Date().toISOString()
                }
            });
            console.log("✅ STEP 3: Saved successfully!");
        } catch (e) {
            console.error("❌ SAVE FAILED:", e);
            alert("Payment received, but database save failed. Check console for red errors.");
        }
    };

    // 3. PAYSTACK PROPS
    const componentProps = {
        email: email,
        amount: amount * 100, // Convert to Kobo
        metadata: {
            name: name,
            custom_fields: [{ display_name: "Book", variable_name: "book_title", value: bookTitle }]
        },
        publicKey: PAYSTACK_KEY,
        text: "Secure Seat & Copy (Paystack)",
        
        // SUCCESS HANDLER
        onSuccess: (response) => {
            console.log("🎉 STEP 1: Paystack Success! Ref:", response.reference);
            saveToBackend(response.reference); // Trigger the save
            onSuccess(response.reference);     // Close the modal
        },
        
        // CLOSE HANDLER
        onClose: () => alert("Transaction Cancelled"),
    };

    // 4. RENDERING
    // If details are missing, show a gray, disabled button
    if (!email || !name) {
        return (
            <button 
                type="button" 
                onClick={() => alert("Please enter your Name and Email first.")}
                className="block w-full text-center bg-gray-300 text-gray-500 py-4 font-bold uppercase tracking-widest cursor-not-allowed rounded-sm"
            >
                Enter Name & Email to Pay
            </button>
        );
    }

    // Show the Real Button
    return (
        <div className="paystack-wrapper">
             <PaystackButton 
                {...componentProps} 
                className="block w-full text-center bg-ministry-gold text-white py-4 font-bold uppercase tracking-widest hover:bg-ministry-blue hover:scale-[1.02] transition-all shadow-lg rounded-sm cursor-pointer"
             />
        </div>
    );
};

export default PaystackTrigger;