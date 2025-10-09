#!/bin/sh
# entrypoint.sh

echo "Starting container and injecting environment variables into config.js..."

# Create config.js dynamically using the environment variables
cat <<EOF > /usr/share/nginx/html/config.js
// Auto-generated at container startup
export const backendUrl = "${BACKEND_URL}";
EOF

# Start NGINX
nginx -g "daemon off;"
