FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY ./pages/index.html /usr/share/nginx/html/index.html
COPY ./pages/data-viewer.html /usr/share/nginx/html/data-viewer.html
COPY ./pages/exo.html /usr/share/nginx/html/exo.html

COPY ./src /usr/share/nginx/html/src
COPY ./assets /usr/share/nginx/html/assets
COPY ./css /usr/share/nginx/html/css
COPY ./pages /usr/share/nginx/html/pages
COPY ./assets/favicon.ico /usr/share/nginx/html/favicon.ico

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]