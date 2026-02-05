#!/bin/sh

# Run migrations
echo "Running database migrations..."
npm run migrate

# Start the application
echo "Starting the application..."
npm start
