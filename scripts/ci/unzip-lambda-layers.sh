function unzip_lambda_layers(){
  # Unzip and remove the tar.gz files
  echo "Unzipping lambda layers..."
  for layer in $(ls layers); do
    echo "Unzipping $layer"
    pushd layers/$layer
    tar -xzf nodejs.tar.gz
    popd

    # echo "Removing $layer.tar.gz"
    # rm layers/$layer/nodejs.tar.gz    
  done
  
  echo "Done"
}
unzip_lambda_layers