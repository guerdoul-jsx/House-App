import { FormEvent, ChangeEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ReactComponent as ArrowRightIcon } from "../assets/svg/keyboardArrowRightIcon.svg";
import visibilityIcon from "../assets/svg/visibilityIcon.svg";

import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { db, firebaseApp } from "../firebase.config";

import { doc, setDoc, serverTimestamp, FieldValue } from "firebase/firestore";
import { toast } from "react-toastify";
import Oauth from "../components/Oauth";

type SignInProps = {
  name: string;
  email: string;
  password: string;
};

export type formDataCopyProps = {
  name: string;
  email: string;
  password?: string;
  timestamp?: FieldValue;
};

const defaultState: SignInProps = {
  name: "",
  email: "",
  password: "",
};

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setformData] = useState(defaultState);

  const { name, email, password } = formData;

  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const auth = getAuth(firebaseApp);
      console.log("auth :", auth);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      console.log("Auth User", auth.currentUser);
      console.log("User", user);
      if (auth.currentUser) {
        updateProfile(auth.currentUser, {
          displayName: name,
        });
        navigate("/");
        setformData(defaultState);
      }

      const formDataCopy: formDataCopyProps = { ...formData };
      delete formDataCopy.password;

      formDataCopy.timestamp = serverTimestamp();

      await setDoc(doc(db, "users", user.uid), formDataCopy);
    } catch (error) {
      toast.error("Failed In Registration");
    }
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    setformData((prevState) => ({
      ...prevState,
      [event.target.id]: event.target.value,
    }));
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
              type="text"
              placeholder="Name"
              className="nameInput"
              id="name"
              value={name}
              onChange={onChange}
            />
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
            <div className="signUpBar">
              <p className="signUpText">Sign Up</p>
              <button className="signUpButton" type="submit">
                <ArrowRightIcon fill="#ffffff" width="34px" height="34px" />
              </button>
            </div>
          </form>
          {/* Google Oauth*/}
          <Oauth />
          <Link to="/sign-in" className="registerLink">
            Sign In Instead
          </Link>
        </main>
      </div>
    </>
  );
};

export default SignUp;
