import app from "./app.js";
import { ENV } from "./validations/env.schema.js";
const PORT = ENV.PORT;

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

startServer();
