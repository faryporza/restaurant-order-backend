# Restaurant Order Backend Deployment Guide

## Production Deployment

### 1. Environment Setup

Create a production `.env` file:

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-very-secure-jwt-secret-key-for-production

# Database Configuration
DB_HOST=your-production-db-host
DB_PORT=3306
DB_USER=your-db-username
DB_PASSWORD=your-secure-db-password
DB_NAME=restaurant_db
DB_SSL=true

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com
```

### 2. Database Setup

1. Create your production database
2. Run the migration script:
```bash
npm run db:migrate
```

3. Create an admin user:
```bash
npm run create-admin
```

### 3. Security Considerations

- Use strong JWT secrets (at least 32 characters)
- Enable HTTPS in production
- Configure proper CORS origins
- Use environment variables for all sensitive data
- Enable database SSL
- Implement rate limiting (consider adding express-rate-limit)

### 4. Performance Optimization

- Use PM2 for process management
- Enable gzip compression
- Set up proper database indexes
- Configure connection pooling
- Use CDN for static assets

### 5. PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'restaurant-backend',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

Start with PM2:
```bash
pm2 start ecosystem.config.js --env production
```

### 6. Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN mkdir -p uploads logs

EXPOSE 3000

USER node

CMD ["npm", "start"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    restart: unless-stopped
    depends_on:
      - db
  
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: restaurant_db
      MYSQL_USER: restaurant_user
      MYSQL_PASSWORD: restaurant_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

volumes:
  mysql_data:
```

### 7. Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /path/to/your/app/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 8. Health Checks

Add health check endpoint to your application:

```javascript
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### 9. Logging

Consider adding structured logging with winston:

```bash
npm install winston
```

### 10. Monitoring

- Set up application monitoring (e.g., New Relic, DataDog)
- Monitor database performance
- Set up alerts for errors and performance issues
- Monitor disk space for uploads directory

### 11. Backup Strategy

- Regular database backups
- Backup uploaded files
- Test restore procedures
- Document backup and restore processes

### 12. SSL/TLS

- Use Let's Encrypt for free SSL certificates
- Configure HTTPS redirects
- Set security headers (helmet.js)

### 13. Environment-specific Configurations

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

### 14. Scaling Considerations

- Use load balancers for multiple instances
- Consider database read replicas
- Implement caching (Redis)
- Use CDN for static assets
- Monitor and scale based on metrics
