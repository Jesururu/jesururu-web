import React from 'react';
import { usePaystackPayment } from 'react-paystack';
import axios from 'axios'; // <--- CRITICAL: If this is missing, nothing works!

// 1. HARDCODE VARIABLES FOR TESTING (To rule out .env issues)
// Replace with your keys
const PAYSTACK_KEY = "pk_test_0dd738f655890a626f0130f5d22184e9043ba365";
const STRAPI_URL = "http://localhost:1337"; 

const PaystackTrigger = ({ amount, email, name, bookTitle, onSuccess }) => {
    
    const config = {
        reference: (new Date()).getTime().toString(),
        email: email,
        amount: amount * 100,
        publicKey: PAYSTACK_KEY,
        metadata: {
            name: name,
            custom_fields: [{ display_name: "Book", variable_name: "book_title", value: bookTitle }]
        }
    };

    const initializePayment = usePaystackPayment(config);

    // 2. THE SAVE FUNCTION (Now with ALERTS)
    const saveToBackend = async (refId) => {
        alert("STEP 2: Trying to save to Strapi..."); // 🚨 DEBUG ALERT
        console.log("🔥 SAVE STARTED. Target URL:", `${STRAPI_URL}/api/book-sales`);

        try {
            const payload = {
                data: {
                    customerName: name,
                    customerEmail: email,
                    amountPaid: amount,
                    reference: refId,
                    bookTitle: bookTitle,
                    paymentStatus: 'success',
                    publishedAt: new Date().toISOString()
                }
            };
            
            console.log("📦 Payload being sent:", payload);

            const res = await axios.post(`${STRAPI_URL}/api/book-sales`, payload);
            
            alert("STEP 3: SUCCESS! Saved to Database."); // 🚨 DEBUG ALERT
            console.log("✅ Database Response:", res.data);

        } catch (e) {
            alert("STEP 3: FAILED! Check Console."); // 🚨 DEBUG ALERT
            console.error("❌ Database Error Details:", e);
            if (e.response) {
                console.error("❌ Server replied:", e.response.data);
            }
        }
    };

    const handlePay = () => {
        if (!email || !name) {
            alert("Please enter Name and Email");
            return;
        }

        initializePayment(
            // Success Callback
            (response) => {
                alert("STEP 1: Paystack Success! Ref: " + response.reference); // 🚨 DEBUG ALERT
                saveToBackend(response.reference); 
                onSuccess(response.reference);     
            },
            // Close Callback
            () => alert("Transaction Cancelled")
        );
    };

    return (
        <button 
            onClick={handlePay}
            className="block w-full text-center bg-ministry-gold text-white py-4 font-bold uppercase tracking-widest hover:bg-ministry-blue hover:scale-[1.02] transition-all shadow-lg rounded-sm"
        >
            DEBUG: Secure Seat (Paystack)
        </button>
    );
};

export default PaystackTrigger;