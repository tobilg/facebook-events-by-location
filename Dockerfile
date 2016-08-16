FROM mhart/alpine-node:4
MAINTAINER tobilg <fb.tools.github@gmail.com>

# Overall ENV vars
ENV APP_BASE_PATH /opt/service
ENV NODE_ENV production

# Create folder for app
RUN mkdir -p $APP_BASE_PATH

# Add files
ADD . $APP_BASE_PATH

# Set working directory
WORKDIR $APP_BASE_PATH

# Setup of the configurator
RUN chmod +x index.js && \
    npm install

CMD ["node", "/opt/service/index.js"]