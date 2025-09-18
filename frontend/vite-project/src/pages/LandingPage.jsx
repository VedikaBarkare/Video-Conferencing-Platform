import React from "react";
import mobileImg from "../assets/mobile.png";

import "../App.css";
import { Link, useNavigate } from "react-router-dom";

function LandingPage() {
  const router = useNavigate();
  return (
    <div className="landingPageContainer">
      <nav>
        <div className="nav-header">
          <h2>Apna Video Call</h2>
        </div>
        <div className="nav-list">
          <p
            style={{ cursor: "pointer" }}
            onClick={() => {
              router("/aw123");
            }}
          >
            Join as Guest
          </p>
          <p
            style={{ cursor: "pointer" }}
            onClick={() => {
              router("/auth");
            }}
          >
            Register
          </p>
          <div
            style={{ cursor: "pointer" }}
            onClick={() => {
              router("/auth");
            }}
            role="button"
          >
            Login
          </div>
        </div>
      </nav>

      <div className="landingMainContainer">
        <div>
          <h1>
            <p>
              <span style={{ color: "orange" }}>Connect</span> to your loved
              ones
            </p>
          </h1>
          <p>Cover a distance by Apna Video Call</p>
          <div role="button">
            <Link to={"/home"}>Get Started</Link>
          </div>
        </div>
        <div>
          <img src={mobileImg} alt="" />
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
