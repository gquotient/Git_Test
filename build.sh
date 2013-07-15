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
# Remove existing components because bower is having issues
rm -r bower_components/
bower install -f

# Compile client app
echo ""
echo "********************"
echo "* Compiling app... *"
echo "********************"
echo ""

cd ../
r.js -o app.build.js

# Compile CSS
echo ""
echo "********************"
echo "* Compiling CSS... *"
echo "********************"
echo ""

stylus css -I ../node_modules/nib/lib --use url

# Restart server
echo ""
echo "************************"
echo "* Restarting server... *"
echo "************************"
echo ""

sudo /etc/init.d/intelligentarray restart
