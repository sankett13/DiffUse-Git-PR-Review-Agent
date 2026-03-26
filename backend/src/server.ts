import app from "./app.js";
import { ENV } from "./validations/env.schema.js";
import "./workers/reviewPR.js";
import "./workers/fixPR.js";

const PORT = ENV.PORT;

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log("Workers initialized and ready to process jobs");
  });
};

startServer();
