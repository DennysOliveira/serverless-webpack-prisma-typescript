function build_prisma_lambda_layer() {
  echo "Create layers directory if it doesn't exist"
  mkdir -p layers

  echo "Cleaning up layer directory..."
  rm -rf layers/prisma-client

  echo "Creating layer subdirectories..."
  mkdir -p layers/prisma-client/nodejs/node_modules/.prisma
  mkdir -p layers/prisma-client/nodejs/node_modules/@prisma

  echo "Copying files..."	
  cp -r node_modules/.prisma/client layers/prisma-client/nodejs/node_modules/.prisma/client
  cp -r node_modules/@prisma layers/prisma-client/nodejs/node_modules

  echo "Compressing layer..."
  pushd layers/prisma-client && tar -zcf /tmp/nodejs.tar.gz . && mv /tmp/nodejs.tar.gz .

  echo "Cleaning up workspace ..."
  rm -rf nodejs

  echo "Stats"
  ls -lh nodejs.tar.gz

  popd

  echo "Done"
}
build_prisma_lambda_layer