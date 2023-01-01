function build_node_modules_lambda_layer() {
  echo "Create layers directory if it doesn't exist"
  mkdir -p layers

  echo "Cleaning up layer directory..."
  rm -rf layers/node-modules

  echo "Creating layer subdirectories..."
  mkdir -p layers/node-modules/nodejs  

  echo "Copying files..."	
  cp -r node_modules layers/node-modules/nodejs

  echo "Compressing layer..."
  pushd layers/node-modules && tar -zcf /tmp/nodejs.tar.gz . && mv /tmp/nodejs.tar.gz .

  echo "Cleaning up workspace ..."
  rm -rf nodejs

  echo "Stats"
  ls -lh nodejs.tar.gz

  echo "Done"
  popd
}
build_node_modules_lambda_layer