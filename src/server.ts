import 'dotenv/config';
import { app } from "./app";

const PORT = parseInt(process.env.PORT || "3000", 10);
const server = app.listen(PORT, () => console.log(`server running on port ${PORT}`));

// Protege contra Slow Loris: fecha conexões inativas após 30s
server.headersTimeout  = 30_000;
server.requestTimeout  = 30_000;