function build_libs_lambda_layer() {
  echo "Create layers directory if it doesn't exist"
  mkdir -p layers

  echo "Cleaning up layer directory..."
  rm -rf layers/lib

  echo "Creating layer subdirectories..."
  mkdir -p layers/lib/nodejs/node_modules/@libs
  mv build/libs build/@libs

  echo "Copying files..."	
  cp -r build/@libs layers/lib/nodejs/node_modules

  echo "Compressing layer..."
  pushd layers/lib && tar -zcf /tmp/nodejs.tar.gz . && mv /tmp/nodejs.tar.gz .

  echo "Cleaning up workspace ..."
  rm -rf nodejs

  echo "Stats"
  ls -lh nodejs.tar.gz

  echo "Done"
  popd
}
build_libs_lambda_layer