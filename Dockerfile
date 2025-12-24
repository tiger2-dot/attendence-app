# Stage 1: Build the React application
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine
# Copy the built files from Stage 1 to Nginx folder
COPY --from=build /app/dist /usr/share/nginx/html
# Expose port 80
EXPOSE 80
# Start Nginx
CMD ["nginx", "-g", "daemon off;"]