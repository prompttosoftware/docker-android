FROM ubuntu:20.04

# Prevent interactive prompts during installation
ENV DEBIAN_FRONTEND=noninteractive

# Install required packages
RUN apt-get update && apt-get install -y \
    curl \
    git \
    wget \
    unzip \
    openjdk-11-jdk \
    nodejs \
    npm \
    libpulse0 \
    libc++1 \
    libc++abi1 \
    libglu1 \
    libxcursor1 \
    libxi6 \
    libxrender1 \
    libxtst6 \
    qemu-kvm \
    libvirt-daemon-system \
    bridge-utils \
    && apt-get clean

# Set up Android SDK
ENV ANDROID_HOME /opt/android-sdk
ENV PATH ${PATH}:${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools

RUN mkdir -p ${ANDROID_HOME}/cmdline-tools
WORKDIR ${ANDROID_HOME}/cmdline-tools

# Download and install Android SDK
RUN wget https://dl.google.com/android/repository/commandlinetools-linux-7583922_latest.zip -O cmdlinetools.zip \
    && unzip cmdlinetools.zip \
    && mv cmdline-tools latest \
    && rm cmdlinetools.zip

# Accept licenses before installing components
RUN yes | sdkmanager --licenses

# Install Android components
RUN sdkmanager "platform-tools" "platforms;android-30" "build-tools;30.0.3" "emulator" "system-images;android-30;google_apis;x86_64"

# Create an AVD for testing
RUN echo "no" | avdmanager create avd -n test_avd -k "system-images;android-30;google_apis;x86_64"

# Set up Node.js app
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .

# Expose port for Express server
EXPOSE 3000

# Start the Node.js application
CMD ["node", "server.js"]
