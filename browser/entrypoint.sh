#!/bin/bash
Xvfb :99 -screen 0 1280x960x24 &
export DISPLAY=:99
exec "$@"
node worker.js