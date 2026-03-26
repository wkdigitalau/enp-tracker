#!/bin/bash
set -e
APP_DIR=/opt/enp
APP_NAME=enp
DB_NAME=enp_db
DB_USER=enp_user
SUBDOMAIN=enp.digitalp.com.au
API_PORT=8003

echo "=== [1/8] Creating app directory ==="
mkdir -p $APP_DIR

echo "=== [2/8] Cloning repo (if not already cloned) ==="
if [ ! -d "$APP_DIR/.git" ]; then
  git clone https://github.com/wkdigitalau/enp-tracker.git $APP_DIR
else
  echo "Repo already cloned, pulling latest..."
  cd $APP_DIR && git pull origin main
fi
cd $APP_DIR

echo "=== [3/8] Setting up PostgreSQL database ==="
DB_PASS=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;" 2>/dev/null || true

echo "=== [4/8] Creating .env file ==="
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
cat > $APP_DIR/.env << EOF
NODE_ENV=production
PORT=$API_PORT
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME
SESSION_SECRET=$SESSION_SECRET
EOF
echo ".env created. Database password: $DB_PASS"
echo "SAVE THESE CREDENTIALS SECURELY!"

echo "=== [5/8] Installing Node dependencies ==="
npm install --production=false

echo "=== [6/8] Pushing database schema ==="
npx drizzle-kit push

echo "=== [7/8] Building application ==="
npm run build

echo "=== [8/8] Configuring Supervisor and Nginx ==="
cp $APP_DIR/deploy/enp.supervisor.conf /etc/supervisor/conf.d/$APP_NAME.conf
supervisorctl reread
supervisorctl update
supervisorctl start $APP_NAME || supervisorctl restart $APP_NAME

cp $APP_DIR/deploy/enp.nginx.conf /etc/nginx/sites-available/$APP_NAME
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/$APP_NAME
nginx -t && systemctl reload nginx

echo ""
echo "=== Setup complete! ==="
supervisorctl status $APP_NAME
echo ""
echo "Next step: Get SSL certificate:"
echo "  certbot --nginx -d $SUBDOMAIN"
echo ""
echo "App will be live at: https://$SUBDOMAIN"

