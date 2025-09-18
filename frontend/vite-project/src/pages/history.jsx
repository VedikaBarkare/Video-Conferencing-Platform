import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { IconButton } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";

export default function History() {
  const { getHistoryOfUser } = useContext(AuthContext);

  const [meetings, setMeetings] = useState([]);

  const routeTo = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser();
        console.log("Fetched history:", history);
        setMeetings(history);
      } catch {}
    };
    fetchHistory();
  }, []);

  let formatDate = (dataString) => {
    const date = new Date(dataString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  return (
    <div>
      <IconButton
        onClick={() => {
          routeTo("/home");
        }}
      >
        <HomeIcon />
      </IconButton>

      {meetings.length !== 0 ? (
        meetings.map((e, i) => {
          return (
            <>
              <Card key={i} sx={{ minWidth: 275 }}>
                <CardContent>
                  <Typography
                    gutterBottom
                    sx={{ color: "text.secondary", fontSize: 14 }}
                  >
                    Code : {e.meeting_code}
                  </Typography>

                  <Typography sx={{ color: "text.secondary", mb: 1.5 }}>
                    {formatDate(e.date)}
                  </Typography>
                </CardContent>
              </Card>
            </>
          );
        })
      ) : (
        <></>
      )}
    </div>
  );
}
