import React, { useState } from "react"
import { signUp } from "./Auth"
import {signIn} from "./Auth";
import ConfirmSignUp from "./ConfirmSignUp";
import {useForm} from "react-hook-form";
import Form from "../CSS/Form.css"
import {Link} from "react-router-dom";
import SignIn from "./SignIn";
import seenemaLogo from '../../assets/SeenemaLogo.png';

export default function SignUp() {
    const [firstname, setFirstname] = useState("")
    const [lastname, setLastname] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const { register } = useForm();
    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")

        try {
            await signUp(firstname, lastname, email, password)
            setSuccess(true)
        } catch (err) {
            setError(err.message)
        }
    }

    if (success) {
        return (
            <ConfirmSignUp email={email}/>
        )
    }

    return (
        <div className="bg-Poster">
            <div className="auth-Form">
                <div className= "logo-auth">
                    <img
                        src={seenemaLogo}
                        alt={"Logo is here"}
                    />
                </div>
                <form onSubmit={handleSubmit} >
                    <div className="heading-auth">
                        <h1>SignUp</h1>
                    </div>
                    <div>
                        <div>
                            <label className="label-names">First Name</label>
                            <input className="auth-input" name="First Name" required {...register('First Name', {
                                onChange: (e) => setFirstname(e.target.value)
                            })} />
                        </div>
                    </div>
                    <div>
                        <label className="label-names">Last Name</label>
                        <input className="auth-input" name="Last Name" required {...register('Last Name', {
                            onChange: (e) => setLastname(e.target.value)
                        })} />
                    </div>
                    <div>
                        <label className="label-names">Email</label>
                        <input className="auth-input" type="email" name="email"  required {...register('email', {
                            onChange: (e) => setEmail(e.target.value)
                        })} />
                    </div>
                    <div>
                        <label className="label-names">Password</label>
                        <input className="auth-input" type="password" name="password" required {...register('password', {
                            onChange: (e) => setPassword(e.target.value)
                        })} />
                    </div>
                    {error && <p>{error}</p>}
                    <button className="button-auth">Sign Up</button>
                    {/*<p className= "para">Already have an account? <Link to = "/SignIn"> Sign In </Link></p>*/}
                </form>
            </div>
        </div>
    )
}