module.exports = {
  apps: [
    {
      name: "chat-guia-central",
      script: "server.js",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "150M",
      env: {
        NODE_ENV: "production",
        PORT: 3002,
      },
    },
  ],
};
