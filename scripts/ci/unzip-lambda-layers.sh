function unzip_lambda_layers(){
  # Unzip and remove the tar.gz files
  # layers will be at ./build/layers/layer_name

  echo "Unzipping lambda layers..."

  for layer in $(ls build/layers); do
    echo "Unzipping $layer"
    pushd build/layers/$layer
    tar -xzf nodejs.tar.gz
    popd

    echo "Removing $layer.tar.gz"
    rm build/layers/$layer/nodejs.tar.gz    
  done

  echo "Done"

  

  # echo "Unzipping lambda layers..."
  # for layer in $(ls build/layers); do
  #   echo "Unzipping $layer"
  #   pushd layers/$layer
  #   tar -xzf nodejs.tar.gz
  #   popd

  #   # echo "Removing $layer.tar.gz"
  #   # rm layers/$layer/nodejs.tar.gz    
  # done
  
  # echo "Done"
}
unzip_lambda_layers