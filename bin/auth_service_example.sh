#!/bin/bash

VENV_INIT="/usr/local/bin/virtualenvwrapper.sh"

AUTH_VENV="auth"
AUTH_TMP="/tmp/auth_service"
AUTH_PATH="../AuthService/auth_service"

if [ -f $VENV_INIT ]; then
  . $VENV_INIT
  workon $AUTH_VENV
fi

if [ ! -e $AUTH_TMP ]; then
  mkdir $AUTH_TMP
fi

cd $AUTH_PATH
python manage.py runserver
