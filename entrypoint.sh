#!/bin/bash
# Start the emulator in the background
emulator -avd test_avd -no-window -no-audio &

# Wait for the emulator to be ready
adb wait-for-device
until adb shell getprop sys.boot_completed | grep -m 1 "1"; do
    sleep 1
done
echo "Emulator is ready!"

# Start the Node.js app
node server.js
