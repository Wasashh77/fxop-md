const fs = require("fs").promises;
const path = require("path");
const express = require("express");
const config = require("./config");
const { connect, writeSession, patch, parseDir, sleep } = require("./lib");
const { getandRequirePlugins } = require("./lib/database/plugins");

class BotSystem {
   constructor() {
      global.__basedir = __dirname;
      this.app = express();
      this.port = process.env.PORT || 3000;
   }

   async initialize() {
      try {
         await Promise.all([patch(), writeSession(), parseDir(path.join(__dirname, "/lib/database/")), parseDir(path.join(__dirname, "/plugins/")), this.ensureTempDir(), this.createGitignore()]);

         await sleep(2000);
         console.log("Syncing Database");
         await config.DATABASE.sync();
         await getandRequirePlugins();
         console.log("External Modules Installed");
         return await connect();
      } catch (error) {
         console.error("Initialization error:", error);
      }
   }

   startServer() {
      this.app.get("/", (req, res) => res.send("Bot Running"));
      this.app.listen(this.port, () => console.log(`Server running on port ${this.port}`));
   }

   async ensureTempDir() {
      const dir = path.join(__dirname, "temp");
      await fs.mkdir(dir, { recursive: true });
   }

   async createGitignore() {
      const content = `node_modules
.gitignore
session
.env
package-lock.json
database.db
temp`;
      await fs.writeFile(".gitignore", content);
      console.log(".gitignore file created successfully!");
   }

   async main() {
      try {
         await this.initialize();
         this.startServer();
      } catch (error) {
         console.warn("BOT SYSTEM FAILED", error);
      }
   }
}

new BotSystem().main();
