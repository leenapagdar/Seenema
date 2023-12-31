import React, {useContext, useState} from "react"
import {useForm} from "react-hook-form";
import "../css/Form.css";
import seenemaLogo from '../../assets/SeenemaLogo.png';
import {Link, Navigate} from "react-router-dom";
import {AuthContext} from "./AuthContext"

// component for user SignIn
export default function SignIn() {
    // State variables to handle the code
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const {register} = useForm();
    const {user, signIn} = useContext(AuthContext)

    // handles the submission of the form
    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")

        try {
            // try to signIn using provided email and password
            await signIn(email, password)
            setSuccess(true)
            // Redirect to the app's main page or dashboard
        } catch (err) {
            // Set the error message
            setError(err.message)
        }
    }

    if (user) {
        // Redirect to the home page
        return <Navigate to="/Homepage"/>
    }

    // renders signIn component
    return (
        <div className="bg-Poster">
            <div className="auth-Form">
                <div className="logo-auth">
                    <img
                        src={seenemaLogo}
                        alt={"Logo is here"}
                    />
                </div>
                {success && (
                    <Navigate to="/Homepage" replace={true}/>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="heading-auth">
                        <h2>Sign In</h2>
                    </div>
                    <div>
                        <label className="label-names">Email</label>
                        <input className="auth-input" name="email" placeholder="Enter your email"
                               required {...register('email', {
                            onChange: (e) => setEmail(e.target.value)
                        })} />
                    </div>
                    <div>
                        <label className="label-names">Password</label>
                        <input className="auth-input" name="password" type="password" placeholder="Enter your password"
                               required {...register('password', {
                            onChange: (e) => setPassword(e.target.value)
                        })} />
                    </div>
                    <p style={{marginTop: '20px', textAlign: 'left'}}><Link to="/forgotPassword"
                                                                            style={{color: 'inherit'}}>Forgot your
                        password?</Link></p>
                    {error && <p style={{paddingTop: "20px", color: "#E63946", textAlign: "left"}}>{error}</p>}
                    <button style={{marginTop: "30px", marginBottom: "20px"}} className="generic-button-auth button-auth">Sign In</button>
                </form>
                <hr/>
                <p style={{marginTop: '20px', textAlign: 'left'}}>Don't have an account yet? <Link to="/signUp"
                                                                                                   style={{color: 'inherit'}}>Sign
                    Up</Link></p>
                <hr/>
            </div>
        </div>
    )
}