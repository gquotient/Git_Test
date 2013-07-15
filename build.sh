# Install server deps
echo "*************************************"
echo "* Installing server dependencies... *"
echo "*************************************"

npm install

# Navigate to client app and install deps
echo "*************************************"
echo "* Installing client dependencies... *"
echo "*************************************"

cd public/app
bower install

# Compile client app
echo "********************"
echo "* Compiling app... *"
echo "********************"

cd ../
r.js -o app.build.js

# Compile CSS
echo "********************"
echo "* Compiling CSS... *"
echo "********************"

stylus css -I ../node_modules/nib/lib --use url

# Restart server
echo "************************"
echo "* Restarting server... *"
echo "************************"

/etc/init.d/app.stage.intelligentarray.com restart
