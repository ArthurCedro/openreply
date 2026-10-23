// pm2 process file for the DM worker. Run from the repo root:
//   pm2 start deploy/oracle/ecosystem.config.cjs && pm2 save
//   pm2 startup   (then run the sudo command it prints, so pm2 starts on boot)
const path = require("node:path");
const root = path.join(__dirname, "..", "..");

module.exports = {
  apps: [
    {
      name: "openreply-worker",
      cwd: root,
      // Run tsx directly (not through npm) so pm2's SIGINT reaches the worker
      // and it can close BullMQ cleanly before exiting.
      script: path.join(root, "node_modules", ".bin", "tsx"),
      args: "--env-file-if-exists=.env worker/dm-worker.ts",
      autorestart: true,
      exp_backoff_restart_delay: 1000,
      kill_timeout: 15000,
      max_memory_restart: "400M",
      env: { NODE_ENV: "production" },
    },
  ],
};
