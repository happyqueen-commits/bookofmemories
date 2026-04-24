module.exports = {
  apps: [
    {
      name: "bookofmemories",
      script: "node_modules/next/dist/bin/next",
      args: "start -p ${PORT:-3000} -H ${HOST:-127.0.0.1}",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOST: "127.0.0.1"
      }
    }
  ]
};
