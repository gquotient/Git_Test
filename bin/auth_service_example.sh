#!/bin/bash

VENV_INIT="/usr/local/bin/virtualenvwrapper.sh"

AUTH_VENV="auth"
AUTH_TMP="/tmp/auth_service"
AUTH_PATH="../AuthService/auth_service"

redis-cli ping &> /dev/null
if [ $? -ne 0 ]; then
  echo "Redis is not currently running"
  ERROR=true
fi

psql -l &> /dev/null
if [ $? -ne 0 ]; then
  echo "Postgresql is not currently running"
  ERROR=true
fi

if [ $ERROR ]; then
  echo "Cannot start auth service"
  exit 1
fi

if [ -f $VENV_INIT ]; then
  . $VENV_INIT
  workon $AUTH_VENV
fi

if [ ! -e $AUTH_TMP ]; then
  mkdir $AUTH_TMP
fi

cd $AUTH_PATH
python manage.py runserver
