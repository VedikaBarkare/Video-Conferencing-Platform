import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";

import { connectToSocket } from "./controllers/socketManager.js";
import userRoute from "./routes/users.routes.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoute);

const startServer = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://vnbarkare:vgJHjfB0qhTBMpsL@cluster0.ew3mn8b.mongodb.net/",
      { useNewUrlParser: true, useUnifiedTopology: true }
    );

    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB", err);
    process.exit(1); // Stop if DB fails
  }
};

startServer();


// import express from "express";
// import { createServer } from "node:http";
// import mongoose from "mongoose";
// import cors from "cors";

// import { connectToSocket } from "./controllers/socketManager.js";
// import userRoute from "./routes/users.routes.js";

// const app = express();
// const server = createServer(app);
// connectToSocket(server);

// const PORT = process.env.PORT || 8000;

// // Middleware
// app.use(cors());
// app.use(express.json({ limit: "40kb" }));
// app.use(express.urlencoded({ limit: "40kb", extended: true }));

// Routes
// app.use("/api/v1/users", userRoute);

// Start server only after DB connects
// const startServer = async () => {
//   try {
//     await mongoose.connect(
//       "mongodb+srv://vnbarkare:vgJHjfB0qhTBMpsL@cluster0.ew3mn8b.mongodb.net/",
//       { useNewUrlParser: true, useUnifiedTopology: true }
//     );

//     server.listen(PORT, () => {
//       console.log(`✅ Server running on port ${PORT}`);
//     });
//   } catch (err) {
//     console.error("❌ Failed to connect to MongoDB", err);
//     process.exit(1); // Stop if DB fails
//   }
// };

// startServer();
