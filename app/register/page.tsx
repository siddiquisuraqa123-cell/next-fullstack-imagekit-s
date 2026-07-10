"use client"
import { useRouter } from "next/navigation";
import React, { useState } from "react";

function RegisterPage() {

const [email , setEmail] = useState ("") ;
const [password, setPassword] = useState ("") ;
const [confirmPassword, setConfirmPassword] = useState ("") ;
const router = useRouter();

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => 
    {
        e.preventDefault
        if(password !== confirmPassword) {
            alert("Passwords do not match");
            return;
            try {
                const response = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email, password }),
                });
                const data = await response.json();

                if (response.ok) {
throw new Error(data.error || "Registration failed"); 
                } else {
                    throw new Error("Registration failed");
                }

                console.log(data);
                router.push("/login");
            } catch (error) {
              console.error(error);
            }
        }
    }


    return <div>
        <h1>Register</h1>
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="email">Email:</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div>
                <label htmlFor="password">Password:</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>
            <div>
                <label htmlFor="confirmPassword">Confirm Password:</label>
                <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
            </div>
            <button type="submit">Register</button>
        </form>
        <div>
            <p>Already have an account? <a href="/login">Login</a></p>
        </div>
    </div>;
}

export default RegisterPage;