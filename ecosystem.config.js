module.exports = {
  apps: [
    {
      name: 'smartpos-backend',
      cwd: '/home/ali/dokon/backend',
      script: 'venv/bin/uvicorn',
      args: 'app.main:app --host 0.0.0.0 --port 8000',
      interpreter: 'none',
      env: {
        // Database Configuration - environment variables dan olinadi
        DATABASE_URL: process.env.DATABASE_URL || '',
        POSTGRES_USER: process.env.POSTGRES_USER || '',
        POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || '',
        POSTGRES_SERVER: process.env.POSTGRES_SERVER || '',
        POSTGRES_PORT: process.env.POSTGRES_PORT || '5432',
        POSTGRES_DB: process.env.POSTGRES_DB || 'smartpos',
        SECRET_KEY: process.env.SECRET_KEY || 'smartpos-secret-key-change-in-production',
        // Azure PostgreSQL SSL Configuration (psycopg2 uses sslmode=require in URL)
        AZURE_POSTGRES_CA_PATH: process.env.AZURE_POSTGRES_CA_PATH || '/home/ali/dokon/backend/certs/DigiCertGlobalRootG2.crt.pem',  // Optional: Path to Azure root CA
        ENVIRONMENT: process.env.ENVIRONMENT || 'development',  // Set to 'production' for full SSL verification
        // Azure OpenAI Configuration - environment variables dan olinadi
        AZURE_OPENAI_ENDPOINT: process.env.AZURE_OPENAI_ENDPOINT || '',
        AZURE_OPENAI_API_KEY: process.env.AZURE_OPENAI_API_KEY || '',
        AZURE_OPENAI_DEPLOYMENT_NAME: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o',
        AZURE_OPENAI_API_VERSION: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/home/ali/dokon/logs/backend-error.log',
      out_file: '/home/ali/dokon/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'smartpos-frontend',
      cwd: '/home/ali/dokon/frontend',
      script: 'npm',
      args: 'run dev -- --hostname 0.0.0.0 --port 3000',
      instances: 1,
      autorestart: true,
      watch: false,
      error_file: '/home/ali/dokon/logs/frontend-error.log',
      out_file: '/home/ali/dokon/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
