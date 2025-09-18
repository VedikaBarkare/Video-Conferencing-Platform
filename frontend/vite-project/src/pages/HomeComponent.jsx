import React, { useContext } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import withAuth from "../utils/withAuth";
import IconButton from "@mui/material/IconButton";
import RestoreIcon from "@mui/icons-material/Restore";
import Button from "@mui/material/Button";
import "../App.css";
import logo3 from "../assets/undraw_calling_ieh0.png";
import { TextField } from "@mui/material";
import { AuthContext } from "../contexts/AuthContext";

function HomeComponent() {
  let navigate = useNavigate();
  const [meetingCode, setMettingCode] = useState("");

  const { addToUserHistory } = useContext(AuthContext);

  let handelJoinVideoCall = async () => {
    await addToUserHistory(meetingCode);
    navigate(`/${meetingCode}`);
  };

  return (
    <>
      <div className="navbar">
        <div style={{ display: "flex", alignItems: "center" }}>
          <h2>Apna College</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <IconButton
            onClick={() => {
              navigate("/history");
            }}
          >
            <RestoreIcon />
          </IconButton>
          <p>History</p>
          <Button
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/auth");
            }}
            style={{ color: "green" }}
          >
            LOGOUT
          </Button>
        </div>
      </div>
      <div className="meetContainer">
        <div className="left-panel">
          <div>
            <h2>Providing Qulity Video Call just like Quality Education</h2>

            <div style={{ display: "flex", gap: 10, padding: "20px" }}>
              <TextField
                id="outlined-basic"
                label="Meeting Code"
                onChange={(e) => setMettingCode(e.target.value)}
                variant="outlined"
              />

              <Button onClick={handelJoinVideoCall} variant="contained">
                Join
              </Button>
            </div>
          </div>
        </div>

        <div className="right-panel">
          <img src={logo3} alt="" />
        </div>
      </div>
    </>
  );
}

export default withAuth(HomeComponent);


