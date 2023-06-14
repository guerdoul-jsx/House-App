import React, { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ReactComponent as ArrowRightIcon } from "../assets/svg/keyboardArrowRightIcon.svg";
import visibilityIcon from "../assets/svg/visibilityIcon.svg";
import { signInWithEmailAndPassword, getAuth } from "firebase/auth";
import { firebaseApp } from "../firebase.config";
import { toast } from "react-toastify";
import Oauth from "../components/Oauth";

type SignInProps = {
  email: string;
  password: string;
};

const defaultState: SignInProps = {
  email: "",
  password: "",
};

const SignIn = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setformData] = useState(defaultState);

  const { email, password } = formData;

  const navigate = useNavigate();

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    setformData((prevState) => ({
      ...prevState,
      [event.target.id]: event.target.value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const auth = getAuth(firebaseApp);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      if (userCredential) {
        navigate("/");
      }
    } catch (error) {
      toast.error("User Crendential Wrong");
    }
  };

  return (
    <>
      <div className="pageContainer">
        <header>
          <p className="pageHeader">Welcome Back !</p>
        </header>
        <main>
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              className="emailInput"
              id="email"
              value={email}
              onChange={onChange}
            />
            <div className="passwordInputDiv">
              <input
                type={showPassword ? "text" : "password"}
                className="passwordInput"
                placeholder="Password"
                id="password"
                value={password}
                onChange={onChange}
              />
              <img
                src={visibilityIcon}
                alt="Show Passowrd"
                className="showPassword"
                onClick={() => setShowPassword((preState) => !preState)}
              />
            </div>
            <Link to="/forgot-password" className="forgotPasswordLink">
              Forgot Password
            </Link>
            <div className="signInBar">
              <p className="signInText">Sign In</p>
              <button className="signInButton">
                <ArrowRightIcon fill="#ffffff" width="34px" height="34px" />
              </button>
            </div>
          </form>
          {/* Google Oauth*/}
          <Oauth />
          <Link to="/sign-up" className="registerLink">
            Sign Up Instead
          </Link>
        </main>
      </div>
    </>
  );
};

export default SignIn;
