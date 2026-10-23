// pm2 process file for the DM worker. Run from the repo root:
//   pm2 start deploy/oracle/ecosystem.config.cjs && pm2 save && pm2 startup
module.exports = {
  apps: [
    {
      name: "openreply-worker",
      cwd: __dirname + "/../..",
      script: "npm",
      args: "run worker",
      autorestart: true,
      max_restarts: 50,
      restart_delay: 5000,
      kill_timeout: 15000,
      max_memory_restart: "400M",
      env: { NODE_ENV: "production" },
    },
  ],
};
