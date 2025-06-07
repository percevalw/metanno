#!/bin/bash

PID_PATH=/tmp/pret-jupyter-galata-app.pid
# Check node >= 20 (i'm not sure this is
# strictly necessary, but I think it will avoid a few headaches)
NODE_VERSION=$(node --version)
if [ "$(echo "${NODE_VERSION}\nv20" | sort -V|tail -1)" != "${NODE_VERSION}" ]; then
  echo "Node >= 20 is required"
  exit 1
fi
echo "Node version: $NODE_VERSION"

# Used to put playwrigth reports in a separate folder
PYTHON_VERSION=$(python --version | cut -d' ' -f2)
echo "Python version: $PYTHON_VERSION"
export PYTHON_VERSION

# Start Jupyter Lab, save the PID to stop it later, and store logs
export JUPYTERLAB_GALATA_ROOT_DIR=tests/jupyter
jupyter --version
jupyter labextension list
echo "Pret installed package"
pip show -f pret

JUPYTERLAB_VERSION=$(pip show jupyterlab -V | grep Version | cut -d' ' -f2)
if [ -z "$JUPYTERLAB_VERSION" ]; then
  echo "Jupyter Lab is not installed"
  exit 1
fi
echo "Jupyter Lab version: $JUPYTERLAB_VERSION"
# Will be read in *.spec.ts files
export JUPYTERLAB_VERSION

echo "Starting Jupyter Lab"
jupyter lab --config galata_config.py > /tmp/jupyter.log 2>&1 &
echo $! > $PID_PATH

# Wait for Jupyter Lab to start (check for "is running at:" in the logs)
while ! grep -q "is running at:" /tmp/jupyter.log; do
  # Check the app is running
  if ! kill -0 $(cat $PID_PATH) 2>/dev/null; then
    echo "Jupyter Lab failed to start"
    cat /tmp/jupyter.log
    exit 1
  fi
  sleep 1
done

# Run the tests
echo "Running playwright tests"
yarn playwright test tests/jupyter

# Store return code
RET_CODE=$?

# Stop Jupyter Lab
kill $(cat $PID_PATH)

# Return the return code
exit $RET_CODE
