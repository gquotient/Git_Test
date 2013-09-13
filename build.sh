VERSION="0.1.1"

# Install server deps
echo ""
echo "*************************************"
echo "* Installing server dependencies... *"
echo "*************************************"
echo ""

npm install

# Navigate to client app and install deps
echo ""
echo "*************************************"
echo "* Installing client dependencies... *"
echo "*************************************"
echo ""

cd public/app
bower install
bower update

# Make compile dir
echo ""
echo "***********************"
echo "* Make compile dir... *"
echo "***********************"
echo ""

cd ../
mkdir build
mkdir build/$VERSION

# Compile client app
echo ""
echo "********************"
echo "* Compiling app... *"
echo "********************"
echo ""

r.js -o app.build.js

# Compile CSS
echo ""
echo "********************"
echo "* Compiling CSS... *"
echo "********************"
echo ""

stylus css -I ../node_modules/nib/lib --use url

# Copy files to version folder
echo ""
echo "******************************"
echo "* Copying Versioned Files... *"
echo "******************************"
echo ""

cp -r css build/$VERSION/css
cp -r img build/$VERSION/img

# Restart server
echo ""
echo "************************"
echo "* Restarting server... *"
echo "************************"
echo ""

#sudo /etc/init.d/intelligentarray restart
