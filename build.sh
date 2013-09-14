echo ""
echo "**************************"
echo "* Build IA Client App... *"
echo "**************************"
echo ""


# Install server deps
echo ""
echo "*************************************"
echo "* Installing server dependencies... *"
echo "*************************************"
echo ""

npm install
npm update

# Navigate to client app and install deps
echo ""
echo "*************************************"
echo "* Installing client dependencies... *"
echo "*************************************"
echo ""

cd public/app
bower install
bower update

# Compile client app
echo ""
echo "********************"
echo "* Compiling app... *"
echo "********************"
echo ""

cd ../../
grunt build

# Restart server
echo ""
echo "************************"
echo "* Restarting server... *"
echo "************************"
echo ""

sudo /etc/init.d/intelligentarray restart
